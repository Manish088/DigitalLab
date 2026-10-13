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
if exist "%ROOT_DIR%database" xcopy /s /e /y "%ROOT_DIR%database\*" "%OUTPUT_DIR%\database\"

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

echo [3.5/5] Sanitizing output: removing all local test files, dev configs, and local uploads...
powershell -NoProfile -Command "if (Test-Path '%OUTPUT_DIR%\appsettings.Development.json') { Remove-Item '%OUTPUT_DIR%\appsettings.Development.json' -Force }"
powershell -NoProfile -Command "if (Test-Path '%OUTPUT_DIR%\wwwroot\uploads') { Get-ChildItem '%OUTPUT_DIR%\wwwroot\uploads' -Recurse -File | Where-Object { $_.Name -ne '.gitkeep' } | Remove-Item -Force; Get-ChildItem '%OUTPUT_DIR%\wwwroot\uploads' -Directory | Remove-Item -Recurse -Force } else { New-Item -ItemType Directory -Path '%OUTPUT_DIR%\wwwroot\uploads' -Force | Out-Null }"
powershell -NoProfile -Command "Get-ChildItem '%OUTPUT_DIR%' -Include '*.db', '*.sqlite*', '*.db-shm', '*.db-wal', 'test_*.*', '*.log' -Recurse | Remove-Item -Force"

echo Ensuring web.config forces ASPNETCORE_ENVIRONMENT=Production...
powershell -NoProfile -Command "$wc = '%OUTPUT_DIR%\web.config'; if (Test-Path $wc) { $xml = [xml](Get-Content $wc); $asp = $xml.SelectSingleNode('//aspNetCore'); if ($asp) { $envNode = $asp.SelectSingleNode('environmentVariables'); if (-not $envNode) { $envNode = $xml.CreateElement('environmentVariables'); $asp.AppendChild($envNode) | Out-Null }; $existing = $envNode.SelectSingleNode(\"environmentVariable[@name='ASPNETCORE_ENVIRONMENT']\"); if (-not $existing) { $v = $xml.CreateElement('environmentVariable'); $v.SetAttribute('name', 'ASPNETCORE_ENVIRONMENT'); $v.SetAttribute('value', 'Production'); $envNode.AppendChild($v) | Out-Null }; $xml.Save($wc) } }"

echo [4/5] Merging Frontend assets into wwwroot...
xcopy /s /e /y "%ROOT_DIR%frontend\dist\frontend\browser\*" "%OUTPUT_DIR%\wwwroot\"

echo [5/5] Creating single production zip package with normalized Unix forward-slashes...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$sourceDir = '%OUTPUT_DIR%'; $zipPath = '%ROOT_DIR%digitlab_production_package.zip'; if (Test-Path $zipPath) { Remove-Item $zipPath -Force }; Add-Type -AssemblyName System.IO.Compression; Add-Type -AssemblyName System.IO.Compression.FileSystem; $stream = [System.IO.File]::Create($zipPath); $zip = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create); try { Get-ChildItem -Path $sourceDir -Recurse -File | ForEach-Object { $rel = $_.FullName.Substring($sourceDir.Length + 1).Replace('\', '/'); [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal) } } finally { $zip.Dispose(); $stream.Dispose() }"

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
if not defined NOPAUSE pause
