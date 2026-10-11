@echo off
setlocal enabledelayedexpansion

echo ====================================================================
echo   DIGITLAB - COMMIT AND PUSH TO GITHUB (AUTO-TRIGGER CI/CD)
echo ====================================================================
echo.

cd /d "%~dp0"

echo [1/4] Staging changes...
git add .

echo.
set /p COMMIT_MSG="Enter commit message (Press Enter for default: 'Auto-update DigitLab'): "
if "!COMMIT_MSG!"=="" set COMMIT_MSG=Auto-update DigitLab

echo.
echo [2/4] Committing changes with message: "!COMMIT_MSG!"...
git commit -m "!COMMIT_MSG!"

echo.
echo [3/4] Ensuring branch is 'main'...
git branch -M main

echo.
echo [4/4] Pushing to GitHub (origin/main)...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================================
    echo   SUCCESS! Pushed to GitHub (Manish088/DigitalLab)!
    echo ====================================================================
    echo   GitHub Actions will now automatically:
    echo     1. Build and publish Docker images to GitHub Container Registry (GHCR)
    echo     2. Create the production deployment package zip
    echo.
    echo   In Docker Desktop:
    echo     Run 'docker-sync-from-github.bat' anytime to update your containers!
    echo ====================================================================
) else (
    echo.
    echo ====================================================================
    echo   [ERROR] Push failed. Please check your GitHub credentials/login.
    echo ====================================================================
)

echo.
pause
