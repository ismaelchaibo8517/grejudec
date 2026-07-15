const { Usuario } = require("../models");
const { Op } = require("sequelize"); // Pode ser útil se voltares a permitir login por Email ou Matrícula
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi"); // 👈 Importação do Joi

const JWT_SECRET = process.env.JWT_SECRET || "super_secreto_key";

// --- ESQUEMA DE VALIDAÇÃO JOI ---
const loginSchema = Joi.object({
  NumMatricula: Joi.string().trim().required().messages({
    "string.empty": "O Número de Matrícula não pode estar vazio.",
    "any.required": "O campo Número de Matrícula é obrigatório."
  }),
  senha: Joi.string().required().messages({
    "string.empty": "A senha não pode estar vazia.",
    "any.required": "A senha é obrigatória."
  })
});

exports.login = async (req, res, next) => {
  try {
    // 1. Validação dos dados de entrada com o Joi
    // abortEarly: false permite que o Joi retorne todos os erros de uma vez, não apenas o primeiro
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });

    // Se houver erros na validação, devolvemos imediatamente ao frontend
    if (error) {
      const mensagensErro = error.details.map(err => err.message);
      return res.status(400).json({ 
        success: false,
        alert: {
          type: "error",
          message: "Erro de Preenchimento",
          description: "Por favor, corrija os erros de validação antes de avançar."
        },
        erros: mensagensErro 
      });
    }

    // Usamos os valores limpos (trim aplicado) e validados pelo Joi
    const { NumMatricula, senha } = value;

    // 2. Procuramos na tabela Usuario onde o 'nomeUsuario' coincide com o Número de Matrícula
    const usuario = await Usuario.findOne({ 
      where: { nomeUsuario: NumMatricula } 
    });
    
    // 3. Se o utilizador não existir ou a senha estiver incorreta
    if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
      return res.status(401).json({ 
        success: false,
        alert: {
          type: "error",
          message: "Falha na Autenticação",
          description: "Credenciais inválidas. Verifique o Número de Matrícula e a senha."
        }
      });
    }

    // 4. Criar o Token JWT com os dados do usuário
    const token = jwt.sign(
      { id: usuario.id, papel: usuario.papel, nomeUsuario: usuario.nomeUsuario }, 
      JWT_SECRET, 
      { expiresIn: '1d' }
    );

    // 5. Enviar o Token via Cookie Seguro
    res.cookie('token', token, {
      httpOnly: true,                          // Protege contra roubo de tokens via JS (XSS)
      secure: process.env.NODE_ENV === 'production', // true se estiver em produção com HTTPS
      sameSite: 'lax',                         // Protege contra CSRF
      maxAge: 24 * 60 * 60 * 1000              // Expira em 1 dia
    });

    // 6. Responder ao frontend com os dados úteis
    return res.json({ 
      success: true,
      alert: {
        type: "success",
        message: "Sessão Iniciada",
        description: "Login efetuado com sucesso!"
      },
      usuario: {
        id: usuario.id,
        nomeUsuario: usuario.nomeUsuario,
        email: usuario.email,
        papel: usuario.papel 
      }
    });

  } catch (error) { 
    next(error); 
  }
};

// --- LOGOUT CONTROLLER ---
exports.logout = (req, res) => {
  // Para limpar o cookie com total segurança em todos os navegadores,
  // passamos exatamente as mesmas configurações usadas na criação
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  return res.json({ 
    success: true,
    alert: {
      type: "success",
      message: "Sessão Encerrada",
      description: "Logout efetuado com sucesso."
    }
  });
};