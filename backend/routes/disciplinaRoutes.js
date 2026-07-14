const express = require('express');
const router = express.Router();
const disciplinaController = require('../controllers/disciplinaController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole'); // O novo middleware

router.post('/', authMiddleware, checkRole(['admin', ]), disciplinaController.criarDisciplina);
router.get('/', authMiddleware, checkRole(['admin', 'professor', "estudante"]),disciplinaController.listarDisciplinas);
router.get('/:id', authMiddleware, checkRole(['admin', 'professor' , "estudante"]), disciplinaController.obterDisciplinaPorId);
router.put('/:id', authMiddleware, checkRole(['admin', ]),disciplinaController.atualizarDisciplina);
router.delete('/:id', authMiddleware, checkRole(['admin', ]),disciplinaController.deletarDisciplina);

module.exports = router;