const { Usuario } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super_secreto_key";

exports.registrar = async (req, res, next) => {
  try {
    const { nomeUsuario, email, senha,  } = req.body;
    
    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);
    
    const usuario = await Usuario.create({ nomeUsuario, email, senhaHash, });
    res.status(201).json({ mensagem: "Usuário criado com sucesso!" });
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });
    
    if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
      return res.status(401).json({ mensagem: "Credenciais inválidas." });
    }

    // Criar Token
    const token = jwt.sign({ id: usuario.id, papel: usuario.papel }, JWT_SECRET, { expiresIn: '1d' });

    // Enviar Token via Cookie
    res.cookie('token', token, {
      httpOnly: true, // Protege contra XSS
      secure: process.env.NODE_ENV === 'production', // true se for https
      maxAge: 24 * 60 * 60 * 1000 // 1 dia
    });

    res.json({ mensagem: "Login efetuado!", papel: usuario.papel });
  } catch (error) { next(error); }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ mensagem: "Logout efetuado." });
};