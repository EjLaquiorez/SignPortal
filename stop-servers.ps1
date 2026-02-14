# Stop SigningPortal Servers
# This script stops all running servers (backend and frontend)

Write-Host "Stopping SigningPortal servers..." -ForegroundColor Yellow

# Function to kill process on a specific port
function Stop-Port {
    param([int]$Port)
    
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                 Select-Object -ExpandProperty OwningProcess -Unique
    
    if ($processes) {
        foreach ($pid in $processes) {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Stopping process on port $Port (PID: $pid) - $($proc.ProcessName)" -ForegroundColor Cyan
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
        Write-Host "[OK] Port $Port cleared" -ForegroundColor Green
    } else {
        Write-Host "[OK] Port $Port is already free" -ForegroundColor Gray
    }
}

# Stop backend server (port 5000)
Write-Host "`nChecking backend server (port 5000)..." -ForegroundColor Yellow
Stop-Port -Port 5000

# Stop frontend server (port 5173 - default Vite port)
Write-Host "`nChecking frontend server (port 5173)..." -ForegroundColor Yellow
Stop-Port -Port 5173

# Also kill any node processes that might be running (optional - be careful with this)
Write-Host "`nChecking for other Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $count = $nodeProcesses.Count
    Write-Host "Found $count Node.js process(es)" -ForegroundColor Cyan
    $response = Read-Host "Do you want to kill all Node.js processes? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] All Node.js processes stopped" -ForegroundColor Green
    } else {
        Write-Host "Skipping Node.js process termination" -ForegroundColor Gray
    }
} else {
    Write-Host "[OK] No other Node.js processes found" -ForegroundColor Gray
}

Write-Host "`n[OK] All servers stopped!" -ForegroundColor Green
