const { Usuario, Estudante, sequelize, Curso } = require("../models");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const Joi = require("joi");

// --- Schemas ---
const preInscricaoSchema = Joi.object({
  email: Joi.string().email().max(100).messages({ "string.email": "Por favor, introduza um email válido." }),
  senha: Joi.string().min(6).max(255).required().messages({ "string.min": "A senha deve ter no mínimo 6 caracteres.", "any.required": "A senha é obrigatória." }),
  nomeCompleto: Joi.string().max(150).required().messages({ "any.required": "O nome completo é obrigatório." }),
  numBi: Joi.string().max(20).required().messages({ "any.required": "O número do BI é obrigatório." }),
  cursoId: Joi.number().integer().positive().required().messages({ "any.required": "O curso é obrigatório." }),
  classe: Joi.string().valid("7", "10", "12").required().messages({ "any.only": "A classe selecionada deve ser 7, 10 ou 12.", "any.required": "A classe é obrigatória." }),
  telefone: Joi.string().max(16).allow("", null).optional(),
  dataNascimento: Joi.date().iso().allow("", null).optional().messages({ "date.format": "A data de nascimento deve estar no formato YYYY-MM-DD." })
});

// --- Controller ---

exports.criarUsuario = async (req, res, next) => {
  const { error, value } = preInscricaoSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const err = new Error(error.details.map(err => err.message).join(", "));
    err.status = 400;
    return next(err);
  }

  const { email, senha, nomeCompleto, numBi, cursoId, classe, telefone, dataNascimento } = value;
  const t = await sequelize.transaction();

  try {
    const curso = await Curso.findOne({ where: { id: cursoId, ativo: true }, transaction: t });
    if (!curso) {
      const err = new Error("O curso selecionado não foi encontrado ou está inativo.");
      err.status = 404;
      throw err;
    }

    const biExistente = await Estudante.findOne({ where: { numBi }, transaction: t });
    if (biExistente) {
      const err = new Error("Já existe um estudante cadastrado com este número de BI.");
      err.status = 409;
      throw err;
    }

    // --- Lógica de Geração Única e Robusta ---
    const ano = new Date().getFullYear();
    
    // Busca o maior número em Estudantes e Usuários simultaneamente
    const ultimoEstudante = await Estudante.findOne({
      where: { numeroMatricula: { [Op.like]: `${ano}.%` } },
      order: [['numeroMatricula', 'DESC']],
      transaction: t
    });

    const ultimoUsuario = await Usuario.findOne({
      where: { nomeUsuario: { [Op.like]: `${ano}.%` } },
      order: [['nomeUsuario', 'DESC']],
      transaction: t
    });

    const seqEst = ultimoEstudante ? parseInt(ultimoEstudante.numeroMatricula.split('.')[1], 10) : 0;
    const seqUsu = ultimoUsuario ? parseInt(ultimoUsuario.nomeUsuario.split('.')[1], 10) : 0;
    
    const proximaSequencia = Math.max(seqEst, seqUsu) + 1;
    const novoNumeroMatricula = `${ano}.${proximaSequencia.toString().padStart(3, '0')}`;
    
    console.log("Gerado novo número de matrícula único: ", novoNumeroMatricula);
    // --- Fim da Lógica ---

    const senhaHash = await bcrypt.hash(senha, 10);

    const novoUsuario = await Usuario.create({
      nomeUsuario: novoNumeroMatricula,
      email,
      senhaHash,
      papel: "estudante"
    }, { transaction: t });

    const novoEstudante = await Estudante.create({
      numeroMatricula: novoNumeroMatricula,
      nomeCompleto,
      numBi,
      curso_id: cursoId,
      classe,
      telefone,
      dataNascimento,
      usuario_id: novoUsuario.id,
      ativo: false,
      statusMatricula: "pre-inscrito"
    }, { transaction: t });

    await t.commit();

    return res.status(201).json({
      success: true,
      alert: { type: "success", message: "Pré-inscrição Realizada", description: "Pré-inscrição realizada com sucesso!" },
      usuario: { id: novoUsuario.id, nomeUsuario: novoUsuario.nomeUsuario, email: novoUsuario.email, papel: novoUsuario.papel },
      estudante: { id: novoEstudante.id, numeroMatricula: novoEstudante.numeroMatricula, nomeCompleto: novoEstudante.nomeCompleto }
    });

  } catch (err) {
    await t.rollback();
    if (err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeValidationError') {
      const customErr = new Error(err.errors.map(e => e.message).join(", "));
      customErr.status = 400;
      return next(customErr);
    }
    next(err);
  }
};
exports.obterConfirmacaoPreInscricao = async (req, res, next) => {
  try {
    const { matricula } = req.params;
    const estudante = await Estudante.findOne({ where: { numeroMatricula: matricula } });

    if (!estudante) {
      const err = new Error("Pré-inscrição não encontrada.");
      err.status = 404;
      throw err;
    }

    const usuario = await Usuario.findOne({ where: { nomeUsuario: matricula }, attributes: ["email"] });

    return res.status(200).json({
      nomeCompleto: estudante.nomeCompleto,
      numeroMatricula: estudante.numeroMatricula,
      email: usuario ? usuario.email : null,
      classe: estudante.classe,
      statusMatricula: estudante.statusMatricula,
      dataInscricao: estudante.createdAt
    });
  } catch (error) {
    next(error);
  }
};

exports.atualizarUsuario = async (req, res, next) => {
  const { error, value } = atualizarUsuarioSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const err = new Error(error.details.map(err => err.message).join(", "));
    err.status = 400;
    return next(err);
  }

  const { id } = req.params;
  const t = await sequelize.transaction();

  try {
    const estudante = await Estudante.findByPk(id, { transaction: t });
    if (!estudante) {
      const err = new Error("Estudante não encontrado.");
      err.status = 404;
      throw err;
    }

    if (value.email || value.senha) {
      const usuario = await Usuario.findOne({ where: { nomeUsuario: estudante.numeroMatricula }, transaction: t });
      if (usuario) {
        const dadosUsuarioUpdates = {};
        if (value.email) dadosUsuarioUpdates.email = value.email;
        if (value.senha) dadosUsuarioUpdates.senhaHash = await bcrypt.hash(value.senha, 10);
        await usuario.update(dadosUsuarioUpdates, { transaction: t });
      }
    }

    const dadosEstudanteUpdates = { ...value };
    delete dadosEstudanteUpdates.email;
    delete dadosEstudanteUpdates.senha;
    if (value.cursoId) dadosEstudanteUpdates.curso_id = value.cursoId;

    await estudante.update(dadosEstudanteUpdates, { transaction: t });
    await t.commit();

    const estudanteAtualizado = await Estudante.findByPk(id);
    return res.status(200).json({
      success: true,
      alert: { type: "success", message: "Dados Atualizados", description: "Dados do estudante atualizados com sucesso!" },
      estudante: estudanteAtualizado
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};