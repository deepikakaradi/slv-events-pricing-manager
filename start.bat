@echo off
echo =============================================================
echo Starting SLV Events Pricing Manager Fullstack Application
echo =============================================================

echo Launching Express Backend Server...
start "SLV Backend" cmd.exe /c "npm run dev:backend"

echo Launching Vite Frontend Server...
start "SLV Frontend" cmd.exe /c "npm run dev:frontend"

echo =============================================================
echo Servers initiated in separate windows.
echo - Frontend: http://localhost:5173
echo - Backend: http://localhost:5000
echo =============================================================
pause
