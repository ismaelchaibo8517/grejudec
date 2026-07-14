const express = require('express');
const router = express.Router();
const estudanteController = require('../controllers/estudanteController');

router.post('/', estudanteController.criarEstudante);
router.get('/', estudanteController.listarEstudantes);
router.get('/:id', estudanteController.obterEstudantePorId);
router.put('/:id', estudanteController.atualizarEstudante);
router.delete('/:id', estudanteController.deletarEstudante);

module.exports = router;