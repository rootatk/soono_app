// src/services/estatisticas.js
import api from './api';

export const estatisticaService = {
  // Buscar métricas gerais do sistema
  metricas: async () => {
    try {
      console.log('Buscando métricas gerais...');
      
      const response = await api.get('/estatisticas/resumo');
      console.log('Resposta das métricas:', response.data);
      
      // 🔧 CORREÇÃO: Extrair dados do formato aninhado
      if (response.data && response.data.success && response.data.data) {
        console.log('✅ Métricas extraídas com sucesso:', response.data.data);
        return response.data.data;
      }
      
      // Fallback para formato direto
      if (response.data && response.data.resumo) {
        console.log('✅ Métricas em formato direto:', response.data);
        return response.data;
      }
      
      // Se chegou até aqui, vamos tentar construir as métricas manualmente
      console.warn('⚠️ Formato de métricas inesperado, construindo manualmente...');
      
      // Buscar dados dos insumos para calcular métricas
      const insumosResponse = await api.get('/insumos');
      let insumos = [];
      
      if (insumosResponse.data && insumosResponse.data.success && Array.isArray(insumosResponse.data.data)) {
        insumos = insumosResponse.data.data;
      } else if (Array.isArray(insumosResponse.data)) {
        insumos = insumosResponse.data;
      }
      
      // Calcular métricas manualmente
      const totalInsumos = insumos.length;
      const valorTotalEstoque = insumos.reduce((total, insumo) => {
        return total + (insumo.quantidadeEstoque * insumo.custoUnitario);
      }, 0);
      const insumosEstoqueBaixo = insumos.filter(insumo => 
        insumo.quantidadeEstoque <= (insumo.estoqueMinimo || 5)
      ).length;
      const totalCategorias = [...new Set(insumos.map(insumo => insumo.categoria))].length;
      
      const metricas = {
        resumo: {
          totalInsumos,
          totalProdutos: 0, // Será implementado na Fase 4B
          totalVendas: 0,   // Será implementado na Fase 4C
          valorTotalEstoque
        },
        alertas: {
          insumosEstoqueBaixo,
          produtosSemEstoque: 0,
          vendasPendentes: 0
        },
        crescimento: {
          vendasMes: 0,
          lucroMes: 0,
          novosProdutos: 0,
          novosInsumos: totalInsumos
        },
        categorias: {
          totalCategorias,
          maisUtilizada: totalCategorias > 0 ? insumos[0]?.categoria : 'Nenhuma'
        }
      };
      
      console.log('✅ Métricas construídas manualmente:', metricas);
      return metricas;
      
    } catch (error) {
      console.error('❌ Erro ao buscar métricas:', error);
      
      // Retorna métricas vazias em caso de erro
      return {
        resumo: {
          totalInsumos: 0,
          totalProdutos: 0,
          totalVendas: 0,
          valorTotalEstoque: 0
        },
        alertas: {
          insumosEstoqueBaixo: 0,
          produtosSemEstoque: 0,
          vendasPendentes: 0
        },
        crescimento: {
          vendasMes: 0,
          lucroMes: 0,
          novosProdutos: 0,
          novosInsumos: 0
        },
        categorias: {
          totalCategorias: 0,
          maisUtilizada: 'Nenhuma'
        }
      };
    }
  },

  // Buscar dados para gráficos
  graficos: async () => {
    try {
      console.log('Buscando dados dos gráficos...');
      
      const response = await api.get('/estatisticas/graficos');
      console.log('Dados dos gráficos:', response.data);
      
      // 🔧 CORREÇÃO: Extrair dados do formato aninhado
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      
      // Fallback para formato direto
      if (response.data && response.data.vendas) {
        return response.data;
      }
      
      // Dados de fallback para gráficos
      console.warn('⚠️ Dados de gráficos indisponíveis, usando fallback...');
      return {
        vendas: [],
        lucros: [],
        estoque: [],
        categorias: []
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar gráficos:', error);
      return {
        vendas: [],
        lucros: [],
        estoque: [],
        categorias: []
      };
    }
  },

  // Relatório de vendas por período
  relatorioVendas: async (periodo = 'mes') => {
    try {
      console.log(`Buscando relatório de vendas: ${periodo}`);
      
      const response = await api.get(`/estatisticas/vendas/${periodo}`);
      console.log('Relatório de vendas:', response.data);
      
      // 🔧 CORREÇÃO: Extrair dados do formato aninhado
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      
      // Fallback para formato direto
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Erro ao buscar relatório de vendas:', error);
      return [];
    }
  },

  // Análise de lucro por produto
  analiseLucro: async () => {
    try {
      console.log('Buscando análise de lucro...');
      
      const response = await api.get('/estatisticas/lucro');
      console.log('Análise de lucro:', response.data);
      
      // 🔧 CORREÇÃO: Extrair dados do formato aninhado
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      
      // Fallback para formato direto
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Erro ao buscar análise de lucro:', error);
      return [];
    }
  }
};