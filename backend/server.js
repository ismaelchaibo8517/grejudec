require('dotenv').config();
const express = require('express');
const cors = require('cors'); // 1. Importa o pacote CORS
const { sequelize } = require('./models'); 
const cursoRoutes = require('./routes/cursoRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const disciplinaRoutes = require('./routes/disciplinaRoutes');
const materialRoutes = require('./routes/materialRoutes');
const avalicaoRouter = require('./routes/avaliacaoRoutes');
const estudanteRouter = require('./routes/estudanteRoutes');
const professorRouter = require('./routes/professorRoutes');
const usuarioRouter = require('./routes/usuariosRouter');
const pagamentoRouter = require('./routes/pagamentoRoutes')
const cookieParser = require('cookie-parser');

const app = express();

// Configuração do CORS no seu server.js (ou app.js)
const allowedOrigins = [
  'http://localhost:5173', 
  'https://dinah-ectomorphic-coralie.ngrok-free.dev'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origin (como ferramentas de API tipo Postman/Insomnia)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-webhook-signature'] // Adicionei o header do webhook aqui
}));

app.use(express.json());
app.use(cookieParser());

// Rota de teste
app.get('/api/health', (req, res) => {
    return res.status(200).json({
        status: 'sucesso',
        mensagem: 'Servidor do GREJUDEC a rodar perfeitamente!'
    });
});

app.use('/api/usuarios', usuarioRouter);
app.use('/api/professores', professorRouter);
app.use('/api/estudantes', estudanteRouter);
app.use('/api/avaliacoes', avalicaoRouter);
app.use('/api/materias', materialRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/disciplinas', disciplinaRoutes);
app.use('/api/pagamentos', pagamentoRouter);

app.use(errorMiddleware);

// Função de conexão com o banco
async function conexao_bd() {
    try {
        await sequelize.authenticate();
        console.log('Sucesso: Conectado ao banco do GREJUDEC! 🚀');
        
        // Sincroniza as tabelas
        await sequelize.sync({ force: false, alter: true });
        console.log('Tabelas sincronizadas/criadas com sucesso! ✅');
    } catch (error) {
        console.error('Erro ao conectar ao banco:', error);
        process.exit(1); 
    }
}

const PORT = process.env.PORT || 3000;

// Inicialização Assíncrona
async function startServer() {
    await conexao_bd(); 

    app.listen(PORT, () => {
        console.log(`🚀 [GREJUDEC] Servidor ativo em: http://localhost:${PORT}`);
    });
}

startServer();