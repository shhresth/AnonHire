# AnonHire Deployment Script for Windows
# This script automates the complete deployment process

param(
    [switch]$SkipDependencies,
    [switch]$SkipContracts,
    [switch]$SkipZKP,
    [switch]$Production
)

Write-Host "AnonHire Deployment Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to check if a port is in use
function Test-Port($port) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    return $connection -ne $null
}

# Function to kill processes on specific ports
function Stop-ProcessOnPort($port) {
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($processes) {
        Write-Host "Stopping processes on port $port..." -ForegroundColor Yellow
        $processes | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2
    }
}

# Function to wait for service to be ready
function Wait-ForService($url, $serviceName, $maxAttempts = 30) {
    Write-Host "Waiting for $serviceName to be ready..." -ForegroundColor Yellow
    for ($i = 1; $i -le $maxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "$serviceName is ready!" -ForegroundColor Green
                return $true
            }
        }
        catch {
            Write-Host "Attempt $i/$maxAttempts - $serviceName not ready yet..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
    Write-Host "$serviceName failed to start after $maxAttempts attempts" -ForegroundColor Red
    return $false
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Blue

if (-not (Test-Command "node")) {
    Write-Host "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "npm is not installed. Please install npm." -ForegroundColor Red
    exit 1
}

$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# Check if Docker is available (optional)
if (Test-Command "docker") {
    Write-Host "Docker is available" -ForegroundColor Green
    $useDocker = $true
} else {
    Write-Host "Docker not found, will use manual setup" -ForegroundColor Yellow
    $useDocker = $false
}

# Stop any existing processes
Write-Host "Stopping existing processes..." -ForegroundColor Yellow
Stop-ProcessOnPort 3000
Stop-ProcessOnPort 3001
Stop-ProcessOnPort 5432

# Kill any remaining node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Install dependencies
if (-not $SkipDependencies) {
    Write-Host "Installing dependencies..." -ForegroundColor Blue
    npm run install:all
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependencies installed successfully" -ForegroundColor Green
}

# Check environment configuration
Write-Host "Checking environment configuration..." -ForegroundColor Blue

if (-not (Test-Path ".env")) {
    Write-Host ".env file not found. Please create it from .env.example" -ForegroundColor Red
    exit 1
}

# Check if contract addresses are configured
$envContent = Get-Content .env -Raw
if ($envContent -notmatch "CONTRACT_DID_REGISTRY=0x") {
    Write-Host "Smart contract addresses not configured in .env" -ForegroundColor Yellow
    if (-not $SkipContracts) {
        Write-Host "Deploying smart contracts..." -ForegroundColor Blue
        Set-Location contracts
        npm run deploy:sepolia
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to deploy smart contracts" -ForegroundColor Red
            exit 1
        }
        Set-Location ..
        Write-Host "Smart contracts deployed successfully" -ForegroundColor Green
    }
}

# Setup ZKP circuits
if (-not $SkipZKP) {
    Write-Host "Setting up ZKP circuits..." -ForegroundColor Blue
    Set-Location zkp
    
    # Download Powers of Tau if not exists
    if (-not (Test-Path "build/powersOfTau28_hez_final_12.ptau")) {
        Write-Host "Downloading Powers of Tau..." -ForegroundColor Yellow
        npm run setup:ptau
    }
    
    # Try to compile circuits
    Write-Host "Compiling ZKP circuits..." -ForegroundColor Yellow
    npm run compile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ZKP circuit compilation failed, but mock system will work" -ForegroundColor Yellow
    } else {
        Write-Host "ZKP circuits compiled successfully" -ForegroundColor Green
    }
    
    Set-Location ..
}

# Setup database
Write-Host "Setting up database..." -ForegroundColor Blue

if ($useDocker) {
    Write-Host "Starting PostgreSQL with Docker..." -ForegroundColor Yellow
    docker-compose up -d postgres
    Start-Sleep -Seconds 10
} else {
    Write-Host "Please ensure PostgreSQL is running on localhost:5432" -ForegroundColor Yellow
}

# Generate Prisma client and push schema
Write-Host "Setting up database schema..." -ForegroundColor Yellow
Set-Location backend
npx prisma generate
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to setup database schema" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is running on localhost:5432" -ForegroundColor Yellow
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "Database schema setup complete" -ForegroundColor Green

# Start services
Write-Host "Starting services..." -ForegroundColor Blue

# Start backend
Write-Host "Starting backend service..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$PWD'; npm run dev:backend" -WindowStyle Minimized
Start-Sleep -Seconds 5

# Wait for backend to be ready
if (-not (Wait-ForService "http://localhost:3001/health" "Backend")) {
    Write-Host "Backend failed to start" -ForegroundColor Red
    exit 1
}

# Start frontend
Write-Host "Starting frontend service..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$PWD'; npm run dev:frontend" -WindowStyle Minimized
Start-Sleep -Seconds 5

# Wait for frontend to be ready
if (-not (Wait-ForService "http://localhost:3000" "Frontend")) {
    Write-Host "Frontend failed to start" -ForegroundColor Red
    exit 1
}

# Test system functionality
Write-Host "Testing system functionality..." -ForegroundColor Blue

# Test backend health
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
    Write-Host "Backend health check passed" -ForegroundColor Green
} catch {
    Write-Host "Backend health check failed" -ForegroundColor Red
}

# Test ZKP system
try {
    $zkpResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/zkp/status" -UseBasicParsing
    Write-Host "ZKP system is operational" -ForegroundColor Green
} catch {
    Write-Host "ZKP system test failed (mock system should still work)" -ForegroundColor Yellow
}

# Display success message
Write-Host ""
Write-Host "AnonHire Deployment Complete!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "Health:   http://localhost:3001/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available Pages:" -ForegroundColor Yellow
Write-Host "  - Home: http://localhost:3000" -ForegroundColor White
Write-Host "  - Wallet: http://localhost:3000/wallet" -ForegroundColor White
Write-Host "  - Verifier: http://localhost:3000/verifier" -ForegroundColor White
Write-Host "  - University Issuer: http://localhost:3000/issuer/university" -ForegroundColor White
Write-Host "  - Employer Issuer: http://localhost:3000/issuer/employer" -ForegroundColor White
Write-Host ""
Write-Host "Smart Contract Addresses:" -ForegroundColor Yellow
$envContent = Get-Content .env -Raw
if ($envContent -match "CONTRACT_DID_REGISTRY=(0x[a-fA-F0-9]+)") {
    Write-Host "  - DID Registry: $($matches[1])" -ForegroundColor White
}
if ($envContent -match "CONTRACT_REVOCATION_REGISTRY=(0x[a-fA-F0-9]+)") {
    Write-Host "  - Revocation Registry: $($matches[1])" -ForegroundColor White
}
if ($envContent -match "CONTRACT_VERIFIABLE_CREDENTIAL=(0x[a-fA-F0-9]+)") {
    Write-Host "  - Verifiable Credential: $($matches[1])" -ForegroundColor White
}
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "  2. Connect your MetaMask wallet" -ForegroundColor White
Write-Host "  3. Try adding a credential as an issuer" -ForegroundColor White
Write-Host "  4. View credentials in the wallet" -ForegroundColor White
Write-Host "  5. Generate ZKP proofs" -ForegroundColor White
Write-Host "  6. Verify credentials as a verifier" -ForegroundColor White
Write-Host ""
Write-Host "To stop services, run: .\scripts\stop.ps1" -ForegroundColor Red
Write-Host ""
Write-Host "Happy credential verification!" -ForegroundColor Magenta