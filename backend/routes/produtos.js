// routes/produtos.js
const express = require('express');
const router = express.Router();
const {
  listarProdutos,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  excluirProduto,
  simularPrecos,
  recalcularCustos,
  listarCategorias
} = require('../controllers/produtoController');

// Rotas principais
router.get('/', listarProdutos);
router.post('/', criarProduto);
router.get('/categorias', listarCategorias);
router.get('/:id', buscarProdutoPorId);
router.put('/:id', atualizarProduto);
router.delete('/:id', excluirProduto);
router.post('/:id/simular-precos', simularPrecos);
router.put('/:id/recalcular', recalcularCustos);

module.exports = router;

// ================================================
