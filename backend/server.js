require('dotenv').config();
const express = require('express');
const { sequelize } = require('./models'); // Importa o sequelize do teu index.js
const cursoRoutes = require('./routes/cursoRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const disciplinaRoutes = require('./routes/disciplinaRoutes');
const materialRoutes = require('./routes/materialRoutes')
const app = express();

app.use(express.json());

// Rota de teste
app.get('/api/health', (req, res) => {
    return res.status(200).json({
        status: 'sucesso',
        mensagem: 'Servidor do GREJUDEC a rodar perfeitamente!'
    });
});

app.use('/api/material' , materialRoutes)
app.use('/api/cursos', cursoRoutes);
app.use('/api/disciplinas', disciplinaRoutes);

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
        process.exit(1); // Finaliza o processo se o banco falhar
    }
}

const PORT = process.env.PORT || 3000;

// Inicialização Assíncrona
async function startServer() {
    await conexao_bd(); // Aguarda a conexão do banco primeiro

    app.listen(PORT, () => {
        console.log(`🚀 [GREJUDEC] Servidor ativo em: http://localhost:${PORT}`);
    });
}

startServer();