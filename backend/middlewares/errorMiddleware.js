module.exports = (err, req, res, next) => {
  // 1. Registar o erro no log do servidor (para você depurar)
  console.error(`[Erro no Sistema]: ${err.stack}`);

  // 2. Definir o status code (padrão 500 se não especificado)
  const statusCode = err.status || 500;

  // 3. Responder de forma segura ao cliente
  // Se for erro 500, escondemos a mensagem real por segurança
  const mensagem = statusCode === 500 
    ? 'Algo correu mal internamente. Por favor, tente novamente mais tarde.' 
    : err.message;

  return res.status(statusCode).json({
    status: 'erro',
    mensagem: mensagem
  });
};