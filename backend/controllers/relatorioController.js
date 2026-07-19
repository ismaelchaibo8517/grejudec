const { Estudante, Curso, Pagamento } = require("../models");
const { Op } = require("sequelize");

// Relatório financeiro de propinas para o painel de Admin
exports.obterRelatorioFinanceiroAdmin = async (req, res, next) => {
  try {
    // 1. Definição cronológica (Dinâmica para o ano de 2026)
    const listaMeses = [
      "janeiro", "fevereiro", "março", "abril", 
      "maio", "junho", "julho", "agosto", 
      "setembro", "outubro", "novembro", "dezembro"
    ];
    
    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const indexMesAtual = dataAtual.getMonth(); // ex: 0 = Janeiro, 6 = Julho
    
    // Filtra os meses que o estudante já devia ter pago até ao momento
    const mesesDevidosAteHoje = listaMeses.slice(0, indexMesAtual + 1);

    // 2. Buscar todos os estudantes ativos com os seus respetivos cursos
    const estudantes = await Estudante.findAll({
      where: { ativo: true },
      include: [
        {
          model: Curso,
          attributes: ["id", "nome"], // Puxa apenas o necessário do curso
          where: { ativo: true },
          required: false // Mantém o estudante listado mesmo se houver inconformidade no curso
        }
      ],
      order: [["nomeCompleto", "ASC"]]
    });

    // 3. Buscar todos os pagamentos de propina bem-sucedidos do ano corrente
    const pagamentosDoAno = await Pagamento.findAll({
      where: {
        tipoServico: "propina",
        status: "pago",
        anoReferencia: anoAtual,
        ativo: true
      }
    });

    // 4. Cruzar dados em memória para gerar o relatório consolidado
    const relatorio = estudantes.map((estudante) => {
      // Filtra os pagamentos efetuados especificamente por este estudante
      const pagamentosDesteEstudante = pagamentosDoAno.filter(
        (p) => p.estudanteId === estudante.id
      );

      // Mapeia quais os meses que ele já pagou (normalizado para letras minúsculas)
      const mesesPagos = pagamentosDesteEstudante.map((p) => 
        p.mesReferencia.toLowerCase().trim()
      );

      // CORREÇÃO: Alterado de !mesPagos para !mesesPagos
      const mesesAtrasados = mesesDevidosAteHoje.filter(
        (mes) => !mesesPagos.includes(mes.toLowerCase().trim())
      );

      // Retorna a estrutura limpa com dados pessoais e o balanço financeiro
      return {
        estudanteId: estudante.id,
        numeroMatricula: estudante.numeroMatricula, // CORREÇÃO: Alterado de estudiante para estudante
        nomeCompleto: estudante.nomeCompleto,
        numBi: estudante.numBi,
        telefone: estudante.telefone || "N/A",
        statusMatricula: estudante.statusMatricula,
        curso: estudante.Curso ? estudante.Curso.nome : "Sem Curso Atribuído",
        financeiro: {
          anoLetivo: anoAtual,
          mesesLiquidados: mesesPagos,
          mesesEmAtraso: mesesAtrasados,
          totalMesesAtrasados: mesesAtrasados.length,
          situacaoRegular: mesesAtrasados.length === 0
        }
      };
    });

    // 5. Retorno estruturado para o teu frontend alimentar as tabelas/filtros
    return res.status(200).json({
      success: true,
      anoCorrente: anoAtual,
      totalEstudantesAnalisados: relatorio.length,
      dados: relatorio
    });

  } catch (error) {
    console.error("Erro ao gerar relatório financeiro:", error);
    next(error);
  }
};