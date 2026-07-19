// C:\usuarios\administrator\Documents\js\grejudec\backend\controllers\estudantePainelController.js
const { Usuario, Estudante, Avaliacao, Disciplina, sequelize , MediaFinal } = require("../models");
const bcrypt = require("bcryptjs");
const Joi = require("joi");

// --- Schemas de Validação ---
const perfilSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email()
    .optional()
    .messages({
      "string.email": "Introduza um formato de e-mail válido."
    }),

  senhaAtual: Joi.string()
    .required()
    .messages({
      "any.required": "A senha atual é obrigatória para efetuar alterações."
    }),

  novaSenha: Joi.string()
    .min(6)
    .optional()
    .messages({
      "string.min": "A nova senha deve ter pelo menos 6 caracteres."
    })
});

// --- Controller ---

exports.verMinhasNotas = async (req, res, next) => {
  try {
    if (!req.usuario || !req.usuario.id) {
      const err = new Error("Usuário não autenticado ou ID ausente no token.");
      err.status = 401;
      return next(err);
    }

    const estudante = await Estudante.findOne({ where: { usuario_id: req.usuario.id } });
    if (!estudante) {
      const err = new Error("Perfil de estudante não encontrado.");
      err.status = 404;
      return next(err);
    }

    // 1. Busca TODAS as avaliações do estudante (já com o nome da disciplina)
    const todasAsNotas = await Avaliacao.findAll({
      where: { estudante_id: estudante.id },
      include: [
        { model: Disciplina, attributes: ['nome'] }
      ],
      raw: true,
      nest: true // Transforma a disciplina num objeto aninhado bonitinho
    });

    if (todasAsNotas.length === 0) {
      return res.status(200).json([]);
    }

    // 2. Busca TODAS as Médias Finais do estudante separadamente
    const mediasFinais = await MediaFinal.findAll({
      where: { estudante_id: estudante.id },
      raw: true
    });

    // 3. Cruza os dados de forma exata baseada na disciplina (Sem produto cartesiano!)
    const resultadoFinal = todasAsNotas.map(nota => {
      // Procura a média específica desta disciplina
      const mediaCerta = mediasFinais.find(m => 
        m.disciplina_id === nota.disciplina_id &&
        m.ano_letivo === nota.ano_letivo // Evita misturar notas de anos anteriores
      );

      // Constrói o objeto final exatamente como o teu Frontend (React) espera
      return {
        ...nota,
        MediaFinal: mediaCerta ? {
          mediaFrequencia: mediaCerta.mediaFrequencia,
          mediaFinal: mediaCerta.mediaFinal,
          status: mediaCerta.status
        } : null
      };
    });

    // Retorna os dados limpos e precisos!
    return res.status(200).json(resultadoFinal);
    
  } catch (error) {
    return next(error);
  }
};
// 2. Atualizar E-mail e Senha
exports.atualizarPerfil = async (req, res, next) => {
  // Validação de entrada seguindo o padrão completo abortEarly: false
  const { error, value } = perfilSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const err = new Error(error.details.map((d) => d.message).join(', '));
    err.status = 400;
    return next(err);
  }

  const { email, senhaAtual, novaSenha } = value;
  const t = await sequelize.transaction();

  try {
    // Procura o usuário logado para validar as credenciais
    const usuario = await Usuario.findByPk(req.usuario.id, { transaction: t });
    if (!usuario) {
      const err = new Error("Usuário não encontrado.");
      err.status = 404;
      throw err;
    }

    // Verificar se a senha atual confere com a hash guardada
    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senhaHash);
    if (!senhaValida) {
      const err = new Error("A senha atual introduzida está incorreta.");
      err.status = 401;
      throw err;
    }

    // Se o email foi alterado e enviado, verifica unicidade antes de guardar
    if (email && email !== usuario.email) {
      const emailExistente = await Usuario.findOne({ where: { email }, transaction: t });
      if (emailExistente) {
        const err = new Error("Este e-mail já está em uso por outro utilizador.");
        err.status = 409; // Conflict
        throw err;
      }
      usuario.email = email;
    }

    // Se a nova senha foi enviada, faz o hash antes de persistir
    if (novaSenha) {
      usuario.senhaHash = await bcrypt.hash(novaSenha, 10);
    }

    await usuario.save({ transaction: t });
    await t.commit();

    return res.status(200).json({
      success: true,
      alert: {
        type: "success",
        message: "Perfil Atualizado",
        description: "Os seus dados de acesso foram atualizados com sucesso."
      }
    });
  } catch (err) {
    await t.rollback();

    // Tratamento explícito de duplicados caso passe da verificação manual
    if (err.name === 'SequelizeUniqueConstraintError') {
      const customErr = new Error("Este e-mail já está registrado no sistema.");
      customErr.status = 400;
      return next(customErr);
    }

    return next(err);
  }
};