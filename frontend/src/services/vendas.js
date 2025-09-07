import api from './api';

const vendasService = {
  // Listar vendas
  listar: async (params = {}) => {
    const response = await api.get('/vendas', { params });
    return response.data;
  },

  // Buscar venda por ID
  buscarPorId: async (id) => {
    const response = await api.get(`/vendas/${id}`);
    return response.data;
  },

  // Criar nova venda
  criar: async (dados) => {
    const response = await api.post('/vendas', dados);
    return response.data;
  },

  // Atualizar venda existente
  atualizar: async (id, dados) => {
    const response = await api.put(`/vendas/${id}`, dados);
    return response.data;
  },

  // Simular preços em tempo real
  simularPrecos: async (itens) => {
    const response = await api.post('/vendas/simular-precos', { itens });
    return response.data;
  },

  // Finalizar venda
  finalizar: async (id) => {
    const response = await api.put(`/vendas/${id}/finalizar`);
    return response.data;
  },

  // Cancelar venda
  cancelar: async (id, motivo) => {
    const response = await api.put(`/vendas/${id}/cancelar`, { motivo });
    return response.data;
  },

  // Excluir venda
  excluir: async (id) => {
    const response = await api.delete(`/vendas/${id}`);
    return response.data;
  },

  // Buscar vendas recentes para o dashboard
  buscarRecentes: async (limite = 5) => {
    const response = await api.get('/vendas', { 
      params: { 
        limit: limite, 
        page: 1,
        status: 'finalizada' // Apenas vendas finalizadas para o dashboard
      } 
    });
    return response.data.vendas || [];
  }
};

export default vendasService;
