@echo off
title DigitLab LIS Sync Agent
color 0A
echo ========================================================
echo  DigitLab LIS Desktop Sync Agent (Analyzer Bridge)
echo ========================================================
echo Starting background listener on Port 5100...
echo.
node "%~dp0lis_agent.js"
pause
