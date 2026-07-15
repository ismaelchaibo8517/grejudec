const express = require("express");
const router = express.Router();
const cursoController = require("../controllers/cursoController");
const authMiddleware = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole"); // O novo middleware

router.post(
  "/",
  authMiddleware,
  checkRole(["admin"]),
  cursoController.criarCurso,
);
router.get("/", cursoController.listarCursos);
router.put(
  "/:id",
  authMiddleware,
  checkRole(["admin", "professor"]),
  cursoController.atualizarCurso,
);
router.delete(
  "/:id",
  authMiddleware,
  checkRole(["admin", "professor"]),
  cursoController.deletarCurso,
);

module.exports = router;
