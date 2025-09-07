const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');

// Listar vendas com paginação e filtros
router.get('/', vendaController.listar);

// Buscar venda por ID
router.get('/:id', vendaController.buscarPorId);

// Criar nova venda
router.post('/', vendaController.criar);

// Atualizar venda existente
router.put('/:id', vendaController.atualizar);

// Simular preços em tempo real
router.post('/simular-precos', vendaController.simularPrecos);

// Finalizar venda
router.put('/:id/finalizar', vendaController.finalizar);

// Cancelar venda
router.put('/:id/cancelar', vendaController.cancelar);

// Excluir venda
router.delete('/:id', vendaController.excluir);

module.exports = router;
