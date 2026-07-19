const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');
const relatorioController = require('../controllers/relatorioController')
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole'); // O novo middleware

// Rota para iniciar o processo de pagamento
router.post('/gerar',authMiddleware, checkRole(['estudante']), pagamentoController.gerarPagamento);
router.post('/webhook', pagamentoController.webhookPaySuite);
// 🔓 Rota pública de retorno do checkout (GET)
router.get('/sucesso', pagamentoController.sucessoPagamento);

// Rota para o Frontend React consultar o estado atual
router.get('/status/:referencia', pagamentoController.consultarStatus);

router.get(
  "/propinas",authMiddleware, checkRole(['admin']),relatorioController.obterRelatorioFinanceiroAdmin
);

module.exports = router;