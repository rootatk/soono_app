/**
 * Controller para gerenciar Vendas
 * Sistema Sóonó - Macramê & Crochê
 */

const Venda = require('../models/Venda');
const Produto = require('../models/Produto');
const Insumo = require('../models/Insumo');
const { Op } = require('sequelize');

/**
 * GET /api/vendas - Listar todas as vendas
 */
const listarVendas = async (req, res) => {
  try {
    const {
      data_inicio,
      data_fim,
      produto_id,
      cliente,
      busca,
      ordenar = 'dataVenda',
      direcao = 'DESC'
    } = req.query;

    const filtros = {};
    const ordem = [];

    // Filtro por período
    if (data_inicio || data_fim) {
      filtros.dataVenda = {};
      if (data_inicio) filtros.dataVenda[Op.gte] = data_inicio;
      if (data_fim) filtros.dataVenda[Op.lte] = data_fim;
    }

    // Filtro por produto
    if (produto_id) {
      filtros.produtoId = produto_id;
    }

    // Filtro por cliente
    if (cliente && cliente.trim()) {
      filtros.cliente = { [Op.like]: `%${cliente.trim()}%` };
    }

    // Filtro por busca geral
    if (busca && busca.trim()) {
      filtros[Op.or] = [
        { produtoNome: { [Op.like]: `%${busca.trim()}%` } },
        { cliente: { [Op.like]: `%${busca.trim()}%` } },
        { observacoes: { [Op.like]: `%${busca.trim()}%` } }
      ];
    }

    // Ordenação
    if (['dataVenda', 'produtoNome', 'valorTotal', 'lucroReal'].includes(ordenar)) {
      ordem.push([ordenar, direcao.toUpperCase()]);
    } else {
      ordem.push(['dataVenda', 'DESC']);
    }

    const vendas = await Venda.findAll({
      where: filtros,
      order: ordem
    });

    // Calcular estatísticas
    const stats = {
      totalVendas: vendas.length,
      faturamentoTotal: vendas.reduce((total, venda) => 
        total + parseFloat(venda.valorTotal), 0
      ),
      lucroTotal: vendas.reduce((total, venda) => 
        total + parseFloat(venda.lucroReal), 0
      ),
      ticketMedio: vendas.length > 0 ? 
        vendas.reduce((total, venda) => total + parseFloat(venda.valorTotal), 0) / vendas.length : 0
    };

    res.json({
      success: true,
      data: vendas,
      stats,
      filtros: { data_inicio, data_fim, produto_id, cliente, busca }
    });

  } catch (error) {
    console.error('Erro ao listar vendas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * GET /api/vendas/:id - Buscar venda por ID
 */
const buscarVendaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const venda = await Venda.findByPk(id);

    if (!venda) {
      return res.status(404).json({
        success: false,
        error: 'Venda não encontrada'
      });
    }

    res.json({
      success: true,
      data: venda
    });

  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * POST /api/vendas - Criar nova venda
 */
const criarVenda = async (req, res) => {
  try {
    const {
      produtoId,
      quantidade = 1,
      precoUnitario,
      dataVenda,
      cliente,
      observacoes
    } = req.body;

    // Validações básicas
    if (!produtoId) {
      return res.status(400).json({
        success: false,
        error: 'ID do produto é obrigatório'
      });
    }

    if (!precoUnitario || parseFloat(precoUnitario) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Preço unitário deve ser maior que zero'
      });
    }

    if (parseInt(quantidade) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantidade deve ser maior que zero'
      });
    }

    // Buscar produto
    const produto = await Produto.findByPk(produtoId);

    if (!produto) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
    }

    if (!produto.ativo) {
      return res.status(400).json({
        success: false,
        error: 'Produto está inativo'
      });
    }

    // Verificar disponibilidade de insumos
    if (produto.insumos && produto.insumos.length > 0) {
      const idsInsumos = produto.insumos.map(item => item.id);
      const insumos = await Insumo.findAll({
        where: { id: idsInsumos }
      });

      const insumosInsuficientes = [];

      for (const insumoUtilizado of produto.insumos) {
        const insumo = insumos.find(i => i.id === insumoUtilizado.id);
        if (!insumo) {
          insumosInsuficientes.push(`Insumo ID ${insumoUtilizado.id} não encontrado`);
          continue;
        }

        const quantidadeNecessaria = parseFloat(insumoUtilizado.quantidade) * parseInt(quantidade);
        const estoqueAtual = parseFloat(insumo.estoqueAtual);

        if (estoqueAtual < quantidadeNecessaria) {
          insumosInsuficientes.push(
            `${insumo.nome}: necessário ${quantidadeNecessaria} ${insumo.unidade}, disponível ${estoqueAtual}`
          );
        }
      }

      if (insumosInsuficientes.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Estoque insuficiente',
          details: insumosInsuficientes
        });
      }

      // Deduzir do estoque
      for (const insumoUtilizado of produto.insumos) {
        const insumo = insumos.find(i => i.id === insumoUtilizado.id);
        const quantidadeNecessaria = parseFloat(insumoUtilizado.quantidade) * parseInt(quantidade);
        const novoEstoque = parseFloat(insumo.estoqueAtual) - quantidadeNecessaria;

        await insumo.update({ estoqueAtual: novoEstoque });
      }
    }

    // Calcular valores
    const valorTotal = parseFloat(precoUnitario) * parseInt(quantidade);
    const custoTotalProduto = parseFloat(produto.custoTotal) * parseInt(quantidade);
    const lucroReal = valorTotal - custoTotalProduto;

    // Snapshot dos insumos utilizados
    let insumosSnapshot = null;
    if (produto.insumos && produto.insumos.length > 0) {
      const idsInsumos = produto.insumos.map(item => item.id);
      const insumosCompletos = await Insumo.findAll({
        where: { id: idsInsumos }
      });

      insumosSnapshot = produto.insumos.map(insumoUtilizado => {
        const insumoCompleto = insumosCompletos.find(i => i.id === insumoUtilizado.id);
        return {
          id: insumoUtilizado.id,
          nome: insumoCompleto?.nome,
          quantidade: insumoUtilizado.quantidade,
          custoUnitario: insumoCompleto?.custoUnitario,
          unidade: insumoCompleto?.unidade
        };
      });
    }

    const novaVenda = await Venda.create({
      produtoId,
      produtoNome: produto.nome,
      quantidade: parseInt(quantidade),
      precoUnitario: parseFloat(precoUnitario),
      valorTotal,
      custoTotalProduto,
      lucroReal,
      dataVenda: dataVenda || new Date().toISOString().split('T')[0],
      cliente: cliente?.trim(),
      observacoes: observacoes?.trim(),
      insumosUtilizados: insumosSnapshot
    });

    res.status(201).json({
      success: true,
      message: 'Venda registrada com sucesso',
      data: novaVenda
    });

  } catch (error) {
    console.error('Erro ao criar venda:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors.map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * PUT /api/vendas/:id - Atualizar venda
 */
const atualizarVenda = async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizacao = req.body;

    const venda = await Venda.findByPk(id);

    if (!venda) {
      return res.status(404).json({
        success: false,
        error: 'Venda não encontrada'
      });
    }

    // Preparar dados para atualização
    const dadosLimpos = { ...dadosAtualizacao };
    
    if (dadosLimpos.cliente) dadosLimpos.cliente = dadosLimpos.cliente.trim();
    if (dadosLimpos.observacoes) dadosLimpos.observacoes = dadosLimpos.observacoes.trim();

    // Recalcular se mudou preço ou quantidade
    if (dadosLimpos.precoUnitario !== undefined || dadosLimpos.quantidade !== undefined) {
      const novoPreco = parseFloat(dadosLimpos.precoUnitario || venda.precoUnitario);
      const novaQuantidade = parseInt(dadosLimpos.quantidade || venda.quantidade);
      
      dadosLimpos.valorTotal = novoPreco * novaQuantidade;
      dadosLimpos.lucroReal = dadosLimpos.valorTotal - (parseFloat(venda.custoTotalProduto) / parseInt(venda.quantidade) * novaQuantidade);
    }

    await venda.update(dadosLimpos);
    await venda.reload();

    res.json({
      success: true,
      message: 'Venda atualizada com sucesso',
      data: venda
    });

  } catch (error) {
    console.error('Erro ao atualizar venda:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors.map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * DELETE /api/vendas/:id - Excluir venda (reverter estoque)
 */
const excluirVenda = async (req, res) => {
  try {
    const { id } = req.params;
    const { reverter_estoque = 'true' } = req.query;

    const venda = await Venda.findByPk(id);

    if (!venda) {
      return res.status(404).json({
        success: false,
        error: 'Venda não encontrada'
      });
    }

    // Reverter estoque se solicitado e tiver snapshot dos insumos
    if (reverter_estoque === 'true' && venda.insumosUtilizados) {
      const insumosUtilizados = venda.insumosUtilizados;
      
      for (const insumoUtilizado of insumosUtilizados) {
        const insumo = await Insumo.findByPk(insumoUtilizado.id);
        
        if (insumo) {
          const quantidadeRetornar = parseFloat(insumoUtilizado.quantidade) * parseInt(venda.quantidade);
          const novoEstoque = parseFloat(insumo.estoqueAtual) + quantidadeRetornar;
          
          await insumo.update({ estoqueAtual: novoEstoque });
        }
      }
    }

    await venda.destroy();

    res.json({
      success: true,
      message: `Venda excluída${reverter_estoque === 'true' ? ' e estoque revertido' : ''} com sucesso`
    });

  } catch (error) {
    console.error('Erro ao excluir venda:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * GET /api/vendas/relatorio/periodo - Relatório de vendas por período
 */
const relatorioVendasPeriodo = async (req, res) => {
  try {
    const {
      data_inicio,
      data_fim,
      agrupar_por = 'mes' // 'dia', 'semana', 'mes'
    } = req.query;

    const filtros = {};

    // Filtro por período
    if (data_inicio || data_fim) {
      filtros.dataVenda = {};
      if (data_inicio) filtros.dataVenda[Op.gte] = data_inicio;
      if (data_fim) filtros.dataVenda[Op.lte] = data_fim;
    }

    const vendas = await Venda.findAll({
      where: filtros,
      order: [['dataVenda', 'ASC']]
    });

    // Agrupar vendas por período
    const vendasAgrupadas = {};
    
    vendas.forEach(venda => {
      const data = new Date(venda.dataVenda);
      let chave;

      switch (agrupar_por) {
        case 'dia':
          chave = data.toISOString().split('T')[0];
          break;
        case 'semana':
          const inicioSemana = new Date(data);
          inicioSemana.setDate(data.getDate() - data.getDay());
          chave = inicioSemana.toISOString().split('T')[0];
          break;
        case 'mes':
        default:
          chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!vendasAgrupadas[chave]) {
        vendasAgrupadas[chave] = {
          periodo: chave,
          totalVendas: 0,
          quantidadeItens: 0,
          faturamento: 0,
          lucro: 0,
          vendas: []
        };
      }

      vendasAgrupadas[chave].totalVendas++;
      vendasAgrupadas[chave].quantidadeItens += parseInt(venda.quantidade);
      vendasAgrupadas[chave].faturamento += parseFloat(venda.valorTotal);
      vendasAgrupadas[chave].lucro += parseFloat(venda.lucroReal);
      vendasAgrupadas[chave].vendas.push(venda);
    });

    // Converter para array e ordenar
    const relatorio = Object.values(vendasAgrupadas).sort((a, b) => 
      a.periodo.localeCompare(b.periodo)
    );

    // Estatísticas gerais
    const stats = {
      totalPeriodos: relatorio.length,
      totalVendas: vendas.length,
      faturamentoTotal: vendas.reduce((total, venda) => 
        total + parseFloat(venda.valorTotal), 0
      ),
      lucroTotal: vendas.reduce((total, venda) => 
        total + parseFloat(venda.lucroReal), 0
      ),
      ticketMedio: vendas.length > 0 ? 
        vendas.reduce((total, venda) => total + parseFloat(venda.valorTotal), 0) / vendas.length : 0
    };

    res.json({
      success: true,
      data: relatorio,
      stats,
      filtros: { data_inicio, data_fim, agrupar_por }
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de vendas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * GET /api/vendas/produtos/ranking - Ranking de produtos mais vendidos
 */
const rankingProdutos = async (req, res) => {
  try {
    const {
      data_inicio,
      data_fim,
      limite = 10
    } = req.query;

    const filtros = {};

    // Filtro por período
    if (data_inicio || data_fim) {
      filtros.dataVenda = {};
      if (data_inicio) filtros.dataVenda[Op.gte] = data_inicio;
      if (data_fim) filtros.dataVenda[Op.lte] = data_fim;
    }

    const vendas = await Venda.findAll({
      where: filtros,
      order: [['dataVenda', 'DESC']]
    });

    // Agrupar por produto
    const produtosRanking = {};

    vendas.forEach(venda => {
      const produtoId = venda.produtoId;
      
      if (!produtosRanking[produtoId]) {
        produtosRanking[produtoId] = {
          produtoId,
          produtoNome: venda.produtoNome,
          totalVendas: 0,
          quantidadeVendida: 0,
          faturamento: 0,
          lucro: 0,
          precoMedio: 0
        };
      }

      produtosRanking[produtoId].totalVendas++;
      produtosRanking[produtoId].quantidadeVendida += parseInt(venda.quantidade);
      produtosRanking[produtoId].faturamento += parseFloat(venda.valorTotal);
      produtosRanking[produtoId].lucro += parseFloat(venda.lucroReal);
    });

    // Calcular preço médio e converter para array
    const ranking = Object.values(produtosRanking).map(produto => ({
      ...produto,
      precoMedio: produto.faturamento / produto.quantidadeVendida
    }));

    // Ordenar por quantidade vendida (decrescente)
    ranking.sort((a, b) => b.quantidadeVendida - a.quantidadeVendida);

    // Limitar resultados
    const rankingLimitado = ranking.slice(0, parseInt(limite));

    res.json({
      success: true,
      data: rankingLimitado,
      total: ranking.length,
      filtros: { data_inicio, data_fim, limite }
    });

  } catch (error) {
    console.error('Erro ao gerar ranking de produtos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * GET /api/vendas/clientes/ranking - Ranking de clientes que mais compraram
 */
const rankingClientes = async (req, res) => {
  try {
    const {
      data_inicio,
      data_fim,
      limite = 10
    } = req.query;

    const filtros = {};

    // Filtro por período
    if (data_inicio || data_fim) {
      filtros.dataVenda = {};
      if (data_inicio) filtros.dataVenda[Op.gte] = data_inicio;
      if (data_fim) filtros.dataVenda[Op.lte] = data_fim;
    }

    // Só vendas com cliente informado
    filtros.cliente = { [Op.not]: null, [Op.ne]: '' };

    const vendas = await Venda.findAll({
      where: filtros,
      order: [['dataVenda', 'DESC']]
    });

    // Agrupar por cliente
    const clientesRanking = {};

    vendas.forEach(venda => {
      const cliente = venda.cliente.trim().toLowerCase();
      
      if (!clientesRanking[cliente]) {
        clientesRanking[cliente] = {
          cliente: venda.cliente, // Nome original
          totalCompras: 0,
          quantidadeItens: 0,
          valorGasto: 0,
          ultimaCompra: venda.dataVenda,
          ticketMedio: 0
        };
      }

      clientesRanking[cliente].totalCompras++;
      clientesRanking[cliente].quantidadeItens += parseInt(venda.quantidade);
      clientesRanking[cliente].valorGasto += parseFloat(venda.valorTotal);
      
      // Atualizar última compra se for mais recente
      if (new Date(venda.dataVenda) > new Date(clientesRanking[cliente].ultimaCompra)) {
        clientesRanking[cliente].ultimaCompra = venda.dataVenda;
      }
    });

    // Calcular ticket médio e converter para array
    const ranking = Object.values(clientesRanking).map(cliente => ({
      ...cliente,
      ticketMedio: cliente.valorGasto / cliente.totalCompras
    }));

    // Ordenar por valor gasto (decrescente)
    ranking.sort((a, b) => b.valorGasto - a.valorGasto);

    // Limitar resultados
    const rankingLimitado = ranking.slice(0, parseInt(limite));

    res.json({
      success: true,
      data: rankingLimitado,
      total: ranking.length,
      filtros: { data_inicio, data_fim, limite }
    });

  } catch (error) {
    console.error('Erro ao gerar ranking de clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

// Exportar todas as funções
module.exports = {
  listarVendas,
  buscarVendaPorId,
  criarVenda,
  atualizarVenda,
  excluirVenda,
  relatorioVendasPeriodo,
  rankingProdutos,
  rankingClientes
};