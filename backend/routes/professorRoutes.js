const express = require('express');
const router = express.Router();
const professorController = require('../controllers/professorController');

router.post('/', professorController.criarProfessor);
router.get('/', professorController.listarProfessores);
router.get('/:id', professorController.obterProfessorPorId);
router.put('/:id', professorController.atualizarProfessor);
router.delete('/:id', professorController.deletarProfessor);

module.exports = router;