const VendaCabecalho = require('../models/VendaCabecalho');
const VendaItem = require('../models/VendaItem');
const Produto = require('../models/Produto');
const { Op } = require('sequelize');
const { 
  calcularTotaisVenda, 
  simularPrecoComMargem,
  calcularDescontoCombo 
} = require('../utils/calculoLucro');

// Estabelecer relações entre os models
VendaCabecalho.hasMany(VendaItem, { foreignKey: 'venda_cabecalho_id', as: 'itens' });
VendaItem.belongsTo(VendaCabecalho, { foreignKey: 'venda_cabecalho_id', as: 'venda' });
VendaItem.belongsTo(Produto, { foreignKey: 'produto_id', as: 'produto' });

/**
 * Gera código único para a venda
 */
const gerarCodigoVenda = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `V${timestamp}${random}`;
};

/**
 * Listar todas as vendas
 */
const listar = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, dataInicio, dataFim } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (dataInicio && dataFim) {
      where.data = {
        [Op.between]: [dataInicio, dataFim]
      };
    }
    
    const { rows: vendas, count: total } = await VendaCabecalho.findAndCountAll({
      where,
      include: [{
        model: VendaItem,
        as: 'itens',
        include: [{
          model: Produto,
          as: 'produto',
          attributes: ['id', 'nome', 'imagemUrl']
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Recalcular totais para cada venda
    const vendasComTotais = vendas.map(venda => {
      // Calcular totais baseado nos itens da venda
      let subtotalCalculado = 0;
      let custoTotalCalculado = 0;
      let quantidadeTotalItens = 0;
      
      venda.itens.forEach(item => {
        const quantidade = parseInt(item.quantidade) || 0;
        const precoUnitarioFinal = parseFloat(item.preco_unitario_final) || 0;
        const custoTotal = parseFloat(item.custo_total) || 0;
        
        subtotalCalculado += quantidade * precoUnitarioFinal;
        custoTotalCalculado += custoTotal;
        quantidadeTotalItens += quantidade;
      });
      
      // Aplicar desconto percentual baseado na quantidade de produtos
      let descontoPercentual = 0;
      if (quantidadeTotalItens >= 3) {
        descontoPercentual = 10; // 10% para 3 ou mais itens
      } else if (quantidadeTotalItens === 2) {
        descontoPercentual = 5; // 5% para 2 itens
      }
      
      // Calcular desconto percentual
      let descontoValor = 0;
      if (descontoPercentual > 0) {
        descontoValor = (subtotalCalculado * descontoPercentual) / 100;
      }
      
      // Total final após desconto
      let totalFinal = subtotalCalculado - descontoValor;
      
      // Lucro total
      let lucroTotal = totalFinal - custoTotalCalculado;

      return {
        ...venda.toJSON(),
        subtotal: subtotalCalculado,
        desconto_percentual: descontoPercentual,
        desconto_valor: descontoValor,
        total: totalFinal,
        lucro_total: lucroTotal,
        quantidade_produtos: quantidadeTotalItens
      };
    });
    
    res.json({
      vendas: vendasComTotais,
      total,
      totalPaginas: Math.ceil(total / limit),
      paginaAtual: parseInt(page)
    });
  } catch (error) {
    console.error('Erro ao listar vendas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
};

/**
 * Buscar venda por ID
 */
const buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const venda = await VendaCabecalho.findByPk(id, {
      include: [{
        model: VendaItem,
        as: 'itens',
        include: [{
          model: Produto,
          as: 'produto',
          attributes: ['id', 'nome', 'imagemUrl', 'custoTotal'],
          required: false // LEFT JOIN - permite itens sem produto associado
        }]
      }]
    });
    
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }

    // Calcular totais baseado nos itens da venda
    let subtotalCalculado = 0;
    let custoTotalCalculado = 0;
    let quantidadeTotalItens = 0;
    
    venda.itens.forEach(item => {
      const quantidade = parseInt(item.quantidade) || 0;
      const precoUnitarioFinal = parseFloat(item.preco_unitario_final) || 0;
      const custoTotal = parseFloat(item.custo_total) || 0;
      
      subtotalCalculado += quantidade * precoUnitarioFinal;
      custoTotalCalculado += custoTotal;
      quantidadeTotalItens += quantidade;
    });
    
    // Aplicar desconto percentual baseado na quantidade
    let descontoPercentual = 0;
    if (quantidadeTotalItens >= 3) {
      descontoPercentual = 10; // 10% para 3 ou mais itens
    } else if (quantidadeTotalItens === 2) {
      descontoPercentual = 5; // 5% para 2 itens
    }
    
    // Calcular desconto percentual
    let descontoValor = 0;
    if (descontoPercentual > 0) {
      descontoValor = (subtotalCalculado * descontoPercentual) / 100;
    }
    
    // Total final após desconto
    let totalFinal = subtotalCalculado - descontoValor;
    
    // Lucro total
    let lucroTotal = totalFinal - custoTotalCalculado;
    
    // Retornar venda com totais recalculados
    const vendaComTotais = {
      ...venda.toJSON(),
      subtotal: subtotalCalculado,
      desconto_percentual: descontoPercentual,
      desconto_valor: descontoValor,
      total: totalFinal,
      lucro_total: lucroTotal,
      quantidade_produtos: quantidadeTotalItens
    };
    
    res.json(vendaComTotais);
  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
};

/**
 * Criar nova venda
 */
const criar = async (req, res) => {
  const transaction = await VendaCabecalho.sequelize.transaction();
  
  try {
    const { 
      itens, 
      cliente, 
      observacoes 
    } = req.body;
    
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Itens da venda são obrigatórios' });
    }
    
    // Buscar produtos para obter custos atuais
    const produtoIds = itens.map(item => item.produto_id);
    const produtos = await Produto.findAll({
      where: { id: produtoIds }
    });
    
    const produtosMap = {};
    produtos.forEach(produto => {
      produtosMap[produto.id] = produto;
    });
    
    // Preparar itens com custos atualizados
    const itensComCustos = itens.map(item => {
      const produto = produtosMap[item.produto_id];
      if (!produto) {
        throw new Error(`Produto ID ${item.produto_id} não encontrado`);
      }
      
      const quantidade = parseInt(item.quantidade) || 1;
      const custoUnitario = parseFloat(produto.custoTotal) || 0;
      const custoTotal = custoUnitario * quantidade;
      
      // Se tem margem simulada, calcular novo preço
      let precoUnitarioFinal = parseFloat(produto.precoVenda) || 0;
      if (item.margem_simulada !== undefined && item.margem_simulada !== null) {
        const simulacao = simularPrecoComMargem(custoUnitario, item.margem_simulada);
        if (!simulacao.erro) {
          precoUnitarioFinal = simulacao.precoVenda;
        }
      }
      
      const valorTotal = precoUnitarioFinal * quantidade;
      const lucroItem = valorTotal - custoTotal;
      
      return {
        ...item,
        produto_nome: produto.nome,
        preco_unitario_original: parseFloat(produto.precoVenda),
        preco_unitario_final: precoUnitarioFinal,
        valor_total: valorTotal,
        custo_total: custoTotal,
        lucro_item: lucroItem,
        eh_brinde: item.eh_brinde || false,
        insumos_snapshot: produto.insumosUtilizados || null
      };
    });
    
    // Calcular totais da venda
    const totaisVenda = calcularTotaisVenda(itensComCustos);
    
    // Criar cabeçalho da venda
    const vendaCabecalho = await VendaCabecalho.create({
      codigo: gerarCodigoVenda(),
      data: new Date(),
      subtotal: totaisVenda.subtotal,
      desconto_percentual: totaisVenda.descontoCombo.percentualDesconto,
      desconto_valor: totaisVenda.descontoCombo.valorDesconto,
      total: totaisVenda.total,
      lucro_total: totaisVenda.lucroTotal,
      quantidade_produtos: totaisVenda.descontoCombo.quantidadeParaDesconto,
      cliente: cliente || null,
      observacoes: observacoes || null,
      status: 'rascunho'
    }, { transaction });
    
    // Criar itens da venda
    const itensParaCriar = itensComCustos.map(item => ({
      ...item,
      venda_cabecalho_id: vendaCabecalho.id
    }));
    
    await VendaItem.bulkCreate(itensParaCriar, { transaction });
    
    await transaction.commit();
    
    // Buscar venda completa para retornar
    const vendaCompleta = await VendaCabecalho.findByPk(vendaCabecalho.id, {
      include: [{
        model: VendaItem,
        as: 'itens',
        include: [{
          model: Produto,
          as: 'produto',
          attributes: ['id', 'nome', 'imagemUrl']
        }]
      }]
    });
    
    res.status(201).json(vendaCompleta);
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao criar venda:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
};

/**
 * Simular preços em tempo real
 */
const simularPrecos = async (req, res) => {
  try {
    const { itens } = req.body;
    
    if (!itens || !Array.isArray(itens)) {
      return res.status(400).json({ error: 'Itens são obrigatórios para simulação' });
    }
    
    // Buscar produtos para obter custos
    const produtoIds = itens.map(item => item.produto_id);
    const produtos = await Produto.findAll({
      where: { id: produtoIds }
    });
    
    const produtosMap = {};
    produtos.forEach(produto => {
      produtosMap[produto.id] = produto;
    });
    
    // Processar cada item com simulação
    const itensSimulados = itens.map(item => {
      const produto = produtosMap[item.produto_id];
      if (!produto) {
        return {
          ...item,
          erro: 'Produto não encontrado'
        };
      }
      
      const quantidade = parseInt(item.quantidade) || 1;
      const custoUnitario = parseFloat(produto.custoTotal) || 0;
      const precoOriginal = parseFloat(produto.precoVenda) || 0;
      
      // Simular nova margem se fornecida
      let simulacao = {
        precoVenda: precoOriginal,
        lucro: precoOriginal - custoUnitario,
        margemReal: precoOriginal > 0 ? ((precoOriginal - custoUnitario) / precoOriginal) * 100 : 0
      };
      
      if (item.margem_simulada !== undefined && item.margem_simulada !== null) {
        simulacao = simularPrecoComMargem(custoUnitario, item.margem_simulada);
      }
      
      const valorTotal = simulacao.precoVenda * quantidade;
      const custoTotal = custoUnitario * quantidade;
      const lucroTotal = valorTotal - custoTotal;
      
      return {
        produto_id: item.produto_id,
        produto_nome: produto.nome,
        quantidade: quantidade,
        custo_unitario: custoUnitario,
        preco_original: precoOriginal,
        margem_simulada: item.margem_simulada,
        preco_simulado: simulacao.precoVenda,
        valor_total: valorTotal,
        custo_total: custoTotal,
        lucro_total: lucroTotal,
        margem_real: simulacao.margemReal,
        eh_brinde: item.eh_brinde || false,
        erro: simulacao.erro || null
      };
    });
    
    // Calcular totais com nova lógica de desconto simplificada
    let subtotalCalculado = 0;
    let custoTotalCalculado = 0;
    let quantidadeTotalItens = 0;
    
    itensSimulados.forEach(item => {
      const quantidade = parseInt(item.quantidade) || 0;
      const precoUnitarioFinal = parseFloat(item.preco_simulado) || 0;
      const custoTotal = parseFloat(item.custo_total) || 0;
      
      subtotalCalculado += quantidade * precoUnitarioFinal;
      custoTotalCalculado += custoTotal;
      quantidadeTotalItens += quantidade;
    });
    
    // Aplicar desconto percentual baseado na quantidade
    let descontoPercentual = 0;
    if (quantidadeTotalItens >= 3) {
      descontoPercentual = 10; // 10% para 3 ou mais itens
    } else if (quantidadeTotalItens === 2) {
      descontoPercentual = 5; // 5% para 2 itens
    }
    
    // Calcular desconto percentual
    let descontoValor = 0;
    if (descontoPercentual > 0) {
      descontoValor = (subtotalCalculado * descontoPercentual) / 100;
    }
    
    // Total final após desconto
    let totalFinal = subtotalCalculado - descontoValor;
    
    // Lucro total
    let lucroTotal = totalFinal - custoTotalCalculado;
    
    // Margem real total
    let margemRealTotal = totalFinal > 0 ? (lucroTotal / totalFinal) * 100 : 0;
    
    const totaisVenda = {
      subtotal: subtotalCalculado,
      descontoCombo: {
        quantidadeParaDesconto: quantidadeTotalItens,
        percentualDesconto: descontoPercentual,
        aplicaDesconto: descontoPercentual > 0,
        valorDesconto: descontoValor
      },
      total: totalFinal,
      custoTotal: custoTotalCalculado,
      lucroTotal: lucroTotal,
      margemRealTotal: margemRealTotal
    };
    
    res.json({
      itens: itensSimulados,
      totais: totaisVenda
    });
  } catch (error) {
    console.error('Erro ao simular preços:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
};

// Atualizar venda existente
const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { itens, cliente, observacoes } = req.body;

    // Verificar se a venda existe
    const vendaExistente = await VendaCabecalho.findByPk(id);
    if (!vendaExistente) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }

    // Só permite atualizar vendas em rascunho
    if (vendaExistente.status !== 'rascunho') {
      return res.status(400).json({ 
        error: 'Só é possível editar vendas em rascunho' 
      });
    }

    // Remover itens existentes
    await VendaItem.destroy({
      where: { venda_cabecalho_id: id }
    });

    // Buscar produtos para obter custos atualizados
    const produtoIds = itens.map(item => item.produto_id);
    const produtos = await Produto.findAll({
      where: { id: produtoIds },
      attributes: ['id', 'nome', 'custoTotal', 'precoVenda']
    });

    const produtosMap = {};
    produtos.forEach(produto => {
      produtosMap[produto.id] = produto;
    });

    // Calcular totais dos novos itens com custos corretos
    const itensComCustos = itens.map(item => {
      const produto = produtosMap[item.produto_id];
      if (!produto) {
        throw new Error(`Produto ID ${item.produto_id} não encontrado`);
      }

      const quantidade = parseInt(item.quantidade) || 1;
      const custoUnitario = parseFloat(produto.custoTotal) || 0;
      const custoTotal = custoUnitario * quantidade;

      return {
        ...item,
        custoTotal: custoTotal,
        produto: produto
      };
    });

    const totaisCalculados = calcularTotaisVenda(itensComCustos);

    // Atualizar cabeçalho da venda
    await vendaExistente.update({
      quantidade_produtos: totaisCalculados.quantidadeProdutos,
      subtotal: totaisCalculados.subtotal,
      desconto_percentual: totaisCalculados.descontoPercentual,
      desconto_valor: totaisCalculados.descontoValor,
      total: totaisCalculados.total,
      lucro_total: totaisCalculados.lucroTotal,
      cliente,
      observacoes
    });

    // Criar novos itens com custos corretos
    const itensParaCriar = itensComCustos.map(item => {
      const produto = produtosMap[item.produto_id];
      const quantidade = parseInt(item.quantidade) || 1;
      const custoUnitario = parseFloat(produto.custoTotal) || 0;
      const custoTotal = custoUnitario * quantidade;
      const precoFinal = item.preco_simulado || item.preco_original || 0;
      const valorTotal = precoFinal * quantidade;
      const lucroItem = valorTotal - custoTotal;

      return {
        venda_cabecalho_id: id,
        produto_id: item.produto_id,
        produto_nome: produto.nome,
        quantidade: quantidade,
        preco_unitario_original: item.preco_original || produto.precoVenda || 0,
        margem_simulada: item.margem_simulada || null,
        preco_unitario_final: precoFinal,
        valor_total: valorTotal,
        custo_total: custoTotal,
        lucro_item: lucroItem,
        eh_brinde: item.eh_brinde || false,
        conta_como_um_produto: item.conta_como_um_produto || false
      };
    });

    await VendaItem.bulkCreate(itensParaCriar);

    // Buscar venda completa atualizada
    const vendaCompleta = await VendaCabecalho.findByPk(id, {
      include: [{
        model: VendaItem,
        as: 'itens',
        include: [{
          model: Produto,
          as: 'produto',
          attributes: ['id', 'nome', 'imagemUrl', 'custoTotal']
        }]
      }]
    });

    res.json(vendaCompleta);
  } catch (error) {
    console.error('Erro ao atualizar venda:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
};

/**
 * Finalizar venda (mudar status para finalizada)
 */
const finalizar = async (req, res) => {
  try {
    const { id } = req.params;
    
    const venda = await VendaCabecalho.findByPk(id);
    
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    
    if (venda.status === 'finalizada') {
      return res.status(400).json({ error: 'Venda já está finalizada' });
    }
    
    if (venda.status === 'cancelada') {
      return res.status(400).json({ error: 'Não é possível finalizar uma venda cancelada' });
    }
    
    await venda.update({ status: 'finalizada' });
    
    res.json({ message: 'Venda finalizada com sucesso', venda });
  } catch (error) {
    console.error('Erro ao finalizar venda:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
};

/**
 * Cancelar venda
 */
const cancelar = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    const venda = await VendaCabecalho.findByPk(id);
    
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    
    if (venda.status === 'cancelada') {
      return res.status(400).json({ error: 'Venda já está cancelada' });
    }
    
    const observacoesAtualizadas = venda.observacoes 
      ? `${venda.observacoes}\n\n[CANCELAMENTO] ${motivo || 'Sem motivo informado'}`
      : `[CANCELAMENTO] ${motivo || 'Sem motivo informado'}`;
    
    await venda.update({ 
      status: 'cancelada',
      observacoes: observacoesAtualizadas
    });
    
    res.json({ message: 'Venda cancelada com sucesso', venda });
  } catch (error) {
    console.error('Erro ao cancelar venda:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
};

// Excluir venda
const excluir = async (req, res) => {
  try {
    const { id } = req.params;
    
    const venda = await VendaCabecalho.findByPk(id);
    
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }

    // Permite excluir vendas em qualquer status (rascunho, finalizada ou cancelada)
    // Vendas canceladas podem ser excluídas para limpeza do histórico

    // Excluir itens da venda primeiro (por causa da FK)
    await VendaItem.destroy({
      where: { venda_cabecalho_id: id }
    });

    // Excluir a venda
    await venda.destroy();

    res.json({ 
      message: 'Venda excluída com sucesso',
      vendaId: id 
    });
  } catch (error) {
    console.error('Erro ao excluir venda:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
};

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  simularPrecos,
  finalizar,
  cancelar,
  excluir
};
