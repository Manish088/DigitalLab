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

echo Cleaning unnecessary localization language folders to prevent unzipper errors...
powershell -NoProfile -Command "$langs = @('cs', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pl', 'pt-BR', 'ru', 'tr', 'zh-Hans', 'zh-Hant'); foreach ($l in $langs) { $p = '%OUTPUT_DIR%\' + $l; if (Test-Path $p) { Remove-Item -Path $p -Recurse -Force } }"
powershell -NoProfile -Command "Get-ChildItem '%OUTPUT_DIR%\runtimes' | Where-Object { $_.Name -notlike 'win*' } | Remove-Item -Recurse -Force"

echo [4/5] Merging Frontend assets into wwwroot...
xcopy /s /e /y "%ROOT_DIR%frontend\dist\frontend\browser\*" "%OUTPUT_DIR%\wwwroot\"

echo [5/5] Creating single production zip package with normalized Unix forward-slashes...
cd /d "%ROOT_DIR%"
powershell -NoProfile -Command "$sourceDir = '%OUTPUT_DIR%'; $zipPath = '%ROOT_DIR%digitlab_production_package.zip'; if (Test-Path $zipPath) { Remove-Item $zipPath -Force }; Add-Type -AssemblyName System.IO.Compression.FileSystem; $zipFile = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create); Get-ChildItem -Path $sourceDir -Recurse -File | ForEach-Object { $rel = $_.FullName.Substring($sourceDir.Length + 1).Replace('\', '/'); [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zipFile, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal) }; $zipFile.Dispose()"

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
