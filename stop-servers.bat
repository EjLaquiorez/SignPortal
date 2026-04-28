@echo off
setlocal EnableDelayedExpansion
REM Stop SigningPortal dev servers (Express API + Vite).
REM Double-click to run, or: stop-servers.bat nopause  (no "Press any key" — for scripts)

echo Stopping SigningPortal servers...
echo.

call :KillListeningPort 5000 "Backend API"
call :KillListeningPort 5173 "Frontend (Vite default)"
call :KillListeningPort 5174 "Frontend (Vite alternate)"

echo Done. Checked ports 5000, 5173, and 5174.
if /i not "%~1"=="nopause" pause
exit /b 0

:KillListeningPort
set "PORT=%~1"
set "TITLE=%~2"
echo Checking !TITLE! (port !PORT!)...
set "FOUND=0"
for /f "tokens=5" %%P in ('netstat -ano 2^>nul ^| findstr ":!PORT! " ^| findstr LISTENING') do (
    set "FOUND=1"
    echo   Stopping PID %%P on port !PORT!...
    taskkill /F /PID %%P >nul 2>&1
    if errorlevel 1 (
        echo   [warn] Could not stop PID %%P
    ) else (
        echo   [ok] Stopped PID %%P
    )
)
if "!FOUND!"=="0" echo   [ok] Port !PORT! is already free
echo.
exit /b 0
