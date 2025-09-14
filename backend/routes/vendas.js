const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');
const { exportSalesData } = require('../utils/exportUtils');

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

// Exportar vendas para Excel
router.get('/export/excel', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log(`📊 Solicitação de export: ${startDate} até ${endDate}`);
    
    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Data inicial e final são obrigatórias'
      });
    }
    
    // Export data
    const exportResult = await exportSalesData(startDate, endDate);
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.setHeader('Content-Length', exportResult.buffer.length);
    
    console.log(`✅ Enviando arquivo: ${exportResult.filename} (${exportResult.totalRecords} registros)`);
    
    // Send file
    res.send(exportResult.buffer);
    
  } catch (error) {
    console.error('❌ Erro no export:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar vendas',
      error: error.message
    });
  }
});

module.exports = router;
