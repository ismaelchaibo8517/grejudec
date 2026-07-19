const axios = require('axios');

const PAYSUITE_API_URL = 'https://api.paysuite.co.mz/v1'; // Ajuste conforme a URL real da doc
const API_KEY = process.env.PAYSUITE_API_KEY; // Configure esta chave no seu .env

const paysuiteApi = axios.create({
    baseURL: PAYSUITE_API_URL,
    headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
    }
});

const createOrder = async (dadosPagamento) => {
    try {
        const response = await paysuiteApi.post('/payments/checkout', {
            amount: dadosPagamento.valor,
            reference: dadosPagamento.referencia,
            description: dadosPagamento.descricao,
            callback_url: "https://dinah-ectomorphic-coralie.ngrok-free.dev/api/webhooks/paysuite" // A URL do ngrok que guardamos
        });
        return response.data;
    } catch (error) {
        console.error("Erro na PaySuite API:", error.response?.data || error.message);
        throw new Error("Falha ao conectar com PaySuite");
    }
};

module.exports = { createOrder };