//C:\Users\administrator\Documents\js\grejudec\backend\middlewares\errorMiddleware.js
module.exports = (err, req, res, next) => {


  // 2. Definir o status code (padrão 500 se não especificado)
  const statusCode = err.status || 500;

  // 3. Responder de forma segura ao cliente
  // Se for erro 500, escondemos a mensagem real por segurança
  const mensagem = statusCode === 500 
    ? 'Algo correu mal internamente. Por favor, tente novamente mais tarde.' 
    : err.message;

  // --- ADICIONADO PARA O SYSTEMALERT ---
  // Mapeia um título curto e direto para o cabeçalho em negrito do componente
  let tituloErro = 'Erro na Operação';
  
  if (statusCode === 400) {
    tituloErro = 'Dados Inválidos';
  } else if (statusCode === 401) {
    tituloErro = 'Não Autorizado';
  } else if (statusCode === 403) {
    tituloErro = 'Acesso Negado';
  } else if (statusCode === 404) {
    tituloErro = 'Não Encontrado';
  } else if (statusCode === 409) {
    tituloErro = 'Conflito de Dados';
  } else if (statusCode >= 500) {
    tituloErro = 'Erro Interno do Servidor';
      // 1. Registar o erro no log do servidor (para você depurar)
  console.error(`[Erro no Sistema]: ${err.stack}`);
  }

  // 4. Responder no formato ideal para o teu componente React ler diretamente
  return res.status(statusCode).json({
    success: false,
    alert: {
      type: 'error',          // Define a cor vermelha/estilo de erro no frontend
      message: tituloErro,    // O título curto (ex: "Acesso Negado")
      description: mensagem   // A descrição detalhada e segura do erro
    }
  });
};