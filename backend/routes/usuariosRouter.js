const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');



// ROTAS PROTEGIDAS: Apenas Admin pode gerir utilizadores
// router.get('/', authMiddleware, checkRole(['admin']), usuarioController.listarUsuarios);
//router.get('/:id', authMiddleware, checkRole(['admin']), usuarioController.obterUsuarioPorId);
router.put('/:id', authMiddleware, checkRole(['admin']), usuarioController.atualizarUsuario);
router.get('/confirmacao/:identificador', usuarioController.obterConfirmacaoPreInscricao);
router.post("/pre-inscricao", usuarioController.criarUsuario);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

module.exports = router;