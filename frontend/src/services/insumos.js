// src/services/insumos.js
import api from './api';

export const insumoService = {
  // Listar todos os insumos com filtros opcionais
  listar: async (filtros = {}) => {
    try {
      console.log('Fazendo requisição para: /insumos');
      
      const params = new URLSearchParams();
      
      if (filtros.nome) params.append('nome', filtros.nome);
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.variacao) params.append('variacao', filtros.variacao);
      if (filtros.estoque_baixo) params.append('estoque_baixo', 'true');
      
      const url = params.toString() ? `/insumos?${params.toString()}` : '/insumos';
      const response = await api.get(url);
      
      console.log('Resposta completa da API:', response);
      console.log('Dados recebidos:', response.data);
      console.log('Tipo dos dados:', typeof response.data);
      
      // 🔧 CORREÇÃO: Extrair os dados do formato aninhado do backend
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        console.log('✅ Dados extraídos com sucesso:', response.data.data);
        return response.data.data; // Retorna apenas o array de insumos
      }
      
      // Fallback para formato direto (caso o backend mude)
      if (Array.isArray(response.data)) {
        console.log('✅ Dados em formato direto:', response.data);
        return response.data;
      }
      
      // Se chegou até aqui, formato inesperado
      console.error('❌ Formato de resposta inesperado:', response.data);
      throw new Error('Formato de resposta da API inválido');
      
    } catch (error) {
      console.error('❌ Erro ao listar insumos:', error);
      throw error;
    }
  },

  // Buscar insumo por ID
  buscarPorId: async (id) => {
    try {
      console.log(`Buscando insumo ID: ${id}`);
      
      const response = await api.get(`/insumos/${id}`);
      console.log('Insumo encontrado:', response.data);
      
      // 🔧 CORREÇÃO: Extrair dados do formato aninhado
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      
      // Fallback para formato direto
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao buscar insumo:', error);
      throw error;
    }
  },

  // Criar novo insumo
  criar: async (dadosInsumo) => {
    try {
      console.log('Criando insumo:', dadosInsumo);
      
      // Validação básica
      if (!dadosInsumo.nome || !dadosInsumo.categoria) {
        throw new Error('Nome e categoria são obrigatórios');
      }

      if (dadosInsumo.custoUnitario <= 0) {
        throw new Error('Custo unitário deve ser maior que zero');
      }

      if (dadosInsumo.quantidadeEstoque < 0) {
        throw new Error('Quantidade em estoque não pode ser negativa');
      }

      const response = await api.post('/insumos', dadosInsumo);
      console.log('✅ Insumo criado:', response.data);
      
      // 🔧 CORREÇÃO: Extrair dados do formato aninhado
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao criar insumo:', error);
      throw error;
    }
  },

  // Atualizar insumo existente
  atualizar: async (id, dadosInsumo) => {
    try {
      console.log(`Atualizando insumo ${id}:`, dadosInsumo);
      
      // Validação básica
      if (!dadosInsumo.nome || !dadosInsumo.categoria) {
        throw new Error('Nome e categoria são obrigatórios');
      }

      if (dadosInsumo.custoUnitario <= 0) {
        throw new Error('Custo unitário deve ser maior que zero');
      }

      const response = await api.put(`/insumos/${id}`, dadosInsumo);
      console.log('✅ Insumo atualizado:', response.data);
      
      // 🔧 CORREÇÃO: Extrair dados do formato aninhado
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao atualizar insumo:', error);
      throw error;
    }
  },

  // Excluir insumo
  excluir: async (id) => {
    try {
      console.log(`Excluindo insumo ${id}`);
      
      const response = await api.delete(`/insumos/${id}`);
      console.log('✅ Insumo excluído:', response.data);
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao excluir insumo:', error);
      throw error;
    }
  },

  // Movimentar estoque (entrada ou saída)
  movimentarEstoque: async (id, dadosMovimentacao) => {
    try {
      console.log(`Movimentando estoque do insumo ${id}:`, dadosMovimentacao);
      
      // Validação
      if (!dadosMovimentacao.tipo || !['entrada', 'saida'].includes(dadosMovimentacao.tipo)) {
        throw new Error('Tipo de movimentação deve ser "entrada" ou "saida"');
      }

      if (!dadosMovimentacao.quantidade || dadosMovimentacao.quantidade <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      const response = await api.put(`/insumos/${id}/estoque`, dadosMovimentacao);
      console.log('✅ Estoque movimentado:', response.data);
      
      // 🔧 CORREÇÃO: Extrair dados do formato aninhado
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao movimentar estoque:', error);
      throw error;
    }
  },

  // Listar categorias disponíveis
  listarCategorias: async () => {
    try {
      console.log('Buscando categorias...');
      
      const response = await api.get('/insumos/categorias');
      console.log('Categorias encontradas:', response.data);
      
      // 🔧 CORREÇÃO: Extrair dados do formato aninhado
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      return []; // Retorna array vazio em caso de erro
    }
  },

  // Buscar insumos com estoque baixo (para Dashboard)
  buscarEstoqueBaixo: async () => {
    try {
      console.log('Buscando insumos com estoque baixo...');
      
      const response = await api.get('/insumos?estoque_baixo=true');
      console.log('Insumos com estoque baixo:', response.data);
      
      // 🔧 CORREÇÃO: Extrair dados do formato aninhado
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Erro ao buscar estoque baixo:', error);
      return []; // Retorna array vazio em caso de erro
    }
  },

  // Buscar estatísticas gerais (para Dashboard)
  buscarEstatisticas: async () => {
    try {
      console.log('Buscando estatísticas dos insumos...');
      
      const response = await api.get('/insumos');
      console.log('Resposta completa para estatísticas:', response.data);
      
      // 🔧 CORREÇÃO: Extrair dados do formato aninhado
      if (response.data && response.data.success) {
        const dados = response.data.data || [];
        const stats = response.data.stats || {};
        
        // Se o backend já manda stats, usa elas
        if (stats.totalInsumos !== undefined) {
          return {
            totalInsumos: stats.totalInsumos,
            valorTotalEstoque: stats.valorTotalEstoque || 0,
            insumosEstoqueBaixo: stats.insumosEstoqueBaixo || 0,
            categorias: stats.totalCategorias || 0
          };
        }
        
        // Se não, calcula no frontend
        const totalInsumos = dados.length;
        const valorTotalEstoque = dados.reduce((total, insumo) => {
          return total + (insumo.quantidadeEstoque * insumo.custoUnitario);
        }, 0);
        const insumosEstoqueBaixo = dados.filter(insumo => 
          insumo.quantidadeEstoque <= (insumo.estoqueMinimo || 5)
        ).length;
        const categorias = [...new Set(dados.map(insumo => insumo.categoria))].length;
        
        return {
          totalInsumos,
          valorTotalEstoque,
          insumosEstoqueBaixo,
          categorias
        };
      }
      
      return {
        totalInsumos: 0,
        valorTotalEstoque: 0,
        insumosEstoqueBaixo: 0,
        categorias: 0
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      return {
        totalInsumos: 0,
        valorTotalEstoque: 0,
        insumosEstoqueBaixo: 0,
        categorias: 0
      };
    }
  }
};