const express = require('express');
const router = express.Router();
const avaliacaoController = require('../controllers/avaliacaoController');

router.post('/', avaliacaoController.criarAvaliacao);
router.get('/', avaliacaoController.listarAvaliacoes); // Usa query params: /avaliacoes?disciplinaId=1
router.put('/:id', avaliacaoController.atualizarAvaliacao);
router.delete('/:id', avaliacaoController.deletarAvaliacao);
// GET Geral: /api/avaliacoes?estudanteId=1&disciplinaId=5
router.get("/resultado", avaliacaoController.listarAvaliacoesGeral);

// GET por ID: /api/avaliacoes/1
router.get("/resultado/:id", avaliacaoController.obterAvaliacaoPorId);

module.exports = router;