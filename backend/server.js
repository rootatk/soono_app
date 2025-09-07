const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Importar configuração do banco
const { testConnection, syncDatabase } = require('./config/db');

// Importar modelos para criar as associações
require('./models/Insumo');
require('./models/Produto');
require('./models/Venda');
require('./models/VendaCabecalho');
require('./models/VendaItem');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: '*', // Em produção, restrinja para o seu domínio
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '🎨 API Sóonó funcionando!', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: [
      'GET /api/test - Esta rota de teste',
      'GET /api/insumos - Listar insumos',
      'POST /api/insumos - Criar insumo',
      'GET /api/produtos - Listar produtos', 
      'POST /api/produtos - Criar produto',
      'GET /api/vendas - Listar vendas',
      'POST /api/vendas - Registrar venda',
      'GET /api/estatisticas/resumo - Dashboard resumo'
    ]
  });
});

// Importar e usar as rotas
app.use('/api/insumos', require('./routes/insumos'));
app.use('/api/produtos', require('./routes/produtos'));
app.use('/api/vendas', require('./routes/vendas'));
app.use('/api/estatisticas', require('./routes/estatisticas'));
app.use('/api/upload', require('./routes/upload'));

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rota para servir arquivos estáticos do React (produção)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('❌ Erro na API:', err.stack);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado!'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Inicializar servidor
const startServer = async () => {
  try {
    // Testar conexão com banco
    await testConnection();
    
    // Sincronizar modelos (criar tabelas) - continuar mesmo com erros
    await syncDatabase();
    
    console.log('📊 Banco de dados sincronizado!');
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('🚀 ================================');
      console.log(`🎨 Servidor Sóonó rodando na porta ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`🧪 Teste a API: http://localhost:${PORT}/api/test`);
      console.log('📊 Endpoints disponíveis:');
      console.log('   • GET  /api/insumos');
      console.log('   • POST /api/insumos');
      console.log('   • GET  /api/produtos');
      console.log('   • POST /api/produtos');
      console.log('   • GET  /api/vendas');
      console.log('   • POST /api/vendas');
      console.log('   • GET  /api/estatisticas/resumo');
      console.log('🚀 ================================');
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
};

startServer();