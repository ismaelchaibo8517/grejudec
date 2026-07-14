const express = require('express');
const router = express.Router();
const disciplinaController = require('../controllers/disciplinaController');

router.post('/', disciplinaController.criarDisciplina);
router.get('/', disciplinaController.listarDisciplinas);
router.get('/:id', disciplinaController.obterDisciplinaPorId);
router.put('/:id', disciplinaController.atualizarDisciplina);
router.delete('/:id', disciplinaController.deletarDisciplina);

module.exports = router;