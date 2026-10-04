@echo off
echo ========================================================
echo Pushing DigitLab Project to GitHub (Manish088/DigitalLab)
echo ========================================================
echo.
cd /d "D:\Antigravity\Lab"
git branch -M main
git remote set-url origin https://github.com/Manish088/DigitalLab.git
echo Running: git push -u origin main
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo SUCCESS! Project successfully pushed to GitHub!
    echo Refresh your GitHub repository to see the files.
    echo ========================================================
) else (
    echo ========================================================
    echo Error during push. Please check browser authentication.
    echo ========================================================
)
echo.
pause
