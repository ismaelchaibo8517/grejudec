const express = require('express');
const router = express.Router();
const professorController = require('../controllers/professorController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole'); 

// Adiciona o authMiddleware antes do checkRole em todas as rotas privadas!
router.get('/', authMiddleware, checkRole(['admin', 'professor']), professorController.listarProfessores);
router.post('/', authMiddleware, checkRole(['admin', ]), professorController.criarProfessor);
router.get('/:id', authMiddleware, checkRole(['admin', ]), professorController.obterProfessorPorId);
router.put('/:id', authMiddleware, checkRole(['admin', ]), professorController.atualizarProfessor);
router.delete('/:id', authMiddleware, checkRole(['admin', ]), professorController.deletarProfessor);

router.get('/me/disciplinas', authMiddleware, checkRole(['professor']), professorController.obterMinhasDisciplinas);
module.exports = router;