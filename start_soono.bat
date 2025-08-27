@echo off
echo ======================================
echo       🎨 SISTEMA SOONO ATELIE 🎨
echo ======================================
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js nao encontrado!
    echo 📥 Por favor, instale o Node.js em: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js encontrado!
echo.

REM Instalar dependências do backend se não existir node_modules
if not exist "backend\node_modules" (
    echo 📦 Instalando dependências do backend...
    cd backend
    call npm install
    cd..
    echo.
)

REM Instalar dependências do frontend se não existir node_modules
if not exist "frontend\node_modules" (
    echo 📦 Instalando dependências do frontend...
    cd frontend
    call npm install
    cd..
    echo.
)

REM Criar pasta do banco se não existir
if not exist "backend\database" (
    mkdir "backend\database"
    echo 📁 Pasta database criada!
)

echo 🚀 Iniciando servidores...
echo.

REM Abrir nova janela para o backend
start "🔧 Backend Soono" cmd /k "cd backend && echo 🔧 BACKEND RODANDO && npm run dev"

REM Aguardar 3 segundos
timeout /t 3 /nobreak >nul

REM Abrir nova janela para o frontend
start "🎨 Frontend Soono" cmd /k "cd frontend && echo 🎨 FRONTEND RODANDO && npm start"

REM Aguardar 5 segundos e abrir o browser
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo ✅ Sistema iniciado com sucesso!
echo 🔧 Backend: http://localhost:3001
echo 🎨 Frontend: http://localhost:3000
echo.
echo ⚠️  Para parar o sistema, feche as janelas dos servidores
echo 📝 Pressione qualquer tecla para sair...
pause >nul