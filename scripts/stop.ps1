# AnonHire Stop Script for Windows
# This script stops all AnonHire services

Write-Host "🛑 Stopping AnonHire Services" -ForegroundColor Red
Write-Host "=============================" -ForegroundColor Red

# Function to stop processes on specific ports
function Stop-ProcessOnPort($port) {
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($processes) {
        Write-Host "🔄 Stopping processes on port $port..." -ForegroundColor Yellow
        $processes | ForEach-Object { 
            try {
                Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
                Write-Host "✅ Stopped process $($_)" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  Could not stop process $($_)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "ℹ️  No processes found on port $port" -ForegroundColor Blue
    }
}

# Stop services on specific ports
Write-Host "🔧 Stopping backend service (port 3001)..." -ForegroundColor Yellow
Stop-ProcessOnPort 3001

Write-Host "🎨 Stopping frontend service (port 3000)..." -ForegroundColor Yellow
Stop-ProcessOnPort 3000

Write-Host "🗄️  Stopping database service (port 5432)..." -ForegroundColor Yellow
Stop-ProcessOnPort 5432

# Kill any remaining node processes
Write-Host "🔄 Stopping all Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        try {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Stopped Node.js process $($_.Id)" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Could not stop Node.js process $($_.Id)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "ℹ️  No Node.js processes found" -ForegroundColor Blue
}

# Stop Docker containers if running
Write-Host "🐳 Stopping Docker containers..." -ForegroundColor Yellow
try {
    docker-compose down
    Write-Host "✅ Docker containers stopped" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No Docker containers to stop" -ForegroundColor Blue
}

Write-Host ""
Write-Host "✅ All AnonHire services stopped successfully!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "To restart services, run: .\scripts\deploy.ps1" -ForegroundColor Cyan
