import axios from 'axios';

// Configuração base do Axios
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptador para requisições
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptador para respostas
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error);
    
    // Tratar erros comuns
    if (error.response) {
      // Servidor respondeu com erro
      const { status, data } = error.response;
      
      switch (status) {
        case 404:
          console.error('🔍 Recurso não encontrado');
          break;
        case 500:
          console.error('🔥 Erro interno do servidor');
          break;
        case 400:
          console.error('⚠️ Dados inválidos:', data);
          break;
        default:
          console.error(`🚨 Erro ${status}:`, data);
      }
    } else if (error.request) {
      // Requisição foi feita mas não houve resposta
      console.error('🌐 Erro de conexão - servidor não respondeu');
    }
    
    return Promise.reject(error);
  }
);

/**
 * Wrapper para chamadas GET
 * @param {string} url - Endpoint da API
 * @param {object} params - Parâmetros da query string
 * @returns {Promise} - Dados da resposta
 */
export const get = async (url, params = {}) => {
  try {
    const response = await api.get(url, { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao buscar dados');
  }
};

/**
 * Wrapper para chamadas POST
 * @param {string} url - Endpoint da API
 * @param {object} data - Dados a serem enviados
 * @returns {Promise} - Dados da resposta
 */
export const post = async (url, data = {}) => {
  try {
    const response = await api.post(url, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao criar dados');
  }
};

/**
 * Wrapper para chamadas PUT
 * @param {string} url - Endpoint da API
 * @param {object} data - Dados a serem atualizados
 * @returns {Promise} - Dados da resposta
 */
export const put = async (url, data = {}) => {
  try {
    const response = await api.put(url, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao atualizar dados');
  }
};

/**
 * Wrapper para chamadas DELETE
 * @param {string} url - Endpoint da API
 * @returns {Promise} - Dados da resposta
 */
export const del = async (url) => {
  try {
    const response = await api.delete(url);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao excluir dados');
  }
};

export default api;