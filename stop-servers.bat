@echo off
REM Stop SigningPortal Servers
REM This batch file stops all running servers (backend and frontend)

echo Stopping SigningPortal servers...
echo.

REM Stop backend server (port 5000)
echo Checking backend server (port 5000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Stopping process on port 5000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo Process %%a not found or already stopped
    ) else (
        echo Process %%a stopped successfully
    )
)
echo.

REM Stop frontend server (port 5173)
echo Checking frontend server (port 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo Stopping process on port 5173 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo Process %%a not found or already stopped
    ) else (
        echo Process %%a stopped successfully
    )
)
echo.

echo All servers stopped!
pause
