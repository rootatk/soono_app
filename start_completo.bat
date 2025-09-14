@echo off
REM Set UTF-8 encoding for proper character display
chcp 65001 >nul 2>&1

REM Set console font and size for better emoji/character support
powershell -command "& {[Console]::OutputEncoding = [System.Text.Encoding]::UTF8}" 2>nul

REM Set window title and size
title Sóonó Atelier - Sistema Completo
mode con: cols=100 lines=35

echo ===========================================
echo 🧶 SÓONÓ ATELIER - SISTEMA COMPLETO
echo ===========================================
echo.

REM Check if node_modules exist
set BACKEND_MODULES_EXIST=0
set FRONTEND_MODULES_EXIST=0

if exist "backend\node_modules" set BACKEND_MODULES_EXIST=1
if exist "frontend\node_modules" set FRONTEND_MODULES_EXIST=1

REM Only install if node_modules don't exist
if %BACKEND_MODULES_EXIST%==0 (
    echo 📦 Instalando dependências do Backend...
    cd backend
    call npm install
    cd..
) else (
    echo ✅ Dependências do Backend já instaladas
)

if %FRONTEND_MODULES_EXIST%==0 (
    echo 📦 Instalando dependências do Frontend...
    cd frontend
    call npm install
    cd..
) else (
    echo ✅ Dependências do Frontend já instaladas
)

echo.
echo 🚀 Iniciando sistema completo...
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔗 API Backend: http://localhost:3001
echo.

start "Backend - Sóonó" cmd /k "chcp 65001 >nul 2>&1 && cd backend && npm start"
timeout /t 3 /nobreak

start "Frontend - Sóonó" cmd /k "chcp 65001 >nul 2>&1 && cd frontend && npm start"

echo.
echo ✅ Sistema iniciado com sucesso!
echo.
echo 💡 DICAS:
echo    - Aguarde alguns segundos para tudo carregar
echo    - O frontend abrirá automaticamente no navegador
echo    - Para forçar reinstalação de dependências, delete as pastas node_modules
echo.

pause