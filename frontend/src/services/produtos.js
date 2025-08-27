import { get, post, put, del } from './api';

/**
 * Service para gerenciar produtos
 */
export const produtoService = {
  /**
   * Listar todos os produtos
   * @param {object} filtros - Filtros de busca
   * @returns {Promise<Array>} Lista de produtos
   */
  listar: async (filtros = {}) => {
    const params = {};
    
    if (filtros.busca) params.busca = filtros.busca;
    if (filtros.categoria) params.categoria = filtros.categoria;
    if (filtros.ordenar) params.ordenar = filtros.ordenar;
    
    const response = await get('/produtos', params);
    return response.data || [];
  },

  /**
   * Buscar produto por ID (com detalhes dos insumos)
   * @param {number} id - ID do produto
   * @returns {Promise<object>} Dados completos do produto
   */
  buscarPorId: async (id) => {
    const response = await get(`/produtos/${id}`);
    return response.data;
  },

  /**
   * Criar novo produto
   * @param {object} dadosProduto - Dados do produto
   * @returns {Promise<object>} Produto criado
   */
  criar: async (dadosProduto) => {
    const response = await post('/produtos', dadosProduto);
    return response.data;
  },

  /**
   * Atualizar produto existente
   * @param {number} id - ID do produto
   * @param {object} dadosProduto - Dados atualizados
   * @returns {Promise<object>} Produto atualizado
   */
  atualizar: async (id, dadosProduto) => {
    const response = await put(`/produtos/${id}`, dadosProduto);
    return response.data;
  },

  /**
   * Excluir produto
   * @param {number} id - ID do produto
   * @returns {Promise<object>} Resultado da exclusão
   */
  excluir: async (id) => {
    const response = await del(`/produtos/${id}`);
    return response;
  },

  /**
   * Simular diferentes margens de lucro para um produto
   * @param {number} id - ID do produto
   * @param {Array} margens - Array de margens para simular (ex: [20, 30, 40])
   * @returns {Promise<Array>} Simulações de preço
   */
  simularPrecos: async (id, margens) => {
    const response = await post(`/produtos/${id}/simular-precos`, { margens });
    return response.data;
  },

  /**
   * Recalcular produto com preços atuais dos insumos
   * @param {number} id - ID do produto
   * @returns {Promise<object>} Produto com valores recalculados
   */
  recalcular: async (id) => {
    const response = await put(`/produtos/${id}/recalcular`);
    return response.data;
  },

  /**
   * Listar todas as categorias disponíveis
   * @returns {Promise<Array>} Lista de categorias
   */
  listarCategorias: async () => {
    const response = await get('/produtos/categorias');
    return response.data || [];
  },

  /**
   * Buscar produtos mais lucrativos
   * @param {number} limite - Número máximo de produtos (padrão: 10)
   * @returns {Promise<Array>} Lista dos produtos mais lucrativos
   */
  buscarMaisLucrativos: async (limite = 10) => {
    const response = await get('/produtos', { 
      ordenar: 'lucratividade',
      limite 
    });
    return response.data || [];
  }
};

export default produtoService;