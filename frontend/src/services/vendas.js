import { get, post, put, del } from './api';

/**
 * Service para gerenciar vendas
 */
export const vendaService = {
  /**
   * Listar todas as vendas
   * @param {object} filtros - Filtros de busca
   * @returns {Promise<Array>} Lista de vendas
   */
  listar: async (filtros = {}) => {
    const params = {};
    
    if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
    if (filtros.dataFim) params.dataFim = filtros.dataFim;
    if (filtros.cliente) params.cliente = filtros.cliente;
    if (filtros.produtoId) params.produtoId = filtros.produtoId;
    if (filtros.ordenar) params.ordenar = filtros.ordenar;
    
    const response = await get('/vendas', params);
    return response.data || [];
  },

  /**
   * Buscar venda por ID
   * @param {number} id - ID da venda
   * @returns {Promise<object>} Dados da venda
   */
  buscarPorId: async (id) => {
    const response = await get(`/vendas/${id}`);
    return response.data;
  },

  /**
   * Registrar nova venda
   * @param {object} dadosVenda - Dados da venda
   * @returns {Promise<object>} Venda registrada
   */
  registrar: async (dadosVenda) => {
    const response = await post('/vendas', dadosVenda);
    return response.data;
  },

  /**
   * Atualizar venda existente
   * @param {number} id - ID da venda
   * @param {object} dadosVenda - Dados atualizados
   * @returns {Promise<object>} Venda atualizada
   */
  atualizar: async (id, dadosVenda) => {
    const response = await put(`/vendas/${id}`, dadosVenda);
    return response.data;
  },

  /**
   * Cancelar/excluir venda
   * @param {number} id - ID da venda
   * @returns {Promise<object>} Resultado do cancelamento
   */
  cancelar: async (id) => {
    const response = await del(`/vendas/${id}`);
    return response;
  },

  /**
   * Gerar relatório de vendas por período
   * @param {string} dataInicio - Data de início (YYYY-MM-DD)
   * @param {string} dataFim - Data de fim (YYYY-MM-DD)
   * @returns {Promise<object>} Relatório completo
   */
  relatoriopPeriodo: async (dataInicio, dataFim) => {
    const response = await get('/vendas/relatorio/periodo', {
      dataInicio,
      dataFim
    });
    return response.data;
  },

  /**
   * Buscar ranking de produtos mais vendidos
   * @param {number} limite - Número máximo de produtos (padrão: 10)
   * @param {string} periodo - Período de análise ('mes', 'ano', 'tudo')
   * @returns {Promise<Array>} Ranking de produtos
   */
  rankingProdutos: async (limite = 10, periodo = 'mes') => {
    const response = await get('/vendas/produtos/ranking', {
      limite,
      periodo
    });
    return response.data || [];
  },

  /**
   * Buscar ranking de clientes que mais compram
   * @param {number} limite - Número máximo de clientes (padrão: 10)
   * @param {string} periodo - Período de análise ('mes', 'ano', 'tudo')
   * @returns {Promise<Array>} Ranking de clientes
   */
  rankingClientes: async (limite = 10, periodo = 'mes') => {
    const response = await get('/vendas/clientes/ranking', {
      limite,
      periodo
    });
    return response.data || [];
  },

  /**
   * Buscar vendas recentes
   * @param {number} limite - Número de vendas (padrão: 5)
   * @returns {Promise<Array>} Lista de vendas recentes
   */
  buscarRecentes: async (limite = 5) => {
    const response = await get('/vendas', {
      ordenar: 'data_desc',
      limite
    });
    return response.data || [];
  }
};

export default vendaService;