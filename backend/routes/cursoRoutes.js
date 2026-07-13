const express = require('express');
const router = express.Router();
const cursoController = require('../controllers/cursoController');

router.post('/', cursoController.criarCurso);
router.get('/', cursoController.listarCursos);
router.put('/:id', cursoController.atualizarCurso);
router.delete('/:id', cursoController.deletarCurso);

module.exports = router;