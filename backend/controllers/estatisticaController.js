/**
 * Controller para Estatísticas e Dashboard
 * Sistema Sóonó - Macramê & Crochê
 */

const Insumo = require('../models/Insumo');
const Produto = require('../models/Produto');
const Venda = require('../models/Venda');
const VendaCabecalho = require('../models/VendaCabecalho');
const VendaItem = require('../models/VendaItem');
const { calcularValorTotalEstoque, identificarEstoqueBaixo } = require('../utils/calculoLucro');
const { Op } = require('sequelize');

/**
 * GET /api/estatisticas/resumo - Resumo geral para o dashboard
 */
const resumoGeral = async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const inicioAno = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

    // Contar registros - usando VendaCabecalho para contadores de vendas (apenas finalizadas)
    const [
      totalInsumos,
      totalProdutos,
      totalVendas,
      vendasHoje,
      vendasMes,
      vendasAno
    ] = await Promise.all([
      Insumo.count({ where: { ativo: true } }),
      Produto.count({ where: { ativo: true } }),
      VendaCabecalho.count({ where: { status: 'finalizada' } }),
      VendaCabecalho.count({ where: { data: hoje, status: 'finalizada' } }),
      VendaCabecalho.count({ where: { data: { [Op.gte]: inicioMes }, status: 'finalizada' } }),
      VendaCabecalho.count({ where: { data: { [Op.gte]: inicioAno }, status: 'finalizada' } })
    ]);

    // Buscar todos os insumos para calcular valor em estoque
    const insumos = await Insumo.findAll({ where: { ativo: true } });
    const valorTotalEstoque = calcularValorTotalEstoque(insumos);
    const insumosEstoqueBaixo = identificarEstoqueBaixo(insumos);

    // Buscar todos os produtos para calcular valores
    const produtos = await Produto.findAll({ where: { ativo: true } });
    const valorEstoqueProdutos = produtos.reduce((total, produto) => 
      total + parseFloat(produto.custoTotal), 0
    );
    const faturamentoPotencial = produtos.reduce((total, produto) => 
      total + parseFloat(produto.precoVenda), 0
    );

    // Estatísticas de vendas - usando VendaCabecalho (apenas finalizadas)
    const vendas = await VendaCabecalho.findAll({
      where: { 
        data: { [Op.gte]: inicioMes },
        status: 'finalizada'
      }
    });

    const faturamentoMes = vendas.reduce((total, venda) => 
      total + parseFloat(venda.total), 0
    );
    const lucroMes = vendas.reduce((total, venda) => 
      total + parseFloat(venda.lucro_total), 0
    );

    const vendasAnoCompleto = await VendaCabecalho.findAll({
      where: { 
        data: { [Op.gte]: inicioAno },
        status: 'finalizada'
      }
    });

    const faturamentoAno = vendasAnoCompleto.reduce((total, venda) => 
      total + parseFloat(venda.total), 0
    );
    const lucroAno = vendasAnoCompleto.reduce((total, venda) => 
      total + parseFloat(venda.lucro_total), 0
    );

    // Análise de descontos progressivos de custo (novo sistema)
    let descontosProgressivos = {
      totalEconomizado: 0,
      vendasComDesconto: 0,
      vendasMultiplosItens: 0,
      margemMelhorada: 0
    };

    try {
      // Buscar vendas com múltiplos itens para analisar desconto progressivo (apenas finalizadas)
      const vendasComItens = await VendaCabecalho.findAll({
        where: { 
          data: { [Op.gte]: inicioMes },
          status: 'finalizada'
        },
        include: [{
          model: VendaItem,
          as: 'itens',
          where: {
            desconto_custo_aplicado: { [Op.gt]: 0 }
          },
          required: false
        }]
      });

      // Calcular estatísticas do desconto progressivo
      vendasComItens.forEach(venda => {
        if (venda.itens && venda.itens.length > 0) {
          const totalItens = venda.itens.reduce((acc, item) => acc + item.quantidade, 0);
          if (totalItens > 1) {
            descontosProgressivos.vendasMultiplosItens++;
          }

          venda.itens.forEach(item => {
            if (item.desconto_custo_aplicado > 0) {
              descontosProgressivos.totalEconomizado += parseFloat(item.desconto_custo_aplicado) * item.quantidade;
              descontosProgressivos.vendasComDesconto++;
            }
          });
        }
      });

      descontosProgressivos.margemMelhorada = descontosProgressivos.totalEconomizado > 0 ? 
        (descontosProgressivos.totalEconomizado / faturamentoMes) * 100 : 0;

    } catch (error) {
      console.warn('Erro ao calcular descontos progressivos:', error.message);
    }

    // Produtos mais lucrativos (top 5)
    const produtosMaisLucrativos = produtos
      .map(produto => ({
        id: produto.id,
        nome: produto.nome,
        lucroUnidade: produto.getLucroPorUnidade(),
        margemReal: produto.getMargemReal(),
        precoVenda: parseFloat(produto.precoVenda)
      }))
      .sort((a, b) => b.lucroUnidade - a.lucroUnidade)
      .slice(0, 5);

    const resumo = {
      contadores: {
        insumos: totalInsumos,
        produtos: totalProdutos,
        vendas: totalVendas,
        vendasHoje,
        vendasMes,
        vendasAno
      },
      estoque: {
        valorTotalInsumos: Math.round(valorTotalEstoque * 100) / 100,
        valorEstoqueProdutos: Math.round(valorEstoqueProdutos * 100) / 100,
        faturamentoPotencial: Math.round(faturamentoPotencial * 100) / 100,
        insumosEstoqueBaixo: insumosEstoqueBaixo.length,
        alertasEstoque: insumosEstoqueBaixo.map(insumo => ({
          id: insumo.id,
          nome: insumo.nome,
          variacao: insumo.variacao,
          estoqueAtual: parseFloat(insumo.estoqueAtual),
          estoqueMinimo: parseFloat(insumo.estoqueMinimo)
        }))
      },
      financeiro: {
        faturamentoMes: Math.round(faturamentoMes * 100) / 100,
        lucroMes: Math.round(lucroMes * 100) / 100,
        faturamentoAno: Math.round(faturamentoAno * 100) / 100,
        lucroAno: Math.round(lucroAno * 100) / 100,
        margemMes: faturamentoMes > 0 ? Math.round((lucroMes / (faturamentoMes - lucroMes)) * 10000) / 100 : 0,
        ticketMedioMes: vendasMes > 0 ? Math.round((faturamentoMes / vendasMes) * 100) / 100 : 0
      },
      descontosProgressivos: {
        totalEconomizado: Math.round(descontosProgressivos.totalEconomizado * 100) / 100,
        vendasComDesconto: descontosProgressivos.vendasComDesconto,
        vendasMultiplosItens: descontosProgressivos.vendasMultiplosItens,
        margemMelhorada: Math.round(descontosProgressivos.margemMelhorada * 100) / 100,
        impactoPercentual: faturamentoMes > 0 ? Math.round((descontosProgressivos.totalEconomizado / faturamentoMes) * 10000) / 100 : 0
      },
      produtosMaisLucrativos
    };

    res.json({
      success: true,
      data: resumo,
      geradoEm: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao gerar resumo geral:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * GET /api/estatisticas/vendas-mensal - Evolução de vendas dos últimos 12 meses
 */
const evolucaoVendasMensal = async (req, res) => {
  try {
    const agora = new Date();
    const dozesMesesAtras = new Date(agora.getFullYear() - 1, agora.getMonth(), 1);

    // Buscar vendas usando o novo modelo VendaCabecalho (apenas finalizadas)
    const vendas = await VendaCabecalho.findAll({
      where: {
        data: { [Op.gte]: dozesMesesAtras.toISOString().split('T')[0] },
        status: 'finalizada'
      },
      include: [{
        model: VendaItem,
        as: 'itens'
      }],
      order: [['data', 'ASC']]
    });

    // Agrupar vendas por mês
    const vendasPorMes = {};
    const meses = [];

    // Inicializar todos os meses
    for (let i = 0; i < 12; i++) {
      const data = new Date(dozesMesesAtras);
      data.setMonth(dozesMesesAtras.getMonth() + i);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      meses.push(chave);
      vendasPorMes[chave] = {
        mes: chave,
        quantidade: 0,
        faturamento: 0,
        lucro: 0,
        numeroVendas: 0,
        descontoProgressivo: 0,
        vendasMultiplosItens: 0
      };
    }

    // Processar vendas
    vendas.forEach(venda => {
      const data = new Date(venda.data);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      if (vendasPorMes[chave]) {
        // Calcular totais da venda
        const totalItens = venda.itens?.reduce((acc, item) => acc + item.quantidade, 0) || 0;
        const faturamentoVenda = parseFloat(venda.total) || 0;
        const lucroVenda = parseFloat(venda.lucro_total) || 0;
        
        vendasPorMes[chave].quantidade += totalItens;
        vendasPorMes[chave].faturamento += faturamentoVenda;
        vendasPorMes[chave].lucro += lucroVenda;
        vendasPorMes[chave].numeroVendas += 1;

        // Calcular desconto progressivo
        if (venda.itens) {
          const descontoTotal = venda.itens.reduce((acc, item) => {
            return acc + (parseFloat(item.desconto_custo_aplicado || 0) * item.quantidade);
          }, 0);
          
          vendasPorMes[chave].descontoProgressivo += descontoTotal;
          
          if (totalItens > 1) {
            vendasPorMes[chave].vendasMultiplosItens += 1;
          }
        }
      }
    });

    const evolucao = meses.map(mes => ({
      ...vendasPorMes[mes],
      faturamento: Math.round(vendasPorMes[mes].faturamento * 100) / 100,
      lucro: Math.round(vendasPorMes[mes].lucro * 100) / 100,
      descontoProgressivo: Math.round(vendasPorMes[mes].descontoProgressivo * 100) / 100,
      ticketMedio: vendasPorMes[mes].numeroVendas > 0 ? 
        Math.round((vendasPorMes[mes].faturamento / vendasPorMes[mes].numeroVendas) * 100) / 100 : 0,
      margemMelhoradaProgressivo: vendasPorMes[mes].faturamento > 0 ?
        Math.round((vendasPorMes[mes].descontoProgressivo / vendasPorMes[mes].faturamento) * 10000) / 100 : 0
    }));

    res.json({
      success: true,
      data: evolucao
    });

  } catch (error) {
    console.error('Erro ao gerar evolução mensal:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * GET /api/estatisticas/insumos-mais-usados - Insumos mais utilizados em produtos
 */
const insumosMaisUsados = async (req, res) => {
  try {
    const produtos = await Produto.findAll({ 
      where: { ativo: true },
      attributes: ['insumos']
    });

    const usoInsumos = {};

    // Contar uso dos insumos
    produtos.forEach(produto => {
      if (produto.insumos && Array.isArray(produto.insumos)) {
        produto.insumos.forEach(insumoUtilizado => {
          const id = insumoUtilizado.id;
          const quantidade = parseFloat(insumoUtilizado.quantidade) || 0;
          const unidadeUsada = insumoUtilizado.unidade; // Usar a unidade específica do produto
          
          if (!usoInsumos[id]) {
            usoInsumos[id] = {
              insumoId: id,
              quantidadeTotalUsada: 0,
              produtosQueUtilizam: 0,
              unidadeReal: unidadeUsada // Guardar a unidade realmente usada
            };
          }
          
          usoInsumos[id].quantidadeTotalUsada += quantidade;
          usoInsumos[id].produtosQueUtilizam += 1;
          
          // Se encontramos uma unidade específica diferente da base, usar ela
          if (unidadeUsada && unidadeUsada !== 'unidade') {
            usoInsumos[id].unidadeReal = unidadeUsada;
          }
        });
      }
    });

    // Buscar dados completos dos insumos
    const idsInsumos = Object.keys(usoInsumos).map(id => parseInt(id));
    const insumos = await Insumo.findAll({
      where: { id: idsInsumos }
    });

    // Combinar dados
    const insumosMaisUsados = Object.values(usoInsumos)
      .map(uso => {
        const insumo = insumos.find(i => i.id === uso.insumoId);
        const custoUnitarioBase = parseFloat(insumo?.custoUnitario || 0);
        const unidadeReal = uso.unidadeReal || insumo?.unidade;
        
        // Calcular valor total com conversão de unidades se necessário
        let valorTotalUtilizado = 0;
        if (custoUnitarioBase > 0) {
          // Se a unidade usada é diferente da unidade base, aplicar conversão
          if (unidadeReal && unidadeReal !== insumo?.unidade && insumo?.conversoes) {
            try {
              // insumo.conversoes já é um objeto (Sequelize parseia automaticamente JSON)
              const conversoes = typeof insumo.conversoes === 'string' ? 
                JSON.parse(insumo.conversoes) : insumo.conversoes;
              const fatorConversao = conversoes[unidadeReal];
              
              if (fatorConversao) {
                // Custo por unidade real = custo base ÷ fator de conversão
                const custoPorUnidadeReal = custoUnitarioBase / fatorConversao;
                valorTotalUtilizado = uso.quantidadeTotalUsada * custoPorUnidadeReal;
              } else {
                // Se não tem conversão, usar valor direto (pode estar errado)
                valorTotalUtilizado = uso.quantidadeTotalUsada * custoUnitarioBase;
              }
            } catch (e) {
              // Se erro ao parsear conversões, usar valor direto
              valorTotalUtilizado = uso.quantidadeTotalUsada * custoUnitarioBase;
            }
          } else {
            // Unidades iguais, usar valor direto
            valorTotalUtilizado = uso.quantidadeTotalUsada * custoUnitarioBase;
          }
        }
        
        return {
          ...uso,
          nome: insumo?.nome || 'Insumo não encontrado',
          variacao: insumo?.variacao,
          categoria: insumo?.categoria,
          custoUnitario: custoUnitarioBase,
          unidade: unidadeReal,
          valorTotalUtilizado: Math.round(valorTotalUtilizado * 100) / 100
        };
      })
      .sort((a, b) => b.quantidadeTotalUsada - a.quantidadeTotalUsada);

    res.json({
      success: true,
      data: insumosMaisUsados
    });

  } catch (error) {
    console.error('Erro ao buscar insumos mais usados:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * GET /api/estatisticas/produtos-rentabilidade - Análise de rentabilidade dos produtos
 */
const analiseRentabilidade = async (req, res) => {
  try {
    const produtos = await Produto.findAll({ where: { ativo: true } });

    const analise = produtos.map(produto => ({
      id: produto.id,
      nome: produto.nome,
      categoria: produto.categoria,
      custoTotal: parseFloat(produto.custoTotal),
      precoVenda: parseFloat(produto.precoVenda),
      lucroUnidade: produto.getLucroPorUnidade(),
      margemReal: produto.getMargemReal(),
      margemConfigurada: parseFloat(produto.margemLucro),
      custoInsumos: parseFloat(produto.custoInsumos),
      custoMaoDeObra: parseFloat(produto.custoMaoDeObra),
      horas: parseFloat(produto.maoDeObraHoras),
      custoPorHora: parseFloat(produto.maoDeObraCustoHora)
    }));

    // Estatísticas gerais
    const stats = {
      produtoMaisLucrativo: analise.reduce((prev, curr) => 
        prev.lucroUnidade > curr.lucroUnidade ? prev : curr
      ),
      produtoMenorMargem: analise.reduce((prev, curr) => 
        prev.margemReal < curr.margemReal ? prev : curr
      ),
      produtoMaiorMargem: analise.reduce((prev, curr) => 
        prev.margemReal > curr.margemReal ? prev : curr
      ),
      margemMedia: analise.reduce((acc, prod) => acc + prod.margemReal, 0) / analise.length,
      lucroMedioPorUnidade: analise.reduce((acc, prod) => acc + prod.lucroUnidade, 0) / analise.length
    };

    res.json({
      success: true,
      data: {
        produtos: analise.sort((a, b) => b.margemReal - a.margemReal),
        estatisticas: {
          ...stats,
          margemMedia: Math.round(stats.margemMedia * 100) / 100,
          lucroMedioPorUnidade: Math.round(stats.lucroMedioPorUnidade * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error('Erro ao gerar análise de rentabilidade:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * GET /api/estatisticas/previsao-estoque - Previsão de esgotamento de estoque
 */
const previsaoEstoque = async (req, res) => {
  try {
    const { dias_analise = 30 } = req.query;
    
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - parseInt(dias_analise));
    
    // Buscar vendas do período
    const vendas = await Venda.findAll({
      where: {
        dataVenda: { [Op.gte]: dataInicio.toISOString().split('T')[0] }
      }
    });

    // Calcular consumo de insumos
    const consumoInsumos = {};
    
    for (const venda of vendas) {
      if (venda.insumosUtilizados && Array.isArray(venda.insumosUtilizados)) {
        venda.insumosUtilizados.forEach(insumo => {
          const id = insumo.id;
          const quantidadeConsumida = parseFloat(insumo.quantidade) * parseInt(venda.quantidade);
          
          if (!consumoInsumos[id]) {
            consumoInsumos[id] = 0;
          }
          
          consumoInsumos[id] += quantidadeConsumida;
        });
      }
    }

    // Buscar insumos atuais
    const insumos = await Insumo.findAll({ where: { ativo: true } });

    const previsoes = insumos.map(insumo => {
      const consumoTotal = consumoInsumos[insumo.id] || 0;
      const consumoDiario = consumoTotal / parseInt(dias_analise);
      const estoqueAtual = parseFloat(insumo.estoqueAtual);
      
      let diasParaEsgotar = null;
      if (consumoDiario > 0) {
        diasParaEsgotar = Math.floor(estoqueAtual / consumoDiario);
      }

      return {
        id: insumo.id,
        nome: insumo.nome,
        variacao: insumo.variacao,
        categoria: insumo.categoria,
        estoqueAtual: estoqueAtual,
        estoqueMinimo: parseFloat(insumo.estoqueMinimo),
        consumoTotal: Math.round(consumoTotal * 100) / 100,
        consumoDiario: Math.round(consumoDiario * 100) / 100,
        diasParaEsgotar,
        situacao: diasParaEsgotar === null ? 'sem_consumo' :
                  diasParaEsgotar <= 7 ? 'critico' :
                  diasParaEsgotar <= 15 ? 'alerta' :
                  diasParaEsgotar <= 30 ? 'atencao' : 'ok'
      };
    });

    // Separar por situação
    const situacoes = {
      critico: previsoes.filter(p => p.situacao === 'critico'),
      alerta: previsoes.filter(p => p.situacao === 'alerta'),
      atencao: previsoes.filter(p => p.situacao === 'atencao'),
      ok: previsoes.filter(p => p.situacao === 'ok'),
      sem_consumo: previsoes.filter(p => p.situacao === 'sem_consumo')
    };

    res.json({
      success: true,
      data: {
        previsoes: previsoes.sort((a, b) => {
          if (a.diasParaEsgotar === null) return 1;
          if (b.diasParaEsgotar === null) return -1;
          return a.diasParaEsgotar - b.diasParaEsgotar;
        }),
        resumo: {
          criticos: situacoes.critico.length,
          alertas: situacoes.alerta.length,
          atencao: situacoes.atencao.length,
          ok: situacoes.ok.length,
          semConsumo: situacoes.sem_consumo.length
        }
      },
      parametros: {
        diasAnalise: parseInt(dias_analise),
        totalVendasPeriodo: vendas.length
      }
    });

  } catch (error) {
    console.error('Erro ao gerar previsão de estoque:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

module.exports = {
  resumoGeral,
  evolucaoVendasMensal,
  insumosMaisUsados,
  analiseRentabilidade,
  previsaoEstoque
};