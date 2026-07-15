const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "super_secreto_key";

module.exports = (req, res, next) => {
  const token = req.cookies.token; // Lê o token do cookie

  if (!token) {
    return res.status(403).json({
      success: false,
      alert: {
        type: "error",
        message: "Acesso Negado",
        description: "Acesso negado."
      }
    });
  }

  try {
    const decodificado = jwt.verify(token, JWT_SECRET);
    req.usuario = decodificado; // Disponível nas próximas rotas
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      alert: {
        type: "error",
        message: "Sessão Expirada",
        description: "Token inválido."
      }
    });
  }
};