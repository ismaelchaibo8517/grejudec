const { Curso } = require("../models");
const Joi = require("joi");

const cursoSchema = Joi.object({
  nome: Joi.string().min(3).max(50).required(),
  codigo: Joi.string().alphanum().min(2).max(10).required(),
  duracao: Joi.string().valid("meses_3", "meses_6").default("meses_3"),
});

// 1. Criar Curso
exports.criarCurso = async (req, res, next) => {
  try {
    const { error, value } = cursoSchema.validate(req.body);
    if (error) {
      const err = new Error(error.details[0].message);
      err.status = 400;
      return next(err);
    }

    const { codigo } = value;

    // Verificação: O código já existe? (Mantemos a verificação de existência)
    const cursoExistente = await Curso.findOne({ where: { codigo } });
    if (cursoExistente) {
      const err = new Error("Já existe um curso registrado com este código.");
      err.status = 409;
      return next(err);
    }

    const novoCurso = await Curso.create(value);
    return res.status(201).json(novoCurso);
  } catch (error) {
    return next(error);
  }
};

// 2. Atualizar Curso
exports.atualizarCurso = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // SEGURANÇA: Só atualizamos se o curso existir e estiver ativo
    const curso = await Curso.findOne({ where: { id, ativo: true } });
    if (!curso) {
      const err = new Error("Curso não encontrado ou inativo.");
      err.status = 404;
      return next(err);
    }

    const { error, value } = cursoSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const err = new Error(error.details.map((d) => d.message).join(', '));
      err.status = 400;
      return next(err);
    }

    await curso.update(value);
    return res.status(200).json({ mensagem: "Curso atualizado com sucesso" });
  } catch (error) {
    return next(error);
  }
};

// 3. Deletar (Soft Delete - Agora usa update)
exports.deletarCurso = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // SEGURANÇA: Só deletamos o que está ativo
    const curso = await Curso.findOne({ where: { id, ativo: true } });
    if (!curso) {
      const err = new Error("Curso não encontrado ou já removido.");
      err.status = 404;
      return next(err);
    }

    // Soft Delete: Em vez de destroy(), usamos update
    await curso.update({ ativo: false });
    return res.status(200).json({ mensagem: "Curso removido com sucesso" });
  } catch (error) {
    return next(error);
  }
};

// 4. Listar
exports.listarCursos = async (req, res, next) => {
  try {
    // SEGURANÇA: Listar apenas os ativos
    const cursos = await Curso.findAll({ where: { ativo: true } });
    return res.status(200).json(cursos);
  } catch (error) {
    return next(error);
  }
};