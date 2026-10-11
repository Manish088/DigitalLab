@echo off
echo ====================================================================
echo   STOPPING DIGITLAB DOCKER CONTAINERS
echo ====================================================================
cd /d "%~dp0"
docker compose down
echo.
echo Containers stopped successfully!
pause
