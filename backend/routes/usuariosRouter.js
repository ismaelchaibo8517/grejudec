const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');

// ROTA PÚBLICA: Pré-inscrição de alunos ou registo inicial
router.post('/', usuarioController.criarUsuario);

// ROTAS PROTEGIDAS: Apenas Admin pode gerir utilizadores
router.get('/', authMiddleware, checkRole(['admin']), usuarioController.listarUsuarios);
router.get('/:id', authMiddleware, checkRole(['admin']), usuarioController.obterUsuarioPorId);
router.put('/:id', authMiddleware, checkRole(['admin']), usuarioController.atualizarUsuario);
router.delete('/:id', authMiddleware, checkRole(['admin']), usuarioController.deletarUsuario);

module.exports = router;