# 🚀 AnonHire Deployment Scripts

This directory contains automated deployment scripts for the AnonHire system. These scripts handle the complete setup and deployment process, making it easy to get your AnonHire system running.

## 📋 Available Scripts

### Windows Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `deploy.ps1` | PowerShell deployment script (recommended) | `.\scripts\deploy.ps1` |
| `deploy.bat` | Batch deployment script (simple) | `.\scripts\deploy.bat` |
| `stop.ps1` | PowerShell stop script | `.\scripts\stop.ps1` |
| `stop.bat` | Batch stop script | `.\scripts\stop.bat` |

### Linux/Mac Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `deploy.sh` | Bash deployment script | `./scripts/deploy.sh` |
| `stop.sh` | Bash stop script | `./scripts/stop.sh` |

## 🚀 Quick Start

### Windows (PowerShell - Recommended)

```powershell
# Deploy the system
.\scripts\deploy.ps1

# Stop the system
.\scripts\stop.ps1
```

### Windows (Command Prompt)

```cmd
# Deploy the system
scripts\deploy.bat

# Stop the system
scripts\stop.bat
```

### Linux/Mac

```bash
# Make scripts executable (first time only)
chmod +x scripts/deploy.sh scripts/stop.sh

# Deploy the system
./scripts/deploy.sh

# Stop the system
./scripts/stop.sh
```

## 🔧 What the Deployment Script Does

The deployment script automates the following steps:

### 1. **Prerequisites Check**
- ✅ Verifies Node.js 18+ is installed
- ✅ Verifies npm is available
- ✅ Checks for Docker (optional)

### 2. **Environment Setup**
- ✅ Stops any existing processes
- ✅ Installs all dependencies (`npm run install:all`)
- ✅ Checks `.env` configuration

### 3. **Smart Contract Deployment**
- ✅ Deploys contracts to Sepolia testnet (if not already deployed)
- ✅ Updates `.env` with contract addresses
- ✅ Configures contract roles

### 4. **ZKP System Setup**
- ✅ Downloads Powers of Tau file
- ✅ Attempts to compile ZKP circuits
- ✅ Falls back to mock system if compilation fails

### 5. **Database Setup**
- ✅ Starts PostgreSQL (Docker or local)
- ✅ Generates Prisma client
- ✅ Pushes database schema

### 6. **Service Startup**
- ✅ Starts backend service (port 3001)
- ✅ Starts frontend service (port 3000)
- ✅ Waits for services to be ready

### 7. **System Testing**
- ✅ Tests backend health endpoint
- ✅ Tests ZKP system status
- ✅ Verifies all services are running

## 🎯 Command Line Options

### PowerShell Script Options

```powershell
# Skip dependency installation
.\scripts\deploy.ps1 -SkipDependencies

# Skip smart contract deployment
.\scripts\deploy.ps1 -SkipContracts

# Skip ZKP circuit setup
.\scripts\deploy.ps1 -SkipZKP

# Production mode
.\scripts\deploy.ps1 -Production

# Combine options
.\scripts\deploy.ps1 -SkipDependencies -SkipZKP
```

### Bash Script Options

```bash
# Skip dependency installation
./scripts/deploy.sh --skip-dependencies

# Skip smart contract deployment
./scripts/deploy.sh --skip-contracts

# Skip ZKP circuit setup
./scripts/deploy.sh --skip-zkp

# Production mode
./scripts/deploy.sh --production

# Combine options
./scripts/deploy.sh --skip-dependencies --skip-zkp
```

## 📊 Expected Output

After successful deployment, you'll see:

```
🎉 AnonHire Deployment Complete!
================================

🌐 Frontend: http://localhost:3000
🔧 Backend:  http://localhost:3001
📊 Health:   http://localhost:3001/health

📋 Available Pages:
  • Home: http://localhost:3000
  • Wallet: http://localhost:3000/wallet
  • Verifier: http://localhost:3000/verifier
  • University Issuer: http://localhost:3000/issuer/university
  • Employer Issuer: http://localhost:3000/issuer/employer

🔑 Smart Contract Addresses:
  • DID Registry: 0x88d021d36d6cD534621fF89027A2075ED280b775
  • Revocation Registry: 0x485d59D044243e6Efdc4acA209452DA020815b0D
  • Verifiable Credential: 0xd25382f3d149C86ACeC6c8CE14324CC97e3f4b0f

📚 Next Steps:
  1. Open http://localhost:3000 in your browser
  2. Connect your MetaMask wallet
  3. Try adding a credential as an issuer
  4. View credentials in the wallet
  5. Generate ZKP proofs
  6. Verify credentials as a verifier

🛑 To stop services, run: .\scripts\stop.ps1

✨ Happy credential verification!
```

## 🔍 Troubleshooting

### Common Issues

#### 1. **Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution**: The script automatically stops existing processes, but if this persists:
```bash
# Windows
taskkill /F /IM node.exe

# Linux/Mac
pkill -f node
```

#### 2. **Node.js Not Found**
```
❌ Node.js is not installed
```
**Solution**: Install Node.js 18+ from [nodejs.org](https://nodejs.org/)

#### 3. **Dependencies Installation Failed**
```
❌ Failed to install dependencies
```
**Solution**: 
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

#### 4. **Smart Contract Deployment Failed**
```
❌ Failed to deploy smart contracts
```
**Solution**: 
- Ensure you have test ETH in your wallet
- Check your private key in `.env`
- Verify RPC URL is correct

#### 5. **Database Connection Failed**
```
❌ Failed to setup database schema
```
**Solution**:
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- For Docker: `docker-compose up -d postgres`

### Manual Steps (if scripts fail)

If the automated scripts fail, you can run the steps manually:

```bash
# 1. Install dependencies
npm run install:all

# 2. Deploy contracts
cd contracts
npm run deploy:sepolia
cd ..

# 3. Setup database
cd backend
npx prisma generate
npx prisma db push
cd ..

# 4. Start services
npm run dev:backend  # Terminal 1
npm run dev:frontend # Terminal 2
```

## 🔧 Customization

### Environment Variables

The scripts respect the following environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/anonhire

# Blockchain
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key

# IPFS
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Security
JWT_SECRET=your_jwt_secret
AES_SECRET_KEY=your_aes_key
```

### Custom Ports

To use different ports, modify the scripts or set environment variables:

```bash
# Custom ports
export PORT=3001
export FRONTEND_PORT=3000
```

## 📚 Additional Resources

- [Main README](../README.md) - Project overview
- [Setup Guide](../docs/SETUP.md) - Detailed setup instructions
- [API Documentation](../docs/API.md) - API reference
- [Deployment Guide](../docs/DEPLOYMENT.md) - Production deployment

## 🤝 Contributing

To improve the deployment scripts:

1. Test on your platform (Windows/Linux/Mac)
2. Add error handling for edge cases
3. Improve user feedback and logging
4. Submit a pull request

## 📞 Support

If you encounter issues with the deployment scripts:

1. Check the troubleshooting section above
2. Review the logs for specific error messages
3. Open an issue on GitHub with:
   - Your operating system
   - Node.js version
   - Complete error output
   - Steps to reproduce

---

**Happy deploying! 🚀**
