@echo off
setlocal

:: jump to project root (folder containing this script)
cd /d "%~dp0"

echo Starting Citizen's Eye backend and frontend servers...

:: Backend window
start "CitizenEye Backend" cmd /k "cd /d \"%cd%\backend\" && python app.py"

:: Frontend window (sets API base URL env var before running Vite)
start "CitizenEye Frontend" cmd /k "cd /d \"%cd%\frontend\" && set VITE_API_BASE_URL=http://127.0.0.1:5000/api && npm run dev"

echo Launched. Close these windows (Ctrl+C) to stop the servers.

endlocal













