/**
 * Formatar valor para moeda brasileira (R$)
 * @param {number} valor - Valor numérico a ser formatado
 * @returns {string} - Valor formatado em R$
 */
export const formatarMoeda = (valor) => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
};

/**
 * Converter string monetária para número
 * @param {string} valorString - Valor em string (ex: "R$ 123,45")
 * @returns {number} - Valor numérico
 */
export const converterMoedaParaNumero = (valorString) => {
  if (!valorString) return 0;
  
  // Remove R$, espaços e converte vírgula para ponto
  const numeroLimpo = valorString
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  return parseFloat(numeroLimpo) || 0;
};

/**
 * Formatar porcentagem
 * @param {number} valor - Valor da porcentagem
 * @returns {string} - Porcentagem formatada
 */
export const formatarPorcentagem = (valor) => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return '0%';
  }
  
  return `${valor.toFixed(1)}%`;
};

/**
 * Formatar número com separadores de milhares
 * @param {number} numero - Número a ser formatado
 * @returns {string} - Número formatado
 */
export const formatarNumero = (numero) => {
  if (numero === null || numero === undefined || isNaN(numero)) {
    return '0';
  }
  
  return new Intl.NumberFormat('pt-BR').format(numero);
};