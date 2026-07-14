// middlewares/checkRole.js
module.exports = (rolesPermitidos) => {
  return (req, res, next) => {
    // req.usuario foi definido no authMiddleware anterior
    // Se o utilizador não existe ou o papel dele não está na lista permitida:
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.papel)) {
      return res.status(403).json({ 
        mensagem: "Acesso negado: você não tem permissão para esta ação." 
      });
    }
    
    // Se está tudo certo, continua para o controller
    next();
  };
};