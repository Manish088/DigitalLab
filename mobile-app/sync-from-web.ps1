# DigitLab Mobile - Sync Web Bundle to Android Native App
$ErrorActionPreference = "Stop"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "🧪 DigitLab Mobile - Sync Web Assets to Android App" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$distPath = Join-Path $scriptDir "..\frontend\dist\frontend\browser"
$wwwPath = Join-Path $scriptDir "www"

if (!(Test-Path $distPath)) {
    Write-Host "⚠️ Frontend build not found! Building frontend first..." -ForegroundColor Yellow
    Push-Location (Join-Path $scriptDir "..\frontend")
    npm run build
    Pop-Location
}

Write-Host "[1/2] Copying compiled Angular assets to mobile www..." -ForegroundColor Green
if (!(Test-Path $wwwPath)) {
    New-Item -ItemType Directory -Path $wwwPath -Force | Out-Null
}
Copy-Item -Path "$distPath\*" -Destination $wwwPath -Recurse -Force

Write-Host "[2/2] Syncing Capacitor plugins and assets with Android..." -ForegroundColor Green
npx cap sync android

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "✅ Android App is fully up to date with latest code!" -ForegroundColor Green
Write-Host "Native Android Location: $scriptDir\android" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
