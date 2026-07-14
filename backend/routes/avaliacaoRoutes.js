const express = require('express');
const router = express.Router();
const avaliacaoController = require('../controllers/avaliacaoController');

router.post('/', avaliacaoController.criarAvaliacao);
router.get('/', avaliacaoController.listarAvaliacoes); // Usa query params: /avaliacoes?disciplinaId=1
router.put('/:id', avaliacaoController.atualizarAvaliacao);
router.delete('/:id', avaliacaoController.deletarAvaliacao);

module.exports = router;