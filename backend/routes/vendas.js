// routes/vendas.js
const express = require('express');
const router = express.Router();
const {
  listarVendas,
  buscarVendaPorId,
  criarVenda,
  atualizarVenda,
  excluirVenda,
  relatorioVendasPeriodo,
  rankingProdutos,
  rankingClientes
} = require('../controllers/vendaController');

// Rotas principais
router.get('/', listarVendas);
router.post('/', criarVenda);
router.get('/relatorio/periodo', relatorioVendasPeriodo);
router.get('/produtos/ranking', rankingProdutos);
router.get('/clientes/ranking', rankingClientes);
router.get('/:id', buscarVendaPorId);
router.put('/:id', atualizarVenda);
router.delete('/:id', excluirVenda);

module.exports = router;

// ================================================