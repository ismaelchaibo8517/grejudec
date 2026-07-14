const { Avaliacao, Disciplina, Estudante } = require("../models");
const Joi = require("joi");


const avaliacaoSchema = Joi.object({
  tipo: Joi.string()
    .valid("teste", "exame", "recorrencia", "trabalho")
    .required()
    .messages({
      "any.only": "O tipo de avaliação deve ser: teste, exame, recorrencia ou trabalho.",
      "any.required": "O tipo de avaliação é obrigatório."
    }),

  nota: Joi.number()
    .min(0)
    .max(100)
    .precision(2) // Garante apenas 2 casas decimais, evitando erros de arredondamento
    .required()
    .messages({
      "number.min": "A nota não pode ser negativa.",
      "number.max": "A nota não pode ultrapassar 100%.",
      "number.base": "A nota deve ser um número válido."
    }),

  anoLetivo: Joi.number()
    .integer()
    .min(2020) // Evita anos absurdos como 1900 ou 5000
    .max(new Date().getFullYear() + 1) // Limita ao próximo ano
    .required()
    .messages({
      "number.min": "Ano letivo inválido (mínimo 2020).",
      "number.max": "Ano letivo fora do período permitido."
    }),

  dataAvaliacao: Joi.date()
    .iso()
    .required()
    .messages({
      "date.format": "A data deve estar no formato ISO (YYYY-MM-DD).",
      "any.required": "A data da avaliação é obrigatória."
    }),

  disciplinaId: Joi.number()
    .integer()
    .positive() // Segurança: ID não pode ser zero ou negativo
    .required()
    .messages({
      "number.base": "O ID da disciplina deve ser um número.",
      "any.required": "A disciplina é obrigatória."
    }),

  estudanteId: Joi.number()
    .integer()
    .positive() // Segurança: ID não pode ser zero ou negativo
    .required()
    .messages({
      "number.base": "O ID do estudante deve ser um número.",
      "any.required": "O estudante é obrigatório."
    })
});

// 1. Criar Avaliação
exports.criarAvaliacao = async (req, res, next) => {
  try {
    const { error, value } = avaliacaoSchema.validate(req.body);
    if (error) {
      const err = new Error(error.details[0].message);
      err.status = 400;
      return next(err);
    }

    // Verificar se a disciplina e o estudante existem e estão ativos
    const disciplina = await Disciplina.findOne({ where: { id: value.disciplinaId, ativo: true } });
    const estudante = await Estudante.findOne({ where: { id: value.estudanteId, ativo: true } });

    if (!disciplina || !estudante) {
      const err = new Error("Disciplina ou Estudante não encontrados ou inativos.");
      err.status = 404;
      return next(err);
    }

    const novaAvaliacao = await Avaliacao.create(value);
    return res.status(201).json(novaAvaliacao);
  } catch (error) {
    // Tratamento específico para erro de unicidade (ex: tentar criar mesma prova 2x)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new Error("Esta avaliação já foi registrada para este estudante neste ano letivo."));
    }
    return next(error);
  }
};

// 2. Listar Avaliações (Filtro por Disciplina ou Estudante)
exports.listarAvaliacoes = async (req, res, next) => {
  try {
    const { disciplinaId, estudanteId } = req.query;
    const whereClause = { ativo: true };
    
    if (disciplinaId) whereClause.disciplinaId = disciplinaId;
    if (estudanteId) whereClause.estudanteId = estudanteId;

    const avaliacoes = await Avaliacao.findAll({ where: whereClause });
    return res.status(200).json(avaliacoes);
  } catch (error) {
    return next(error);
  }
};

// 3. Atualizar Nota
exports.atualizarAvaliacao = async (req, res, next) => {
  try {
    const { id } = req.params;
    const avaliacao = await Avaliacao.findOne({ where: { id, ativo: true } });
    
    if (!avaliacao) {
      const err = new Error("Avaliação não encontrada ou inativa.");
      err.status = 404;
      return next(err);
    }

    // Validação (Ignorando peso conforme solicitado)
    const { error, value } = avaliacaoSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const err = new Error(error.details.map(d => d.message).join(', '));
      err.status = 400;
      return next(err);
    }

    await avaliacao.update(value);
    return res.status(200).json({ mensagem: "Avaliação atualizada." });
  } catch (error) {
    return next(error);
  }
};

// 4. Deletar (Soft Delete)
exports.deletarAvaliacao = async (req, res, next) => {
  try {
    const { id } = req.params;
    const avaliacao = await Avaliacao.findOne({ where: { id, ativo: true } });
    
    if (!avaliacao) {
      const err = new Error("Avaliação não encontrada.");
      err.status = 404;
      return next(err);
    }

    await avaliacao.update({ ativo: false });
    return res.status(200).json({ mensagem: "Avaliação removida." });
  } catch (error) {
    return next(error);
  }
};