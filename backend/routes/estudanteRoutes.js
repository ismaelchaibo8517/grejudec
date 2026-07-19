const express = require('express');
const router = express.Router();
const estudanteController = require('../controllers/estudanteController');
const authMiddleware = require('../middlewares/authMiddleware');
const pagamentoController = require('../controllers/pagamentoController');
const checkRole = require('../middlewares/checkRole'); // O novo middleware
const estudantePainelController = require('../controllers/estudantePainelController')

router.post('/', authMiddleware, checkRole(['admin', 'professor']), estudanteController.criarEstudante);
// router.get('/', authMiddleware, checkRole(['admin', 'professor' , ]), estudanteController.listarEstudantes);
router.get('/:id', authMiddleware, checkRole(['admin', 'professor']), estudanteController.obterEstudantePorId);
router.put('/:id', authMiddleware, checkRole(['admin', 'professor']), estudanteController.atualizarEstudante);
router.delete('/:id',authMiddleware, checkRole(['admin', 'professor']), estudanteController.deletarEstudante);
// Rota: GET /api/estudantes?disciplinaId=X
router.get('/', authMiddleware, checkRole(['admin', 'professor']), estudanteController.listarEstudantesall);



// Estas rotas devem ir no seu arquivo de rotas (ex: routes/estudanteRoutes.js)
// O estudante chama estas rotas passando o seu próprio Token JWT
router.get('/me/notas', authMiddleware, checkRole(['estudante']), estudantePainelController.verMinhasNotas);
router.put('/me/perfil', authMiddleware, checkRole(['estudante']), estudantePainelController.atualizarPerfil);
router.get('/me/pagamentos', authMiddleware, pagamentoController.listarPagamentosEstudante);
module.exports = router;