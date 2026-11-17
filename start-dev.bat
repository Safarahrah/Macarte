@echo off
echo Starting Macarte Development Environment...
echo.
echo [BACKEND] Starting Express server on port 3000...
start "Macarte Backend" cmd /k "node server.js"
timeout /t 3 /nobreak >nul
echo.
echo [FRONTEND] Starting React dev server on port 3001...
start "Macarte Frontend" cmd /k "npm start"
echo.
echo Both servers should be starting in separate windows.
echo Frontend: http://localhost:3001
echo Backend API: http://localhost:3000
pause
