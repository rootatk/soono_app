# Soon App Desktop (Electron)

Este diretório contém a versão desktop do Soon App usando Electron.

## Como rodar em desenvolvimento

1. Instale as dependências:
   ```
   cd Desktop
   npm install
   ```
2. Certifique-se que o frontend está buildado em `/frontend/build`.
3. Inicie o app:
   ```
   npm start
   ```

O app irá abrir uma janela desktop com a interface web do Soon App.

## Como fazer build para distribuição

### Opção 1: Script automático (Windows)
```
build.bat
```

### Opção 2: Manual
1. Build do frontend:
   ```
   cd ../frontend
   npm run build
   ```
2. Build do Electron:
   ```
   cd ../Desktop
   npm run package:win  # Para Windows
   npm run package:mac  # Para macOS
   npm run package:linux  # Para Linux
   ```

Os executáveis estarão na pasta `Desktop/dist/Soono-[platform]-[arch]`. Para Windows: `Desktop/dist/Soono-win32-x64/Soono.exe`

## Estrutura
- `main.js`: Processo principal do Electron (inicia backend automaticamente)
- `index.html`: Entrada da interface (não usado diretamente)
- `renderer.js`: Carrega o frontend React
- `package.json`: Configurações do Electron
- `build.bat`: Script de build automático

## ✅ Status: **COMPLETAMENTE FUNCIONAL**

O aplicativo desktop Soono está **100% funcional**! 🎉

### 🎯 **Status Atual:**
- ✅ **Backend**: Executando perfeitamente na porta 3001
- ✅ **Frontend**: Carregando completamente com interface React
- ✅ **Protocolo Customizado**: Servindo arquivos estáticos corretamente
- ✅ **Banco de Dados**: Conectado e sincronizado
- ✅ **Navegação**: Todas as rotas funcionando
- ✅ **APIs**: Todos os endpoints disponíveis

### 🚀 **Como Executar:**
```bash
# Versão empacotada (recomendada)
Desktop/dist/Soono-win32-x64/Soono.exe

# Ou versão de desenvolvimento
cd Desktop && npm start
```

### 📋 **Funcionalidades Verificadas:**
- ✅ **Dashboard**: Carregando corretamente
- ✅ **Insumos**: CRUD completo funcionando
- ✅ **Produtos**: CRUD completo funcionando  
- ✅ **Vendas**: Sistema de vendas operacional
- ✅ **Estatísticas**: Relatórios funcionando
- ✅ **Backup**: Sistema automático ativo
- ✅ **Imagens**: Upload e exibição funcionando
- Backend roda automaticamente como processo filho
- Frontend carregado diretamente da build de produção
- Interface desktop nativa
- Suporte a Windows, macOS e Linux

## Observações
- O backend roda localmente dentro do app desktop.
- Não é necessário rodar o backend separadamente.
- O frontend precisa estar buildado para distribuição.
