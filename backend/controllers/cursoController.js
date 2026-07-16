// C:\Users\administrator\Documents\js\grejudec\backend\controllers\cursoController.js
const { Curso } = require("../models");
const Joi = require("joi");


const cursoSchema = Joi.object({
  nome: Joi.string()
    .trim() // Remove espaços acidentais no início/fim
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.min": "O nome do curso deve ter pelo menos 3 caracteres.",
      "string.max": "O nome do curso é demasiado longo (máximo 50 caracteres).",
      "any.required": "O nome do curso é obrigatório."
    }),

  codigo: Joi.string()
    .trim()
    .alphanum()
    .uppercase() // Transforma automaticamente em maiúsculas (ex: "info" -> "INFO")
    .min(2)
    .max(10)
    .required()
    .messages({
      "string.alphanum": "O código deve conter apenas letras e números.",
      "string.min": "O código deve ter pelo menos 2 caracteres.",
      "any.required": "O código do curso é obrigatório."
    }),

  duracao: Joi.string()
    .valid("meses_3", "meses_6")
    .default("meses_3")
    .messages({
      "any.only": "A duração selecionada é inválida ."
    }),

  // Opcional: Se o front-end permitir alterar o status logo na criação
  ativo: Joi.boolean().default(true)
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
    
    return res.status(201).json({
      success: true,
      alert: {
        type: "success",
        message: "Curso Criado",
        description: "Curso registrado com sucesso."
      },
      novoCurso
    });
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
    
    return res.status(200).json({
      success: true,
      alert: {
        type: "success",
        message: "Curso Atualizado",
        description: "Curso atualizado com sucesso."
      },
      curso
    });
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
    
    return res.status(200).json({
      success: true,
      alert: {
        type: "success",
        message: "Curso Removido",
        description: "Curso removido com sucesso."
      }
    });
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