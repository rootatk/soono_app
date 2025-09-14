const XLSX = require('xlsx');
const { Op } = require('sequelize');
const VendaCabecalho = require('../models/VendaCabecalho');
const VendaItem = require('../models/VendaItem');
const Produto = require('../models/Produto');

/**
 * Export sales data to Excel with specified columns:
 * Data da Venda, Cliente, Produtos, Qnt Produtos, Total Final, Lucro Total
 */
const exportSalesData = async (startDate, endDate) => {
  try {
    console.log(`📊 Exportando vendas de ${startDate} até ${endDate}`);
    
    // Build where clause for date filtering
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.data = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Get sales data with items and products
    const vendas = await VendaCabecalho.findAll({
      where: whereClause,
      include: [{
        model: VendaItem,
        as: 'itens', // Use the correct alias
        include: [{
          model: Produto,
          as: 'produto', // Use the correct alias
          attributes: ['id', 'nome', 'precoVenda', 'custoTotal']
        }]
      }],
      order: [['data', 'DESC']]
    });

    console.log(`📋 Encontradas ${vendas.length} vendas para exportar`);

    // Format data for export
    const exportData = [];
    
    vendas.forEach(venda => {
      // Calculate aggregated data for this sale
      const produtos = [];
      let quantidadeTotal = 0;
      
      venda.itens.forEach(item => {
        // Add product to list
        produtos.push(`${item.produto.nome} (${item.quantidade}x)`);
        
        // Sum total quantity
        quantidadeTotal += item.quantidade;
      });

      // Add row to export data
      exportData.push({
        'Data da Venda': formatDate(venda.data),
        'Código da Venda': venda.codigo,
        'Cliente': venda.cliente || 'Não informado',
        'Produtos': produtos.join(', '),
        'Qnt Produtos': quantidadeTotal,
        'Total Final': `R$ ${parseFloat(venda.total || 0).toFixed(2).replace('.', ',')}`,
        'Lucro Total': `R$ ${parseFloat(venda.lucro_total || 0).toFixed(2).replace('.', ',')}`
      });
    });

    // Generate Excel file
    const excelBuffer = generateExcelFile(exportData, startDate, endDate);
    
    console.log(`✅ Arquivo Excel gerado com ${exportData.length} linhas`);
    
    return {
      buffer: excelBuffer,
      filename: generateFilename(startDate, endDate),
      totalRecords: exportData.length
    };
    
  } catch (error) {
    console.error('❌ Erro ao exportar vendas:', error);
    throw new Error(`Erro ao exportar vendas: ${error.message}`);
  }
};

/**
 * Generate Excel file from data
 */
const generateExcelFile = (data, startDate, endDate) => {
  try {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths for better formatting
    const colWidths = [
      { wch: 12 }, // Data da Venda
      { wch: 15 }, // Código da Venda
      { wch: 20 }, // Cliente
      { wch: 40 }, // Produtos
      { wch: 12 }, // Qnt Produtos
      { wch: 12 }, // Total Final
      { wch: 12 }  // Lucro Total
    ];
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Vendas Detalhadas');
    
    // Add summary sheet
    const summaryData = generateSummaryData(data, startDate, endDate);
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo');
    
    // Generate buffer
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
  } catch (error) {
    throw new Error(`Erro ao gerar arquivo Excel: ${error.message}`);
  }
};

/**
 * Generate summary data for second sheet
 */
const generateSummaryData = (data, startDate, endDate) => {
  const totalVendas = data.length;
  const totalFaturamento = data.reduce((sum, row) => {
    const valor = parseFloat(row['Total Final'].replace('R$ ', '').replace(',', '.'));
    return sum + valor;
  }, 0);
  const totalLucro = data.reduce((sum, row) => {
    const valor = parseFloat(row['Lucro Total'].replace('R$ ', '').replace(',', '.'));
    return sum + valor;
  }, 0);
  const totalProdutos = data.reduce((sum, row) => sum + row['Qnt Produtos'], 0);

  return [
    { 'Período': 'Informação', 'Valor': `${startDate} até ${endDate}` },
    { 'Período': '', 'Valor': '' },
    { 'Período': 'Total de Vendas', 'Valor': totalVendas },
    { 'Período': 'Total de Produtos Vendidos', 'Valor': totalProdutos },
    { 'Período': 'Faturamento Total', 'Valor': `R$ ${totalFaturamento.toFixed(2).replace('.', ',')}` },
    { 'Período': 'Lucro Total', 'Valor': `R$ ${totalLucro.toFixed(2).replace('.', ',')}` },
    { 'Período': 'Margem de Lucro', 'Valor': `${((totalLucro / totalFaturamento) * 100).toFixed(1)}%` }
  ];
};

/**
 * Format date for display - avoid timezone issues
 */
const formatDate = (date) => {
  // Handle DATEONLY format to avoid timezone shifting
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Already in YYYY-MM-DD format, just format for display
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }
  
  // Fallback for other date formats
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
};

/**
 * Generate filename with date range
 */
const generateFilename = (startDate, endDate) => {
  const start = startDate ? startDate.replace(/-/g, '') : 'inicio';
  const end = endDate ? endDate.replace(/-/g, '') : 'fim';
  return `vendas_${start}_ate_${end}.xlsx`;
};

module.exports = {
  exportSalesData
};