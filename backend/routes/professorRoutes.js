const express = require('express');
const router = express.Router();
const professorController = require('../controllers/professorController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole'); 

router.post('/',authMiddleware, checkRole(['admin', 'professor']), professorController.criarProfessor);
router.get('/', checkRole(['admin', 'professor']),professorController.listarProfessores);
router.get('/:id', checkRole(['admin', 'professor']), professorController.obterProfessorPorId);
router.put('/:id', checkRole(['admin', 'professor']), professorController.atualizarProfessor);
router.delete('/:id',checkRole(['admin', 'professor']), professorController.deletarProfessor);

module.exports = router;