/**
 * Utilitários para cálculos de custos, preços e lucros
 * Sistema Sóonó - Macramê & Crochê
 */

/**
 * Calcula o custo total dos insumos utilizados em um produto
 * @param {Array} insumosUtilizados - Array com {id, quantidade, custoUnitario, unidade, conversoes}
 * @returns {Number} - Custo total dos insumos
 */
const calcularCustoInsumos = (insumosUtilizados) => {
  if (!Array.isArray(insumosUtilizados) || insumosUtilizados.length === 0) {
    return 0;
  }

  return insumosUtilizados.reduce((total, insumo) => {
    const quantidade = parseFloat(insumo.quantidade) || 0;
    const custoUnitario = parseFloat(insumo.custoUnitario) || 0;
    const unidadePrincipal = insumo.unidadePrincipal;
    const unidadeUtilizada = insumo.unidadeUtilizada;
    const conversoes = insumo.conversoes;

    if (unidadeUtilizada === unidadePrincipal) {
      return total + (quantidade * custoUnitario);
    }

    if (conversoes && conversoes[unidadeUtilizada]) {
      const fatorConversao = parseFloat(conversoes[unidadeUtilizada]);
      if (fatorConversao > 0) {
        return total + (quantidade / fatorConversao * custoUnitario);
      }
    }

    // Fallback se a conversão não for encontrada ou for inválida
    return total;
  }, 0);
};

/**
 * Calcula o custo da mão de obra
 * @param {Number} horas - Horas trabalhadas
 * @param {Number} custoPorHora - Valor por hora
 * @returns {Number} - Custo total da mão de obra
 */
const calcularCustoMaoDeObra = (horas, custoPorHora) => {
  const horasNum = parseFloat(horas) || 0;
  const custoHoraNum = parseFloat(custoPorHora) || 0;
  return horasNum * custoHoraNum;
};

/**
 * Calcula o preço de venda baseado no custo total e margem de lucro
 * @param {Number} custoTotal - Custo total do produto
 * @param {Number} margemLucro - Margem de lucro em percentual (ex: 30 = 30%)
 * @returns {Number} - Preço de venda sugerido
 */
const calcularPrecoVenda = (custoTotal, margemLucro) => {
  const custoNum = parseFloat(custoTotal) || 0;
  const margemNum = parseFloat(margemLucro) || 0;
  
  if (custoNum === 0) return 0;
  if (margemNum >= 100) return custoNum * 10; // Evita divisão por zero ou números negativos
  
  // Fórmula correta para margem: Preço = Custo / (1 - margem/100)
  return custoNum / (1 - margemNum / 100);
};

/**
 * Calcula o lucro por unidade
 * @param {Number} precoVenda - Preço de venda
 * @param {Number} custoTotal - Custo total
 * @returns {Number} - Lucro por unidade
 */
const calcularLucroPorUnidade = (precoVenda, custoTotal) => {
  const precoNum = parseFloat(precoVenda) || 0;
  const custoNum = parseFloat(custoTotal) || 0;
  return precoNum - custoNum;
};

/**
 * Calcula a margem de lucro real em percentual
 * @param {Number} precoVenda - Preço de venda
 * @param {Number} custoTotal - Custo total
 * @returns {Number} - Margem de lucro em % (ex: 30.5)
 * Formula: ((Preço de venda - Custo Total) / Preço de venda) * 100
 */
const calcularMargemReal = (precoVenda, custoTotal) => {
  const precoNum = parseFloat(precoVenda) || 0;
  const custoNum = parseFloat(custoTotal) || 0;
  
  if (precoNum === 0) return 0;
  
  const lucro = calcularLucroPorUnidade(precoVenda, custoTotal);
  return (lucro / precoNum) * 100;
};

/**
 * Calcula todos os valores de um produto de uma vez
 * @param {Object} dadosProduto - {insumosUtilizados, maoDeObraHoras, custoPorHora, margemLucro, custosAdicionais}
 * @returns {Object} - Objeto com todos os cálculos
 */
const calcularCustosProduto = (dadosProduto) => {
  const {
    insumosUtilizados = [],
    maoDeObraHoras = 0,
    custoPorHora = 15,
    margemLucro = 30,
    custosAdicionais = {}
  } = dadosProduto;

  const custoInsumos = calcularCustoInsumos(insumosUtilizados);
  const custoMaoDeObra = calcularCustoMaoDeObra(maoDeObraHoras, custoPorHora);
  
  const custoAdicionalTotal = Object.values(custosAdicionais || {}).reduce(
    (total, custo) => total + (parseFloat(custo) || 0), 0
  );

  const custoTotal = custoInsumos + custoMaoDeObra + custoAdicionalTotal;
  const precoVenda = calcularPrecoVenda(custoTotal, margemLucro);
  const lucroPorUnidade = calcularLucroPorUnidade(precoVenda, custoTotal);
  const margemReal = calcularMargemReal(precoVenda, custoTotal);

  return {
    custoInsumos: roundToTwo(custoInsumos),
    custoMaoDeObra: roundToTwo(custoMaoDeObra),
    custoAdicionalTotal: roundToTwo(custoAdicionalTotal),
    custoTotal: roundToTwo(custoTotal),
    precoVenda: roundToTwo(precoVenda),
    lucroPorUnidade: roundToTwo(lucroPorUnidade),
    margemReal: roundToTwo(margemReal)
  };
};

/**
 * Simula diferentes margens de lucro para um produto
 * @param {Number} custoTotal - Custo total do produto
 * @param {Array} margens - Array com margens a testar (ex: [20, 30, 40, 50])
 * @returns {Array} - Array com simulações
 */
const simularMargens = (custoTotal, margens = [20, 30, 40, 50]) => {
  const custoNum = parseFloat(custoTotal) || 0;
  
  return margens.map(margem => {
    const precoVenda = calcularPrecoVenda(custoNum, margem);
    const lucro = calcularLucroPorUnidade(precoVenda, custoNum);
    
    return {
      margem: margem,
      precoVenda: roundToTwo(precoVenda),
      lucro: roundToTwo(lucro)
    };
  });
};

/**
 * Calcula o valor total em estoque de insumos
 * @param {Array} insumos - Array de insumos com {estoqueAtual, custoUnitario}
 * @returns {Number} - Valor total em estoque
 */
const calcularValorTotalEstoque = (insumos) => {
  if (!Array.isArray(insumos)) return 0;
  
  return insumos.reduce((total, insumo) => {
    const estoque = parseFloat(insumo.estoqueAtual) || 0;
    const custo = parseFloat(insumo.custoUnitario) || 0;
    return total + (estoque * custo);
  }, 0);
};

/**
 * Identifica insumos com estoque baixo
 * @param {Array} insumos - Array de insumos
 * @returns {Array} - Insumos com estoque <= estoqueMinimo
 */
const identificarEstoqueBaixo = (insumos) => {
  if (!Array.isArray(insumos)) return [];
  
  return insumos.filter(insumo => {
    const atual = parseFloat(insumo.estoqueAtual) || 0;
    const minimo = parseFloat(insumo.estoqueMinimo) || 0;
    return atual <= minimo;
  });
};

/**
 * Arredonda para 2 casas decimais
 * @param {Number} num - Número a arredondar
 * @returns {Number} - Número arredondado
 */
const roundToTwo = (num) => {
  return Math.round((parseFloat(num) || 0) * 100) / 100;
};

/**
 * Formata valor para moeda brasileira (apenas números)
 * @param {Number} valor - Valor numérico
 * @returns {Number} - Valor formatado com 2 decimais
 */
const formatarMoeda = (valor) => {
  return roundToTwo(parseFloat(valor) || 0);
};

/**
 * Simula preço de venda baseado em uma nova margem
 * @param {Number} custoTotal - Custo total do produto
 * @param {Number} novaMargemPercentual - Nova margem desejada (%)
 * @returns {Object} - {precoVenda, lucro, margemReal}
 */
const simularPrecoComMargem = (custoTotal, novaMargemPercentual) => {
  const custoNum = parseFloat(custoTotal) || 0;
  const margemNum = parseFloat(novaMargemPercentual) || 0;
  
  if (custoNum === 0) {
    return {
      precoVenda: 0,
      lucro: 0,
      margemReal: 0
    };
  }
  
  if (margemNum >= 100) {
    return {
      precoVenda: 0,
      lucro: 0,
      margemReal: 0,
      erro: 'Margem não pode ser 100% ou maior'
    };
  }
  
  const precoVenda = custoNum / (1 - margemNum / 100);
  const lucro = precoVenda - custoNum;
  const margemReal = (lucro / precoVenda) * 100;
  
  return {
    precoVenda: roundToTwo(precoVenda),
    lucro: roundToTwo(lucro),
    margemReal: roundToTwo(margemReal)
  };
};

/**
 * Calcula desconto combo baseado na quantidade de produtos
 * @param {Array} itens - Array de itens da venda [{quantidade, eh_brinde}]
 * @returns {Object} - {quantidadeParaDesconto, percentualDesconto, aplicaDesconto}
 */
const calcularDescontoCombo = (itens) => {
  if (!Array.isArray(itens) || itens.length === 0) {
    return {
      quantidadeParaDesconto: 0,
      percentualDesconto: 0,
      aplicaDesconto: false
    };
  }
  
  // Conta produtos para desconto (brindes contam como 1 independente da quantidade)
  const quantidadeParaDesconto = itens.reduce((total, item) => {
    if (item.eh_brinde) {
      return total + 1; // Brinde sempre conta como 1
    }
    return total + (parseInt(item.quantidade) || 0);
  }, 0);
  
  let percentualDesconto = 0;
  let aplicaDesconto = false;
  
  if (quantidadeParaDesconto >= 3) {
    percentualDesconto = 10;
    aplicaDesconto = true;
  } else if (quantidadeParaDesconto === 2) {
    percentualDesconto = 5;
    aplicaDesconto = true;
  }
  
  return {
    quantidadeParaDesconto,
    percentualDesconto,
    aplicaDesconto
  };
};

/**
 * Aplica desconto combo no valor total
 * @param {Number} subtotal - Valor subtotal
 * @param {Number} percentualDesconto - Percentual de desconto
 * @returns {Object} - {valorDesconto, total}
 */
const aplicarDescontoCombo = (subtotal, percentualDesconto) => {
  const subtotalNum = parseFloat(subtotal) || 0;
  const percentualNum = parseFloat(percentualDesconto) || 0;
  
  const valorDesconto = (subtotalNum * percentualNum) / 100;
  const total = subtotalNum - valorDesconto;
  
  return {
    valorDesconto: roundToTwo(valorDesconto),
    total: roundToTwo(total)
  };
};

/**
 * Calcula totais de uma venda com itens e descontos
 * @param {Array} itens - Array de itens [{quantidade, preco_unitario_final, eh_brinde, custo_total}]
 * @returns {Object} - Cálculos completos da venda
 */
const calcularTotaisVenda = (itens) => {
  if (!Array.isArray(itens) || itens.length === 0) {
    return {
      subtotal: 0,
      descontoCombo: {
        quantidadeParaDesconto: 0,
        percentualDesconto: 0,
        aplicaDesconto: false,
        valorDesconto: 0
      },
      total: 0,
      custoTotal: 0,
      lucroTotal: 0,
      margemRealTotal: 0
    };
  }
  
  // Calcula subtotal e custo total
  const subtotal = itens.reduce((total, item) => {
    const quantidade = parseInt(item.quantidade) || 0;
    const precoUnitario = parseFloat(item.preco_unitario_final) || 0;
    return total + (quantidade * precoUnitario);
  }, 0);
  
  const custoTotal = itens.reduce((total, item) => {
    return total + (parseFloat(item.custo_total) || 0);
  }, 0);
  
  // Calcula desconto combo
  const descontoCombo = calcularDescontoCombo(itens);
  let valorDesconto = 0;
  let total = subtotal;
  
  if (descontoCombo.aplicaDesconto) {
    const resultadoDesconto = aplicarDescontoCombo(subtotal, descontoCombo.percentualDesconto);
    valorDesconto = resultadoDesconto.valorDesconto;
    total = resultadoDesconto.total;
  }
  
  const lucroTotal = total - custoTotal;
  const margemRealTotal = total > 0 ? (lucroTotal / total) * 100 : 0;
  
  return {
    subtotal: roundToTwo(subtotal),
    descontoCombo: {
      ...descontoCombo,
      valorDesconto: roundToTwo(valorDesconto)
    },
    total: roundToTwo(total),
    custoTotal: roundToTwo(custoTotal),
    lucroTotal: roundToTwo(lucroTotal),
    margemRealTotal: roundToTwo(margemRealTotal)
  };
};

module.exports = {
  calcularCustoInsumos,
  calcularCustoMaoDeObra,
  calcularPrecoVenda,
  calcularLucroPorUnidade,
  calcularMargemReal,
  calcularCustosProduto,
  simularMargens,
  calcularValorTotalEstoque,
  identificarEstoqueBaixo,
  formatarMoeda,
  roundToTwo,
  // Novas funções para vendas e simulação
  simularPrecoComMargem,
  calcularDescontoCombo,
  aplicarDescontoCombo,
  calcularTotaisVenda
};