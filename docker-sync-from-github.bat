@echo off
setlocal enabledelayedexpansion

echo ====================================================================
echo   DIGITLAB GITHUB AUTO-SYNC & DOCKER DESKTOP UPDATER
echo ====================================================================
echo.

cd /d "%~dp0"

echo [1/3] Pulling latest commits from GitHub repository (origin/main)...
git pull origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Could not pull from GitHub directly (check internet or git credentials).
    echo Proceeding with existing local files...
)

echo.
echo [2/3] Checking Docker Desktop engine...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [NOTICE] Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo Still waiting for Docker Desktop engine to start...
        goto wait_docker
    )
)

echo.
echo [3/3] Rebuilding & Restarting Containers with latest commit changes...
docker compose up -d --build

echo.
echo ====================================================================
echo   SUCCESS! Updated containers running on Docker Desktop:
echo ====================================================================
docker compose ps
echo.
echo   Frontend : http://localhost
echo   Backend  : http://localhost:5000/swagger
echo ====================================================================
echo.
pause
