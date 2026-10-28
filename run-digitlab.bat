@echo off
title DigitLab Launcher
color 0A

echo ====================================================================
echo                   STARTING DIGITLAB LIMS
echo ====================================================================
echo.

set "LAB_DIR=D:\Antigravity\Lab"

echo [1/3] Starting Backend API (ASP.NET Core)...
start "DigitLab Backend API" cmd /k "cd /d %LAB_DIR%\backend && dotnet run --project src/Lab.Api"

echo Waiting 5 seconds for Backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [2/3] Starting Frontend SPA (Angular)...
start "DigitLab Frontend SPA" cmd /k "cd /d %LAB_DIR%\frontend && npm start"

echo Waiting 8 seconds for Frontend to serve...
timeout /t 8 /nobreak >nul

echo.
echo [3/3] Opening DigitLab in Browser...
start http://localhost:4200

echo.
echo ====================================================================
echo   DigitLab is running!
echo   Frontend : http://localhost:4200
echo   Backend  : http://localhost:5000/swagger
echo ====================================================================
echo.
pause
