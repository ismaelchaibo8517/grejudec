const express = require('express');
const router = express.Router();
const avaliacaoController = require('../controllers/avaliacaoController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole'); // O novo middleware

router.post('/', authMiddleware, checkRole(['admin', 'professor']), avaliacaoController.criarAvaliacao);
router.get('/',authMiddleware, checkRole(['admin', 'professor' , "estudante"]), avaliacaoController.listarAvaliacoes); // Usa query params: /avaliacoes?disciplinaId=1
router.put('/:id', authMiddleware, checkRole(['admin', 'professor']),avaliacaoController.atualizarAvaliacao);
router.delete('/:id',authMiddleware, checkRole(['admin', 'professor']), avaliacaoController.deletarAvaliacao);
// GET Geral: /api/avaliacoes?estudanteId=1&disciplinaId=5
router.get("/resultado",authMiddleware, checkRole(['admin', 'professor' , "estudante"]), avaliacaoController.listarAvaliacoesGeral);

// GET por ID: /api/avaliacoes/1
router.get("/resultado/:id", authMiddleware, checkRole(["estudante"]), avaliacaoController.obterAvaliacaoPorId);

module.exports = router;