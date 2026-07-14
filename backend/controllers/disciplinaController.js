const { Disciplina, Curso } = require("../models"); 
const Joi = require("joi");

const disciplinaSchema = Joi.object({
  nome: Joi.string().min(3).max(100).required(),
  codigo: Joi.string().alphanum().min(3).max(20).required(),
  cursoId: Joi.number().integer().required() // Agora é obrigatório
});

exports.criarDisciplina = async (req, res, next) => {
  try {
    const { error, value } = disciplinaSchema.validate(req.body);
    if (error) {
      const err = new Error(error.details[0].message);
      err.status = 400;
      return next(err);
    }

    // 1. Verificar se o Curso existe antes de criar a disciplina
    const cursoExistente = await Curso.findByPk(value.cursoId);
    if (!cursoExistente) {
      const err = new Error("Curso não encontrado. Não é possível criar disciplina para um curso inexistente.");
      err.status = 404;
      return next(err);
    }

    // 2. Criar a disciplina vinculada
    const novaDisciplina = await Disciplina.create(value);
    return res.status(201).json(novaDisciplina);
  } catch (error) {
    return next(error);
  }
};

exports.listarDisciplinas = async (req, res, next) => {
  try {
    // Adicione o 'where' para buscar apenas os registros ativos
    const disciplinas = await Disciplina.findAll({ 
      where: { ativo: true } 
    });
    
    
    return res.status(200).json(disciplinas);
  } catch (error) {
    return next(error);
  }
};

// Atualizar
exports.atualizarDisciplina = async (req, res, next) => {
  try {
    const { id } = req.params;
    const disciplina = await Disciplina.findByPk(id);
    if (!disciplina) {
      const err = new Error("Disciplina não encontrada.");
      err.status = 404;
      return next(err);
    }

    const { error, value } = disciplinaSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const err = new Error(error.details.map((d) => d.message).join(', '));
      err.status = 400;
      return next(err);
    }

    await disciplina.update(value);
    return res.status(200).json({ mensagem: "Disciplina atualizada com sucesso" });
  } catch (error) {
    return next(error);
  }
};

// Deletar (Soft Delete)
exports.deletarDisciplina = async (req, res, next) => {
  try {
    const { id } = req.params;
    const disciplina = await Disciplina.findByPk(id);
    
    if (!disciplina) {
      const err = new Error("Disciplina não encontrada.");
      err.status = 404;
      return next(err);
    }

    await disciplina.update({ ativo: false });
    return res.status(200).json({ mensagem: "Disciplina removida com sucesso." });
  } catch (error) {
    return next(error);
  }
};