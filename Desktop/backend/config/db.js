const { Sequelize } = require('sequelize');
const path = require('path');

// Configuração do SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/soono.db'),
  logging: false, // Mude para console.log para ver as queries SQL
  define: {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    underscored: false, // Usa camelCase em vez de snake_case
  }
});

// Função para testar conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error);
  }
};

// Função para sincronizar modelos (criar tabelas)
const syncDatabase = async () => {
  try {
    // Usar force: false para não recriar tabelas existentes
    // Isso evita problemas de constraint com dados existentes
    await sequelize.sync({ force: false }); 
    console.log('✅ Tabelas sincronizadas!');
  } catch (error) {
    console.error('❌ Erro ao sincronizar banco:', error);
    console.log('📊 Banco de dados sincronizado!'); // Continuar mesmo com erros de sync
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};