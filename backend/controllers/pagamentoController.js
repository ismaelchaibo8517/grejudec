const { Pagamento, Estudante, sequelize , TransacaoPagamento} = require("../models");
const axios = require("axios");

module.exports = {
async gerarPagamento(req, res) {
    const VALOR_PROPINA = 5.0; // Valor fixo conforme solicitado
    // 1. Extrair o método de pagamento enviado pelo frontend
    const { estudanteId, method } = req.body; 

    // VALIDAÇÃO: Garante que o método é um dos três suportados pela PaySuite
    const metodosValidos = ["mpesa", "emola", "credit_card"];
    if (method && !metodosValidos.includes(method)) {
      return res.status(400).json({ 
        erro: "Método de pagamento inválido. Escolha entre 'mpesa', 'emola' ou 'credit_card'." 
      });
    }

    // NOVA VALIDAÇÃO: Verifica se o estudante realmente existe
    const estudanteExiste = await Estudante.findByPk(estudanteId);
    if (!estudanteExiste) {
      return res.status(404).json({ erro: "Estudante não encontrado na base de dados." });
    }

    // Gerar o mês e ano atuais para a verificação e o registo
    const mesAtual = new Date().toLocaleString('pt-MZ', { month: 'long' });
    const anoAtual = new Date().getFullYear();

    // 🔍 NOVA VALIDAÇÃO: Verifica se já existe um pagamento com status "pago" para este mês/ano
    const propinaJaPaga = await Pagamento.findOne({
      where: {
        estudanteId: estudanteId,
        tipoServico: "propina",
        mesReferencia: mesAtual,
        anoReferencia: anoAtual,
        status: "pago" // Garante que só bloqueia se o status no banco for realmente concluído/pago
      }
    });

    if (propinaJaPaga) {
      return res.status(400).json({ 
        erro: `A propina para o mês de ${mesAtual} de ${anoAtual} já se encontra paga. Não é necessário repetir.` 
      });
    }

    const t = await sequelize.transaction();

    try {
      // Criar Referência Única
      const referencia = `GRJ${Date.now()}`;

      // 2. CRIAR O REGISTO NO BANCO
      const novoPagamento = await Pagamento.create(
        {
          estudanteId: estudanteId,
          tipoServico: "propina",
          valor: VALOR_PROPINA,
          referencia: referencia,
          status: "pendente",
          mesReferencia: mesAtual,
          anoReferencia: anoAtual,
          descricao: `Pagamento de propina - ${mesAtual}/${anoAtual}`,
        },
        { transaction: t }
      );

      // 3. SOLICITAR CHECKOUT À PAYSUITE COM O MÉTODO DINÂMICO
      const response = await axios.post(
        "https://paysuite.tech/api/v1/payments",
        {
          amount: VALOR_PROPINA,
          reference: referencia,
          description: `Propina - ${mesAtual}`,
          method: method, // Agora o valor vem diretamente do req.body
          return_url: "https://dinah-ectomorphic-coralie.ngrok-free.dev/api/pagamentos/sucesso",
          cancel_url: "https://dinah-ectomorphic-coralie.ngrok-free.dev/api/pagamentos/cancelado",
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSUITE_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      // 4. ATUALIZAR URL DE CHECKOUT NO BANCO
      await novoPagamento.update(
        { url_checkout: response.data.data.checkout_url },
        { transaction: t }
      );

      await t.commit();

      return res.status(201).json({
        sucesso: true,
        checkout_url: response.data.data.checkout_url,
        referencia: referencia,
      });

    } catch (err) {
      if (t) await t.rollback();

      console.error("Erro no fluxo de pagamento:", err.response?.data || err.message);

      const mensagemErro = err.response?.data?.message || "Erro ao processar pagamento.";
      return res.status(err.response?.status || 500).json({
        erro: `PaySuite: ${mensagemErro}`,
      });
    }
  },

async webhookPaySuite(req, res) {
    const { event, data } = req.body;
    const assinatura = req.headers["x-webhook-signature"];
    const secret = process.env.PAYSUITE_WEBHOOK_SECRET;

    // 1. Validação de Segurança (HMAC)
    if (assinatura && secret) {
      const crypto = require("crypto");
      const payload = JSON.stringify(req.body);
      const hashCalculado = crypto.createHmac("sha256", secret).update(payload).digest("hex");

      if (hashCalculado !== assinatura) {
        console.error("ALERTA: Tentativa de webhook com assinatura inválida!");
        return res.status(401).json({ erro: "Assinatura inválida" });
      }
    }

    try {
      if (!data || !event) return res.status(200).send("OK - Sem dados");

      const { reference, transaction, id } = data;

      // 2. Localizar o Pagamento
      const pagamento = await Pagamento.findOne({ where: { referencia: reference } });

      if (!pagamento) {
        console.log(`⚠️ Webhook recebido para referência não encontrada: ${reference}`);
        return res.status(200).send("Referência não encontrada");
      }

      // TRUQUE DE SEGURANÇA: Se já está pago, não altera mais o status!
      if (pagamento.status === "pago") {
        console.log(`ℹ️ [Webhook] Pagamento ${reference} já consta como PAGO. Ignorando evento antigo (${event}).`);
        return res.status(200).send("OK - Já processado");
      }

      // 3. Registrar o Log bruto na tabela TransacaoPagamento
      await TransacaoPagamento.create({
        pagamento_id: pagamento.id,
        referenciaTransacao: transaction?.id || id, 
        metodo: transaction?.method || "desconhecido", 
        status: event,
        payloadWebhookBruto: req.body 
      });

      // 4. Atualizar o status do Pagamento baseado no evento
      if (event === "payment.success" || event === "pagamento.sucesso") {
        await pagamento.update({ status: "pago" });
        console.log(`✅ Pagamento ${reference} confirmado com sucesso.`);
      } else if (event === "payment.failed" || event === "pagamento.falhou") {
        await pagamento.update({ status: "falhado" });
        console.log(`❌ Pagamento ${reference} falhou.`);
      }

      return res.status(200).send("OK");

    } catch (err) {
      console.error("Erro no processamento do Webhook:", err);
      return res.status(500).json({ erro: "Erro interno no servidor" });
    }
  },

  // ROTA DE REDIRECIONAMENTO (GET /api/pagamentos/sucesso)
  async sucessoPagamento(req, res) {
    try {
      // Vamos inspecionar o que a PaySuite anexa na URL do navegador
      console.log("🔍 Parâmetros recebidos na URL de redirecionamento:", req.query);

      // Tenta apanhar por múltiplos nomes possíveis que a API use
      const reference = req.query.reference || req.query.id || req.query.ref;

      console.log(`🔄 Utilizador redirecionado após checkout. Referência identificada: ${reference}`);

      // Redireciona para o teu Frontend React passando a referência encontrada
      return res.redirect(`http://localhost:5173/estudante/pagamentos || ''}`);
      
    } catch (err) {
      console.error("Erro no redirecionamento de sucesso:", err);
      return res.status(500).send("Erro ao processar o retorno do pagamento.");
    }
  },

  async consultarStatus(req, res) {
    try {
      const { referencia } = req.params; // Captura o "GRJ..." enviado pelo frontend

      // 1. Procura o pagamento no banco usando a referência alfanumérica
      const pagamento = await Pagamento.findOne({ where: { referencia } });

      if (!pagamento) {
        return res.status(404).json({ erro: "Pagamento não encontrado" });
      }

      // 2. Se o status for "pendente", valida se já expirou (Lazy Timeout de 15 minutos)
      if (pagamento.status === "pendente") {
        const dataCriacao = pagamento.createdAt || pagamento.created_at;
        const quinzeMinutosAtras = new Date(Date.now() - 15 * 60 * 1000);

        // Se a data do banco for mais antiga do que 15 minutos atrás, marca como falhado
        if (new Date(dataCriacao) < quinzeMinutosAtras) {
          await pagamento.update({ status: "falhado" });
          console.log(`⏱️ Referência ${referencia} expirou o tempo limite e foi alterada para 'falhado'.`);
          return res.status(200).json({ status: "falhado" });
        }
      }

      // 3. Devolve o status real (pago, falhado ou pendente)
      return res.status(200).json({ status: pagamento.status });

    } catch (err) {
      console.error("Erro ao consultar status da propina:", err);
      return res.status(500).json({ erro: "Erro interno no servidor" });
    }
  },



  // estantes 



// Obter histórico de pagamentos do estudante logado
async listarPagamentosEstudante(req, res) {
  try {
    const usuarioId = req.usuario.id; // ID do utilizador vindo do token

    // 1. Buscar o registo do estudante ativo usando 'usuario_id' (snake_case)
    const estudante = await Estudante.findOne({
      where: { 
        usuario_id: usuarioId, // 💡 CORREÇÃO AQUI: Mudado para bater com o Postgres
        ativo: true 
      }
    });

    // 2. Validação: Se o estudante não existir ou não estiver ativo
    if (!estudante) {
      return res.status(404).json({ 
        erro: "Estudante não encontrado ou a tua conta encontra-se inativa." 
      });
    }

    // 3. Listar os pagamentos usando o ID do estudante
    const pagamentos = await Pagamento.findAll({
      where: { 
        estudante_id: estudante.id, 
        ativo: true 
      },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(pagamentos);
  } catch (err) {
    console.error("Erro ao listar pagamentos do estudante:", err);
    return res.status(500).json({ erro: "Erro ao carregar histórico de pagamentos." });
  }
},


};