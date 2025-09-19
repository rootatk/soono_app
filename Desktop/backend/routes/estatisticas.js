// routes/estatisticas.js
const express = require('express');
const router = express.Router();
const {
  resumoGeral,
  evolucaoVendasMensal,
  insumosMaisUsados,
  analiseRentabilidade,
  previsaoEstoque
} = require('../controllers/estatisticaController');

// Rotas de estatísticas
router.get('/resumo', resumoGeral);
router.get('/vendas-mensal', evolucaoVendasMensal);
router.get('/insumos-mais-usados', insumosMaisUsados);
router.get('/rentabilidade', analiseRentabilidade);
router.get('/previsao-estoque', previsaoEstoque);

module.exports = router;