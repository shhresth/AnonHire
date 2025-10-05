# AnonHire Deployment Test Script
# This script tests if the deployment was successful

Write-Host "🧪 Testing AnonHire Deployment" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

$allTestsPassed = $true

# Test 1: Backend Health Check
Write-Host "🔍 Testing backend health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend health check passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend health check failed (Status: $($response.StatusCode))" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "❌ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 2: Frontend Accessibility
Write-Host "🔍 Testing frontend accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend accessibility failed (Status: $($response.StatusCode))" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "❌ Frontend accessibility failed: $($_.Exception.Message)" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 3: ZKP System Status
Write-Host "🔍 Testing ZKP system..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/zkp/status" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ ZKP system is operational" -ForegroundColor Green
    } else {
        Write-Host "❌ ZKP system test failed (Status: $($response.StatusCode))" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "❌ ZKP system test failed: $($_.Exception.Message)" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 4: API Endpoints
Write-Host "🔍 Testing API endpoints..." -ForegroundColor Yellow
$endpoints = @(
    "http://localhost:3001/api/v1/auth/nonce/0x1234567890123456789012345678901234567890",
    "http://localhost:3001/api/v1/credentials"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -UseBasicParsing -TimeoutSec 10
        Write-Host "✅ API endpoint $endpoint is working" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404 -or $_.Exception.Response.StatusCode -eq 401) {
            Write-Host "✅ API endpoint $endpoint is responding (expected error)" -ForegroundColor Green
        } else {
            Write-Host "❌ API endpoint $endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
            $allTestsPassed = $false
        }
    }
}

# Test 5: Database Connection
Write-Host "🔍 Testing database connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 10
    $content = $response.Content | ConvertFrom-Json
    if ($content.status -eq "healthy") {
        Write-Host "✅ Database connection is working" -ForegroundColor Green
    } else {
        Write-Host "❌ Database connection test failed" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "❌ Database connection test failed: $($_.Exception.Message)" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 6: Smart Contract Configuration
Write-Host "🔍 Testing smart contract configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content .env -Raw
    if ($envContent -match "CONTRACT_DID_REGISTRY=0x" -and 
        $envContent -match "CONTRACT_REVOCATION_REGISTRY=0x" -and 
        $envContent -match "CONTRACT_VERIFIABLE_CREDENTIAL=0x") {
        Write-Host "✅ Smart contract addresses are configured" -ForegroundColor Green
    } else {
        Write-Host "❌ Smart contract addresses are not configured" -ForegroundColor Red
        $allTestsPassed = $false
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    $allTestsPassed = $false
}

# Summary
Write-Host ""
if ($allTestsPassed) {
    Write-Host "🎉 All tests passed! AnonHire is ready to use!" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Open http://localhost:3000 in your browser to start using AnonHire!" -ForegroundColor Cyan
} else {
    Write-Host "❌ Some tests failed. Please check the deployment." -ForegroundColor Red
    Write-Host "=================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Try running the deployment script again:" -ForegroundColor Yellow
    Write-Host "   .\scripts\deploy.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "📋 Available URLs:" -ForegroundColor Yellow
Write-Host "  • Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  • Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "  • Health:   http://localhost:3001/health" -ForegroundColor White
Write-Host "  • API:      http://localhost:3001/api/v1" -ForegroundColor White
