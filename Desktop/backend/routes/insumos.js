// routes/insumos.js
const express = require('express');
const router = express.Router();
const {
  listarInsumos,
  buscarInsumoPorId,
  criarInsumo,
  atualizarInsumo,
  excluirInsumo,
  atualizarEstoque,
  listarCategorias
} = require('../controllers/insumoController');

// Rotas principais
router.get('/', listarInsumos);
router.post('/', criarInsumo);
router.get('/categorias', listarCategorias);
router.get('/:id', buscarInsumoPorId);
router.put('/:id', atualizarInsumo);
router.delete('/:id', excluirInsumo);
router.put('/:id/estoque', atualizarEstoque);

module.exports = router;

// ================================================