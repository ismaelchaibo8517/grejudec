const { Avaliacao, Disciplina, Estudante } = require("../models");
const Joi = require("joi");

const avaliacaoSchema = Joi.object({
  tipo: Joi.string().valid("teste", "exame", "recorrencia", "trabalho").required(),
  nota: Joi.number().min(0).max(100).required(),
  anoLetivo: Joi.number().integer().required(),
  dataAvaliacao: Joi.date().iso().required(),
  disciplinaId: Joi.number().integer().required(),
  estudanteId: Joi.number().integer().required()
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