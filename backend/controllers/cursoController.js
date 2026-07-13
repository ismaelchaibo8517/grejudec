const { Curso } = require("../models");
const Joi = require("joi");

const cursoSchema = Joi.object({
  nome: Joi.string().min(3).max(50).required(),
  codigo: Joi.string().alphanum().min(2).max(10).required(),
  duracao: Joi.string().valid("meses_3", "meses_6").default("meses_3"),
});

// 1. Criar (Verificar se já existe pelo código)
exports.criarCurso = async (req, res, next) => {
  try {
    const { error, value } = cursoSchema.validate(req.body);
    if (error) {
      const err = new Error(error.details[0].message);
      err.status = 400;
      return next(err);
    }

    const { nome, codigo, duracao } = value;

    // Verificação: O código já existe?
    const cursoExistente = await Curso.findOne({ where: { codigo } });
    if (cursoExistente) {
      const err = new Error("Já existe um curso registrado com este código.");
      err.status = 409; // 409 Conflict
      return next(err);
    }

    const novoCurso = await Curso.create({ nome, codigo, duracao });
    return res.status(201).json(novoCurso);
  } catch (error) {
    return next(error);
  }
};

// 2. Atualizar (Verificar se o ID existe)
exports.atualizarCurso = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verificação: O ID existe?
    const curso = await Curso.findByPk(id);
    if (!curso) {
      const err = new Error("Curso não encontrado.");
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

// 3. Deletar (Verificar se o ID existe)
exports.deletarCurso = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verificação: O ID existe?
    const curso = await Curso.findByPk(id);
    if (!curso) {
      const err = new Error("Curso não encontrado para exclusão.");
      err.status = 404;
      return next(err);
    }

    await curso.destroy();
    return res.status(200).json({ mensagem: "Curso removido com sucesso" });
  } catch (error) {
    return next(error);
  }
};

// 4. Listar (Não precisa de verificação, apenas retorna vazio se não houver)
exports.listarCursos = async (req, res, next) => {
  try {
    const cursos = await Curso.findAll();
    return res.status(200).json(cursos);
  } catch (error) {
    return next(error);
  }
};