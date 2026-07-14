const express = require('express');
const router = express.Router();
const estudanteController = require('../controllers/estudanteController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole'); // O novo middleware

router.post('/', authMiddleware, checkRole(['admin', 'professor']), estudanteController.criarEstudante);
router.get('/', authMiddleware, checkRole(['admin', 'professor' , ]), estudanteController.listarEstudantes);
router.get('/:id', authMiddleware, checkRole(['admin', 'professor']), estudanteController.obterEstudantePorId);
router.put('/:id', authMiddleware, checkRole(['admin', 'professor']), estudanteController.atualizarEstudante);
router.delete('/:id',authMiddleware, checkRole(['admin', 'professor']), estudanteController.deletarEstudante);

module.exports = router;