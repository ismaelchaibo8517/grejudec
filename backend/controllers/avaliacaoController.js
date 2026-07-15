const { Avaliacao, Disciplina, Estudante , MediaFinal } = require("../models");
const Joi = require("joi");


const avaliacaoSchema = Joi.object({
  estudanteId: Joi.number().integer().positive().required().messages({
    "number.base": "O ID do estudante deve ser um número válido.",
    "number.positive": "O ID do estudante deve ser um valor positivo.",
    "any.required": "O estudante é obrigatório."
  }),

  disciplinaId: Joi.number().integer().positive().required().messages({
    "number.base": "O ID da disciplina deve ser um número válido.",
    "number.positive": "O ID da disciplina deve ser um valor positivo.",
    "any.required": "A disciplina é obrigatória."
  }),

  anoLetivo: Joi.number().integer().min(2020).max(2050).required().messages({
    "number.base": "O ano letivo deve ser um número.",
    "number.min": "O ano letivo deve ser igual ou superior a 2020.",
    "number.max": "O ano letivo é inválido.",
    "any.required": "O ano letivo é obrigatório."
  }),

  // Notas: Mensagens unificadas para facilitar a leitura
  teste1: Joi.number().min(0).max(20).precision(2).optional().messages({
    "number.min": "A nota do Teste 1 não pode ser negativa.",
    "number.max": "A nota do Teste 1 deve estar entre 0 e 20.",
    "number.base": "A nota do Teste 1 deve ser um número."
  }),
  teste2: Joi.number().min(0).max(20).precision(2).optional().messages({
    "number.min": "A nota do Teste 2 não pode ser negativa.",
    "number.max": "A nota do Teste 2 deve estar entre 0 e 20.",
    "number.base": "A nota do Teste 2 deve ser um número."
  }),
  teste3: Joi.number().min(0).max(20).precision(2).optional().messages({
    "number.min": "A nota do Teste 3 não pode ser negativa.",
    "number.max": "A nota do Teste 3 deve estar entre 0 e 20.",
    "number.base": "A nota do Teste 3 deve ser um número."
  }),
  exame: Joi.number().min(0).max(20).precision(2).optional().messages({
    "number.min": "A nota do Exame não pode ser negativa.",
    "number.max": "A nota do Exame deve estar entre 0 e 20.",
    "number.base": "A nota do Exame deve ser um número."
  }),
  recorrencia: Joi.number().min(0).max(20).precision(2).optional().messages({
    "number.min": "A nota da Recorrência não pode ser negativa.",
    "number.max": "A nota da Recorrência deve estar entre 0 e 20.",
    "number.base": "A nota da Recorrência deve ser um número."
  }),

  dataAvaliacao: Joi.date().iso().optional().messages({
    "date.format": "A data deve estar no formato AAAA-MM-DD (ex: 2026-07-14)."
  })
});

// 1. Função de cálculo (fora da rota para ser reutilizável)
const calcularSituacaoDoAluno = (dados) => {
  const t1 = Number(dados.teste1) || 0;
  const t2 = Number(dados.teste2) || 0;
  const t3 = Number(dados.teste3) || 0;
  const notaExame = dados.exame != null ? Number(dados.exame) : null;

  const mediaFreq = (t1 + t2 + t3) / 3;

  let statusFinal = "";
  let mediaFinal = null;

  if (mediaFreq < 10) {
    statusFinal = "Excluído";
    mediaFinal = mediaFreq;
  } else {
    if (notaExame === null) {
      statusFinal = "Admitido";
      mediaFinal = mediaFreq;
    } else {
      mediaFinal = (mediaFreq + notaExame) / 2;
      statusFinal = mediaFinal >= 10 ? "Aprovado" : "Reprovado";
    }
  }

  return {
    mediaFrequencia: mediaFreq.toFixed(2),
    mediaFinal: mediaFinal.toFixed(2),
    status: statusFinal,
  };
};

// 1. Criar ou Atualizar Avaliação (Upsert)
exports.criarAvaliacao = async (req, res, next) => {
  try {
    const { error, value } = avaliacaoSchema.validate(req.body);
    if (error) return next(new Error(error.details[0].message));

    // Verificar se a disciplina e o estudante existem
    const disciplina = await Disciplina.findOne({ where: { id: value.disciplinaId, ativo: true } });
    const estudante = await Estudante.findOne({ where: { id: value.estudanteId, ativo: true } });

    if (!disciplina || !estudante) {
      const err = new Error("Disciplina ou Estudante não encontrados.");
      err.status = 404;
      return next(err);
    }

    // Preparar dados para o Upsert
    const dadosParaSalvar = {
      estudante_id: value.estudanteId,
      disciplina_id: value.disciplinaId,
      ano_letivo: value.anoLetivo,
      teste1: value.teste1,
      teste2: value.teste2,
      teste3: value.teste3,
      exame: value.exame,
      recorrencia: value.recorrencia,
      data_avaliacao: value.dataAvaliacao // Ajusta para o nome da coluna no banco
    };

    // Upsert: Cria se não existir, atualiza se já existir
    const [avaliacao, criado] = await Avaliacao.upsert(dadosParaSalvar);

    console.log("Valores recebidos para cálculo:", { 
      t1: dadosParaSalvar.teste1, 
      t2: dadosParaSalvar.teste2, 
      t3: dadosParaSalvar.teste3 
    });

    // --- NOVA PARTE: Calcular e Gravar Média ---
    const situacao = calcularSituacaoDoAluno(dadosParaSalvar);

    await MediaFinal.upsert({
      estudante_id: value.estudanteId,
      disciplina_id: value.disciplinaId,
      ano_letivo: value.anoLetivo,
      mediaFrequencia: situacao.mediaFrequencia,
      mediaFinal: situacao.mediaFinal,
      status: situacao.status,
    });
    
    return res.status(200).json({
      success: true,
      alert: {
        type: "success",
        message: criado ? "Avaliação Criada" : "Avaliação Atualizada",
        description: criado ? "Avaliação criada com sucesso." : "Notas atualizadas com sucesso."
      },
      avaliacao
    });
  } catch (error) {
    console.error("--- ERRO DETALHADO DO SEQUELIZE ---");
    console.error(error.message);
    next(error);
  }
};

// 2. Listar Avaliações (Continua igual)
exports.listarAvaliacoes = async (req, res, next) => {
  try {
    const { disciplinaId, estudanteId } = req.query;
    const whereClause = { ativo: true };
    if (disciplinaId) whereClause.disciplina_id = disciplinaId; // Ajustado nome da coluna
    if (estudanteId) whereClause.estudante_id = estudanteId;   // Ajustado nome da coluna

    const avaliacoes = await Avaliacao.findAll({ where: whereClause });
    return res.status(200).json(avaliacoes);
  } catch (error) { next(error); }
};

// 4. Deletar (Soft Delete)
exports.deletarAvaliacao = async (req, res, next) => {
  try {
    const { id } = req.params;
    const avaliacao = await Avaliacao.findByPk(id); // Mais simples para encontrar pelo PK
    
    if (!avaliacao) return next(new Error("Avaliação não encontrada."));

    await avaliacao.update({ ativo: false });
    return res.status(200).json({ 
      success: true,
      alert: {
        type: "success",
        message: "Avaliação Removida",
        description: "Avaliação removida."
      }
    });
  } catch (error) { next(error); }
};

// 3. Atualizar Nota
exports.atualizarAvaliacao = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 1. Procurar a avaliação
    const avaliacao = await Avaliacao.findOne({ where: { id, ativo: true } });
    if (!avaliacao) {
      const err = new Error("Avaliação não encontrada ou inativa.");
      err.status = 404;
      return next(err);
    }

    // 2. Validar com Joi
    const { error, value } = avaliacaoSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const err = new Error(error.details.map(d => d.message).join(', '));
      err.status = 400;
      return next(err);
    }

    // 3. Mapear para as colunas do Banco de Dados
    // Aqui garantimos que o nome vindo do JSON vira o nome que está no banco
    const dadosParaAtualizar = {
      teste1: value.teste1,
      teste2: value.teste2,
      teste3: value.teste3,
      exame: value.exame,
      recorrencia: value.recorrencia,
      ano_letivo: value.anoLetivo,         // Mapeamento
      estudante_id: value.estudanteId,     // Mapeamento
      disciplina_id: value.disciplinaId,   // Mapeamento
      data_avaliacao: value.dataAvaliacao  // Mapeamento
    };

    // 4. Remover chaves que possam vir como undefined (opcional, mas recomendado)
    Object.keys(dadosParaAtualizar).forEach(key => {
      if (dadosParaAtualizar[key] === undefined) delete dadosParaAtualizar[key];
    });

    // 5. Atualizar
    await avaliacao.update(dadosParaAtualizar);
    
    return res.status(200).json({ 
      success: true,
      alert: {
        type: "success",
        message: "Avaliação Atualizada",
        description: "Avaliação atualizada com sucesso."
      },
      avaliacao // Retorna o objeto para veres as alterações
    });
    
  } catch (error) {
    next(error);
  }
};

  // 1. Listar Geral (com filtros de estudante/disciplina/ano)
exports.listarAvaliacoesGeral = async (req, res, next) => {
  try {
    const { estudanteId, disciplinaId, anoLetivo } = req.query;
    
    // Montar o filtro dinamicamente
    const where = { ativo: true };
    if (estudanteId) where.estudante_id = estudanteId;
    if (disciplinaId) where.disciplina_id = disciplinaId;
    if (anoLetivo) where.ano_letivo = anoLetivo;

    const avaliacoes = await Avaliacao.findAll({
      where,
      include: [{ model: MediaFinal }] // Traz a média e o status automaticamente
    });

    return res.status(200).json(avaliacoes);
  } catch (error) {
    next(error);
  }
};

// 2. Obter por ID
exports.obterAvaliacaoPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const avaliacao = await Avaliacao.findOne({
      where: { id, ativo: true },
      include: [{ model: MediaFinal }]
    });

    if (!avaliacao) {
      return res.status(404).json({ 
        success: false,
        alert: {
          type: "error",
          message: "Não Encontrado",
          description: "Avaliação não encontrada."
        }
      });
    }

    return res.status(200).json(avaliacao);
  } catch (error) {
    next(error);
  }
};