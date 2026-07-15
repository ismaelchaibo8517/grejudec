const { Disciplina, Curso } = require("../models");
const Joi = require("joi");


const disciplinaSchema = Joi.object({
  nome: Joi.string()
    .trim() // Remove espaços em branco nas pontas
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.min": "O nome da disciplina deve ter pelo menos 3 caracteres.",
      "string.max": "O nome da disciplina é muito longo.",
      "any.required": "O nome da disciplina é obrigatório."
    }),

  codigo: Joi.string()
    .trim()
    .alphanum() // Mantém a segurança contra injeção
    .uppercase() // Garante que códigos como "mat1" virem "MAT1"
    .min(3)
    .max(20)
    .required()
    .messages({
      "string.alphanum": "O código deve conter apenas letras e números.",
      "string.min": "O código da disciplina deve ter pelo menos 3 caracteres.",
      "any.required": "O código da disciplina é obrigatório."
    }),

  cursoId: Joi.number()
    .integer()
    .positive() // Garante que o ID seja um número positivo (exclui 0 ou negativos)
    .required()
    .messages({
      "number.base": "O ID do curso deve ser um número.",
      "number.positive": "O ID do curso é inválido.",
      "any.required": "É necessário associar a disciplina a um curso."
    })
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
    
    return res.status(201).json({
      success: true,
      alert: {
        type: "success",
        message: "Disciplina Criada",
        description: "Disciplina registrada com sucesso."
      },
      novaDisciplina
    });
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

// 2.1. Buscar Disciplina por ID
exports.obterDisciplinaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Busca apenas se a disciplina estiver ativa
    const disciplina = await Disciplina.findOne({ 
      where: { id, ativo: true } 
    });

    if (!disciplina) {
      const err = new Error("Disciplina não encontrada ou inativa.");
      err.status = 404;
      return next(err);
    }

    return res.status(200).json(disciplina);
  } catch (error) {
    next(error);
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
    
    return res.status(200).json({
      success: true,
      alert: {
        type: "success",
        message: "Disciplina Atualizada",
        description: "Disciplina atualizada com sucesso."
      },
      disciplina
    });
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
    
    return res.status(200).json({
      success: true,
      alert: {
        type: "success",
        message: "Disciplina Removida",
        description: "Disciplina removida com sucesso."
      }
    });
  } catch (error) {
    return next(error);
  }
};