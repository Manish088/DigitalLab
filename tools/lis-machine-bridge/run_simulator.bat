@echo off
title Blood Analyzer Simulator
color 0B
echo ========================================================
echo  Mindray / Sysmex Blood Analyzer Simulator (ASTM)
echo ========================================================
set /p BARCODE="Enter Sample Barcode (or press Enter for default 2600101): "
if "%BARCODE%"=="" set BARCODE=2600101

echo.
echo Choose Test Preset:
echo  1. Normal CBC
echo  2. Severe Anemia (Hemoglobin 5.2 - Panic Alert)
echo  3. High Infection / Sepsis (WBC 28,500)
echo  4. Low Platelet / Dengue (PLT 18,000 - Critical Alert)
set /p PRESET_CHOICE="Enter option (1-4, default 1): "

set PRESET=normal
if "%PRESET_CHOICE%"=="2" set PRESET=anemia
if "%PRESET_CHOICE%"=="3" set PRESET=infection
if "%PRESET_CHOICE%"=="4" set PRESET=platelet_low

echo.
echo Running simulation for Barcode: %BARCODE% with preset: %PRESET%...
echo.
node "%~dp0machine_simulator.js" %BARCODE% %PRESET%
pause
