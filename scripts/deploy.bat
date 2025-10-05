@echo off
REM AnonHire Deployment Script for Windows (Batch version)
REM This script automates the complete deployment process

echo 🚀 AnonHire Deployment Script
echo ================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Stop any existing processes
echo 🔄 Stopping existing processes...
taskkill /F /IM node.exe >nul 2>&1

REM Install dependencies
echo 📦 Installing dependencies...
call npm run install:all
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully

REM Check environment configuration
if not exist ".env" (
    echo ❌ .env file not found. Please create it from .env.example
    pause
    exit /b 1
)

REM Check if contract addresses are configured
findstr /C:"CONTRACT_DID_REGISTRY=0x" .env >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Smart contract addresses not configured in .env
    echo 🚀 Deploying smart contracts...
    cd contracts
    call npm run deploy:sepolia
    if errorlevel 1 (
        echo ❌ Failed to deploy smart contracts
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Smart contracts deployed successfully
)

REM Setup ZKP circuits
echo 🧮 Setting up ZKP circuits...
cd zkp
if not exist "build\powersOfTau28_hez_final_12.ptau" (
    echo 📥 Downloading Powers of Tau...
    call npm run setup:ptau
)
echo 🔨 Compiling ZKP circuits...
call npm run compile
if errorlevel 1 (
    echo ⚠️  ZKP circuit compilation failed, but mock system will work
) else (
    echo ✅ ZKP circuits compiled successfully
)
cd ..

REM Setup database
echo 🗄️  Setting up database...
echo 🔧 Setting up database schema...
cd backend
call npx prisma generate
call npx prisma db push
if errorlevel 1 (
    echo ❌ Failed to setup database schema
    pause
    exit /b 1
)
cd ..
echo ✅ Database schema setup complete

REM Start services
echo 🚀 Starting services...
echo 🔧 Starting backend service...
start "AnonHire Backend" cmd /k "npm run dev:backend"
timeout /t 5 /nobreak >nul

echo 🎨 Starting frontend service...
start "AnonHire Frontend" cmd /k "npm run dev:frontend"
timeout /t 5 /nobreak >nul

REM Display success message
echo.
echo 🎉 AnonHire Deployment Complete!
echo ================================
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:3001
echo 📊 Health:   http://localhost:3001/health
echo.
echo 📋 Available Pages:
echo   • Home: http://localhost:3000
echo   • Wallet: http://localhost:3000/wallet
echo   • Verifier: http://localhost:3000/verifier
echo   • University Issuer: http://localhost:3000/issuer/university
echo   • Employer Issuer: http://localhost:3000/issuer/employer
echo.
echo 📚 Next Steps:
echo   1. Open http://localhost:3000 in your browser
echo   2. Connect your MetaMask wallet
echo   3. Try adding a credential as an issuer
echo   4. View credentials in the wallet
echo   5. Generate ZKP proofs
echo   6. Verify credentials as a verifier
echo.
echo 🛑 To stop services, close the command windows or run: scripts\stop.bat
echo.
echo ✨ Happy credential verification!
echo.
pause
