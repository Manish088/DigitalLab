@echo off
setlocal enabledelayedexpansion

echo ====================================================================
echo   DIGITLAB PRODUCTION PUBLISH BUILDER (Frontend + Backend + DB)
echo ====================================================================
echo.

set "ROOT_DIR=%~dp0"
set "OUTPUT_DIR=%ROOT_DIR%dist_production"

if exist "%OUTPUT_DIR%" (
    echo [1/5] Cleaning previous output directory...
    rmdir /s /q "%OUTPUT_DIR%"
)
mkdir "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%\wwwroot"
mkdir "%OUTPUT_DIR%\database"

echo [2/5] Building Angular Frontend (Production)...
cd /d "%ROOT_DIR%frontend"
call npm run build -- --configuration production
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo [3/5] Publishing ASP.NET Core Backend API (.NET Release)...
cd /d "%ROOT_DIR%"
call dotnet publish backend/src/Lab.Api/Lab.Api.csproj -c Release -o "%OUTPUT_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend publish failed!
    pause
    exit /b %ERRORLEVEL%
)

echo [4/5] Merging Frontend assets into wwwroot and copying database schema...
xcopy /s /e /y "%ROOT_DIR%frontend\dist\frontend\browser\*" "%OUTPUT_DIR%\wwwroot\"
copy /y "%ROOT_DIR%database\schema.sql" "%OUTPUT_DIR%\database\schema.sql"

echo [5/5] Creating single production zip package...
cd /d "%ROOT_DIR%"
powershell -NoProfile -Command "Compress-Archive -Path '%OUTPUT_DIR%\*' -DestinationPath '%ROOT_DIR%digitlab_production_package.zip' -Force"

echo.
echo ====================================================================
echo   SUCCESS! Production Build Completed Successfully!
echo ====================================================================
echo.
echo Your ready-to-deploy files are in:
echo   Folder: %OUTPUT_DIR%
echo   Zip File: %ROOT_DIR%digitlab_production_package.zip
echo.
echo This zip contains:
echo   1. Backend ASP.NET Core API binaries and web.config
echo   2. Frontend Angular SPA inside wwwroot/
echo   3. SQL Database schema script inside database/
echo.
echo Upload this to MonsterASP.NET, SmarterASP.NET, or any IIS / VPS server.
echo ====================================================================
echo.
pause
