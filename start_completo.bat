@echo off
echo ===========================================
echo 🧶 SÓONÓ ATELIER - SISTEMA COMPLETO
echo ===========================================
echo.

echo 🔧 Instalando dependências...
echo.

echo 📦 Backend (Node.js)...
cd backend
call npm install
cd..

echo.
echo 📦 Frontend (React)...
cd frontend  
call npm install
cd..

echo.
echo 🚀 Iniciando sistema completo...
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔗 API Backend: http://localhost:3001
echo.

start "Backend - Sóonó" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak

start "Frontend - Sóonó" cmd /k "cd frontend && npm start"

echo.
echo ✅ Sistema iniciado com sucesso!
echo.
echo 💡 DICAS:
echo    - Aguarde alguns segundos para tudo carregar
echo    - O frontend abrirá automaticamente no navegador
echo    - Feche este terminal apenas quando terminar de usar
echo.

pause