@echo off
echo ======================================
echo       🧪 TESTE DA API SOONO 🧪
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

REM Verificar se curl está disponível
curl --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  CURL nao encontrado - usando PowerShell para testes
    set USE_POWERSHELL=1
) else (
    echo ✅ CURL encontrado!
    set USE_POWERSHELL=0
)

echo.
echo 🚀 Iniciando servidor backend...
echo.

REM Iniciar servidor em background
start /B "Backend" cmd /c "cd backend && npm run dev"

REM Aguardar servidor subir
echo ⏳ Aguardando servidor inicializar...
timeout /t 10 /nobreak >nul

echo.
echo 🧪 EXECUTANDO TESTES DA API...
echo ======================================

REM Teste 1: Endpoint de teste
echo.
echo 📌 TESTE 1: Endpoint de teste
if %USE_POWERSHELL%==1 (
    powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/test' -Method Get; Write-Host '✅ API funcionando!' -ForegroundColor Green; Write-Host ($response | ConvertTo-Json) } catch { Write-Host '❌ Erro na API' -ForegroundColor Red }"
) else (
    curl -X GET http://localhost:3001/api/test
)

echo.
echo ======================================

REM Teste 2: Criar insumo
echo.
echo 📌 TESTE 2: Criar insumo
if %USE_POWERSHELL%==1 (
    powershell -Command "try { $body = @{ nome='Linha de algodão'; categoria='Fios'; custoUnitario=2.5; unidade='metro'; estoqueAtual=100; estoqueMinimo=10 } | ConvertTo-Json; $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/insumos' -Method Post -Body $body -ContentType 'application/json'; Write-Host '✅ Insumo criado!' -ForegroundColor Green; Write-Host ($response | ConvertTo-Json) } catch { Write-Host '❌ Erro ao criar insumo' -ForegroundColor Red; Write-Host $_.Exception.Message }"
) else (
    curl -X POST http://localhost:3001/api/insumos -H "Content-Type: application/json" -d "{\"nome\":\"Linha de algodao\",\"categoria\":\"Fios\",\"custoUnitario\":2.5,\"unidade\":\"metro\",\"estoqueAtual\":100,\"estoqueMinimo\":10}"
)

echo.
echo ======================================

REM Teste 3: Listar insumos
echo.
echo 📌 TESTE 3: Listar insumos
if %USE_POWERSHELL%==1 (
    powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/insumos' -Method Get; Write-Host '✅ Insumos listados!' -ForegroundColor Green; Write-Host ($response | ConvertTo-Json -Depth 3) } catch { Write-Host '❌ Erro ao listar insumos' -ForegroundColor Red }"
) else (
    curl -X GET http://localhost:3001/api/insumos
)

echo.
echo ======================================

REM Teste 4: Criar produto
echo.
echo 📌 TESTE 4: Criar produto
if %USE_POWERSHELL%==1 (
    powershell -Command "try { $body = @{ nome='Pulseira Azul'; categoria='Pulseiras'; insumos=@(@{ id=1; quantidade=0.5 }); maoDeObraHoras=1; maoDeObraCustoHora=15; margemLucro=40 } | ConvertTo-Json -Depth 3; $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/produtos' -Method Post -Body $body -ContentType 'application/json'; Write-Host '✅ Produto criado!' -ForegroundColor Green; Write-Host ($response | ConvertTo-Json -Depth 3) } catch { Write-Host '❌ Erro ao criar produto' -ForegroundColor Red; Write-Host $_.Exception.Message }"
) else (
    curl -X POST http://localhost:3001/api/produtos -H "Content-Type: application/json" -d "{\"nome\":\"Pulseira Azul\",\"categoria\":\"Pulseiras\",\"insumos\":[{\"id\":1,\"quantidade\":0.5}],\"maoDeObraHoras\":1,\"maoDeObraCustoHora\":15,\"margemLucro\":40}"
)

echo.
echo ======================================

REM Teste 5: Dashboard resumo
echo.
echo 📌 TESTE 5: Dashboard resumo
if %USE_POWERSHELL%==1 (
    powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/estatisticas/resumo' -Method Get; Write-Host '✅ Dashboard funcionando!' -ForegroundColor Green; Write-Host ($response | ConvertTo-Json -Depth 3) } catch { Write-Host '❌ Erro no dashboard' -ForegroundColor Red }"
) else (
    curl -X GET http://localhost:3001/api/estatisticas/resumo
)

echo.
echo ======================================
echo.
echo ✅ TESTES CONCLUÍDOS!
echo.
echo 📋 PRÓXIMOS PASSOS:
echo    1. Verifique se todos os testes passaram
echo    2. Acesse http://localhost:3001/api/test no navegador
echo    3. Use um cliente REST (Postman, Insomnia) para testes mais detalhados
echo.
echo 🌐 ENDPOINTS DISPONÍVEIS:
echo    • GET    /api/test
echo    • GET    /api/insumos
echo    • POST   /api/insumos  
echo    • GET    /api/produtos
echo    • POST   /api/produtos
echo    • GET    /api/vendas
echo    • POST   /api/vendas
echo    • GET    /api/estatisticas/resumo
echo.
echo ⚠️  Para parar o servidor, feche a janela do backend
echo 📝 Pressione qualquer tecla para sair...
pause >nul