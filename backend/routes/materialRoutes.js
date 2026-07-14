const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole'); // O novo middleware


router.post('/',authMiddleware, checkRole(['admin', 'professor']), materialController.criarMaterial);


router.get('/disciplina/:disciplinaId', materialController.listarPorDisciplina);


router.put('/:id', authMiddleware, checkRole(['admin', 'professor']), materialController.atualizarMaterial);

router.delete('/:id',authMiddleware, checkRole(['admin', 'professor']), materialController.deletarMaterial);

module.exports = router;