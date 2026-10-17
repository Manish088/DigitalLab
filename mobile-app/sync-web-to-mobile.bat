@echo off
echo ===================================================
echo 🧪 DigitLab Mobile - Sync Web Assets to Android App
echo ===================================================

cd /d "%~dp0"

echo [1/3] Copying latest Angular web bundle to mobile www...
if not exist "www" mkdir "www"
xcopy /E /I /Y "..\frontend\dist\frontend\browser\*" "www\"

echo [2/3] Checking Capacitor Android setup...
if not exist "android" (
    echo Initializing Android native project...
    call npx cap add android
)

echo [3/3] Syncing assets and plugins with Android...
call npx cap sync android

echo.
echo ===================================================
echo ✅ Sync complete!
echo Android project is ready at: %~dp0android
echo ===================================================
