@echo off
echo Building Soono Desktop App...

echo Building frontend...
cd ..\frontend
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    exit /b 1
)

echo Copying backend and frontend to Desktop...
cd ..\Desktop
robocopy ..\backend .\backend /E /NFL /NDL
robocopy ..\frontend\build .\frontend\build /E /NFL /NDL

echo Updating HTML file for Electron...
powershell -Command "Get-ChildItem .\frontend\build\static\js\main.*.js | Select-Object -First 1 | ForEach-Object { $jsFile = $_.Name; (Get-Content .\frontend\build\index.html) -replace 'app://static/js/main\.[a-z0-9]+\.js', \"app://static/js/$jsFile\" | Set-Content .\frontend\build\index.html }"

echo Building Electron app...
call npm run package:win
if %errorlevel% neq 0 (
    echo Electron packaging failed!
    exit /b 1
)

echo Build completed successfully!
echo Check the Desktop/dist folder for the installer.