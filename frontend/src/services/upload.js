import api from './api'; // Importa a instância do axios diretamente

export const uploadService = {
  uploadImagem: async (formData) => {
    // Usa o `api.post` para poder passar cabeçalhos customizados
    return await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};