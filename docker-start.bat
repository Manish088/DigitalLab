@echo off
setlocal enabledelayedexpansion

echo ====================================================================
echo   DIGITLAB DOCKER DESKTOP LOCAL RUNNER
echo ====================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Docker Desktop status...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [NOTICE] Docker Desktop is not running yet.
    echo Attempting to start Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker engine to become ready (approx 20-30 seconds)...
    
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo Still waiting for Docker Desktop engine to start...
        goto wait_docker
    )
)

echo [OK] Docker Desktop is running!
echo.

echo [2/3] Building and starting Backend and Frontend containers...
docker compose up -d --build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Docker compose failed to start.
    echo Please check the error messages above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Containers status:
docker compose ps

echo.
echo ====================================================================
echo   SUCCESS! DigitLab is running in Docker Desktop!
echo ====================================================================
echo   Frontend (UI)       : http://localhost  (or http://localhost:4200)
echo   Backend API Swagger : http://localhost:5000/swagger
echo   Backend Direct Port : http://localhost:5000/api
echo ====================================================================
echo.
echo Opening browser...
start http://localhost

pause
