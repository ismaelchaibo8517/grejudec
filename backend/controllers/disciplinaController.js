const { Disciplina, Curso } = require("../models");
const Joi = require("joi");

const disciplinaSchema = Joi.object({
  nome: Joi.string().min(3).max(100).required(),
  codigo: Joi.string().alphanum().min(3).max(20).required(),
  cursoId: Joi.number().integer().required()
});

// 1. Criar Disciplina
exports.criarDisciplina = async (req, res, next) => {
  try {
    const { error, value } = disciplinaSchema.validate(req.body);
    if (error) {
      const err = new Error(error.details[0].message);
      err.status = 400;
      return next(err);
    }

    // SEGURANÇA: Verificar se o curso existe E está ativo
    const cursoExistente = await Curso.findOne({ 
      where: { id: value.cursoId, ativo: true } 
    });
    
    if (!cursoExistente) {
      const err = new Error("Curso não encontrado ou inativo. Não é possível criar disciplina.");
      err.status = 404;
      return next(err);
    }

    const novaDisciplina = await Disciplina.create(value);
    return res.status(201).json(novaDisciplina);
  } catch (error) {
    return next(error);
  }
};

// 2. Listar Disciplinas
exports.listarDisciplinas = async (req, res, next) => {
  try {
    // Busca apenas as ativas
    const disciplinas = await Disciplina.findAll({ 
      where: { ativo: true } 
    });
    return res.status(200).json(disciplinas);
  } catch (error) {
    return next(error);
  }
};

// 3. Atualizar Disciplina
exports.atualizarDisciplina = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // SEGURANÇA: Só podemos atualizar se a disciplina estiver ativa
    const disciplina = await Disciplina.findOne({ where: { id, ativo: true } });
    if (!disciplina) {
      const err = new Error("Disciplina não encontrada ou inativa.");
      err.status = 404;
      return next(err);
    }

    const { error, value } = disciplinaSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const err = new Error(error.details.map((d) => d.message).join(', '));
      err.status = 400;
      return next(err);
    }

    // SEGURANÇA EXTRA: Se o cursoId foi alterado, verificar se o novo curso está ativo
    if (value.cursoId && value.cursoId !== disciplina.cursoId) {
      const novoCurso = await Curso.findOne({ where: { id: value.cursoId, ativo: true } });
      if (!novoCurso) {
        const err = new Error("O novo curso selecionado não existe ou está inativo.");
        err.status = 404;
        return next(err);
      }
    }

    await disciplina.update(value);
    return res.status(200).json({ mensagem: "Disciplina atualizada com sucesso" });
  } catch (error) {
    return next(error);
  }
};

// 4. Deletar (Soft Delete)
exports.deletarDisciplina = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // SEGURANÇA: Só deletamos o que ainda está ativo
    const disciplina = await Disciplina.findOne({ where: { id, ativo: true } });
    
    if (!disciplina) {
      const err = new Error("Disciplina não encontrada ou já inativada.");
      err.status = 404;
      return next(err);
    }

    await disciplina.update({ ativo: false });
    return res.status(200).json({ mensagem: "Disciplina removida com sucesso." });
  } catch (error) {
    return next(error);
  }
};