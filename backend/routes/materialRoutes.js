const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');


router.post('/', materialController.criarMaterial);


router.get('/disciplina/:disciplinaId', materialController.listarPorDisciplina);


router.put('/:id', materialController.atualizarMaterial);

router.delete('/:id', materialController.deletarMaterial);

module.exports = router;