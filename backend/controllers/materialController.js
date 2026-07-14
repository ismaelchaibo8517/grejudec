const { MaterialAcademico, Disciplina } = require("../models");
const Joi = require("joi");

const materialSchema = Joi.object({
  titulo: Joi.string().min(3).max(150).required(),
  descricao: Joi.string().allow('', null),
  arquivoUrl: Joi.string().uri().required(), // Ou string().required() se for caminho local
  disciplinaId: Joi.number().integer().required(),
});

// 1. Criar Material (Docente)
exports.criarMaterial = async (req, res, next) => {
  try {
    const { error, value } = materialSchema.validate(req.body);
    if (error) {
      const err = new Error(error.details[0].message);
      err.status = 400;
      return next(err);
    }

    // Verificar se a disciplina pai existe
    const disciplina = await Disciplina.findByPk(value.disciplinaId);
    if (!disciplina) {
      const err = new Error("Disciplina não encontrada.");
      err.status = 404;
      return next(err);
    }

    const novoMaterial = await MaterialAcademico.create(value);
    return res.status(201).json(novoMaterial);
  } catch (error) {
    return next(error);
  }
};

// 2. Listar Materiais de uma Disciplina (Aluno e Docente)
exports.listarPorDisciplina = async (req, res, next) => {
  try {
    const { disciplinaId } = req.params;
    const materiais = await MaterialAcademico.findAll({
      where: { disciplinaId, ativo: true },
      order: [['createdAt', 'DESC']] // Mais recentes primeiro
    });
    return res.status(200).json(materiais);
  } catch (error) {
    return next(error);
  }
};

// 3. Atualizar Material (Docente)
exports.atualizarMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const material = await MaterialAcademico.findByPk(id);
    if (!material) {
      const err = new Error("Material não encontrado.");
      err.status = 404;
      return next(err);
    }

    const { error, value } = materialSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const err = new Error(error.details.map((d) => d.message).join(', '));
      err.status = 400;
      return next(err);
    }

    await material.update(value);
    return res.status(200).json({ mensagem: "Material atualizado." });
  } catch (error) {
    return next(error);
  }
};

// 4. Deletar (Soft Delete)
exports.deletarMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const material = await MaterialAcademico.findByPk(id);
    if (!material) {
      const err = new Error("Material não encontrado.");
      err.status = 404;
      return next(err);
    }

    await material.update({ ativo: false });
    return res.status(200).json({ mensagem: "Material removido." });
  } catch (error) {
    return next(error);
  }
};