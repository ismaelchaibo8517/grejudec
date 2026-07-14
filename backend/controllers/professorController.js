const { Professor } = require("../models");
const Joi = require("joi");

const professorSchema = Joi.object({
  nomeCompleto: Joi.string().trim().min(3).max(50).required().messages({
    "string.min": "O nome deve ter pelo menos 3 caracteres.",
    "string.max": "O nome não pode exceder 50 caracteres.",
    "any.required": "O nome completo é obrigatório."
  }),
  especialidade: Joi.string().trim().max(100).allow('', null)
});

// 1. Criar
exports.criarProfessor = async (req, res, next) => {
  try {
    const { error, value } = professorSchema.validate(req.body);
    if (error) {
      const err = new Error(error.details[0].message);
      err.status = 400;
      return next(err);
    }
    const novoProfessor = await Professor.create(value);
    return res.status(201).json(novoProfessor);
  } catch (error) { next(error); }
};

// 2. Listar Ativos
exports.listarProfessores = async (req, res, next) => {
  try {
    const professores = await Professor.findAll({ where: { ativo: true } });
    return res.status(200).json(professores);
  } catch (error) { next(error); }
};

// 3. Obter por ID
exports.obterProfessorPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const professor = await Professor.findOne({ where: { id, ativo: true } });
    if (!professor) {
      const err = new Error("Professor não encontrado ou inativo.");
      err.status = 404;
      return next(err);
    }
    return res.status(200).json(professor);
  } catch (error) { next(error); }
};

// 4. Atualizar
exports.atualizarProfessor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const professor = await Professor.findOne({ where: { id, ativo: true } });
    if (!professor) return next(new Error("Professor não encontrado."));

    const { error, value } = professorSchema.validate(req.body);
    if (error) return next(new Error(error.details[0].message));

    await professor.update(value);
    return res.status(200).json({ mensagem: "Dados atualizados com sucesso." });
  } catch (error) { next(error); }
};

// 5. Deletar (Soft Delete)
exports.deletarProfessor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const professor = await Professor.findOne({ where: { id, ativo: true } });
    if (!professor) return next(new Error("Professor não encontrado."));

    await professor.update({ ativo: false });
    return res.status(200).json({ mensagem: "Professor removido com sucesso." });
  } catch (error) { next(error); }
};