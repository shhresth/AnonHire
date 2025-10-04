# AnonHire Setup Guide

Complete guide to setting up the AnonHire Employment Credential Verification System.

## Prerequisites

### Required Software
- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **Docker** & Docker Compose
- **PostgreSQL** 15+ (or use Docker)
- **Git**

### Optional (for development)
- **Circom** (for ZKP circuits)
- **MetaMask** or similar Web3 wallet

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd AnonHire

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Configure Environment

Edit `.env` file with your configuration:

```bash
# Required: Blockchain RPC
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Required: Wallet
PRIVATE_KEY=your_wallet_private_key

# Required: IPFS (Pinata)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Required: Database
DATABASE_URL=postgresql://user:password@localhost:5432/anonhire

# Required: Security
JWT_SECRET=your_secure_jwt_secret
AES_SECRET_KEY=your_32_byte_aes_key
```

### 3. Start Services

#### Option A: Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

#### Option B: Manual Setup

```bash
# Terminal 1: Start PostgreSQL
docker-compose up -d postgres

# Terminal 2: Start backend
cd backend
npx prisma db push
npm run dev

# Terminal 3: Start frontend
cd frontend
npm run dev
```

### 4. Deploy Smart Contracts

```bash
cd contracts

# Compile contracts
npm run build

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Update .env with deployed contract addresses
```

### 5. Setup ZKP Circuits

```bash
cd zkp

# Download Powers of Tau
npm run setup:ptau

# Install Circom2 (if not already installed)
npm install -g circom2

# Compile circuits
npm run compile

# Generate proving/verification keys
npm run setup:keys
```

**Note**: If circuit compilation fails due to include path issues, the system includes a fully functional **Mock ZKP System** that provides the same API interface for development and testing purposes.

## Detailed Setup

### Smart Contracts

1. **Install Dependencies**
   ```bash
   cd contracts
   npm install
   ```

2. **Configure Hardhat**
   - Update `hardhat.config.ts` with your RPC URLs
   - Add your wallet private key to `.env`

3. **Compile**
   ```bash
   npm run build
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

5. **Deploy**
   ```bash
   # Sepolia testnet
   npm run deploy:sepolia
   
   # Polygon Mumbai testnet
   npm run deploy:mumbai
   ```

6. **Verify on Etherscan**
   ```bash
   npm run verify:sepolia
   ```

### ZKP Circuits

1. **Install Circom**
   ```bash
   # Ubuntu/Debian
   curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
   git clone https://github.com/iden3/circom.git
   cd circom
   cargo build --release
   cargo install --path circom
   ```

2. **Setup Circuits**
   ```bash
   cd zkp
   
   # Download trusted setup (Powers of Tau)
   npm run setup:ptau
   
   # Compile circuits
   npm run compile
   
   # Generate keys
   npm run setup:keys
   ```

3. **Test Circuits**
   ```bash
   npm test
   ```

4. **Mock ZKP System (Alternative)**
   
   If circuit compilation fails, the system includes a fully functional Mock ZKP System:
   
   ```bash
   # Test mock ZKP system
   cd zkp
   node scripts/mock-zkp.js
   ```
   
   The Mock ZKP System provides:
   - Same API endpoints as real ZKP system
   - Proof generation and verification
   - Frontend integration
   - Development and testing capabilities

### Backend API

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Setup Database**
   ```bash
   # Start PostgreSQL
   docker-compose up -d postgres
   
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   
   # (Optional) Seed database
   npm run db:seed
   ```

3. **Environment Variables**
   ```bash
   # Copy from .env
   DATABASE_URL=postgresql://...
   JWT_SECRET=...
   PINATA_API_KEY=...
   # ... etc
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Run Tests**
   ```bash
   npm test
   ```

### Frontend

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment**
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_CHAIN_ID=11155111
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Configuration Details

### Blockchain Networks

#### Sepolia Testnet
- Chain ID: 11155111
- RPC: `https://sepolia.infura.io/v3/YOUR_KEY`
- Faucet: https://sepoliafaucet.com/

#### Polygon Mumbai Testnet
- Chain ID: 80001
- RPC: `https://rpc-mumbai.maticvigil.com`
- Faucet: https://faucet.polygon.technology/

#### Polygon Mainnet
- Chain ID: 137
- RPC: `https://polygon-rpc.com`

### IPFS Configuration

**Pinata Setup:**
1. Sign up at https://pinata.cloud/
2. Get API Key and Secret from dashboard
3. Add to `.env`:
   ```
   PINATA_API_KEY=your_key
   PINATA_SECRET_KEY=your_secret
   ```

**Alternative: Local IPFS Node**
```bash
# Install IPFS
wget https://dist.ipfs.io/go-ipfs/v0.14.0/go-ipfs_v0.14.0_linux-amd64.tar.gz
tar -xvzf go-ipfs_v0.14.0_linux-amd64.tar.gz
cd go-ipfs
sudo bash install.sh

# Initialize and start
ipfs init
ipfs daemon
```

### Database Setup

#### PostgreSQL (Docker)
```bash
docker run --name anonhire-db \
  -e POSTGRES_USER=anonhire \
  -e POSTGRES_PASSWORD=anonhire_password \
  -e POSTGRES_DB=anonhire \
  -p 5432:5432 \
  -d postgres:15-alpine
```

#### PostgreSQL (Native)
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE anonhire;
CREATE USER anonhire WITH PASSWORD 'anonhire_password';
GRANT ALL PRIVILEGES ON DATABASE anonhire TO anonhire;
```

## Verification

### Test the Setup

1. **Backend Health Check**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Frontend Access**
   - Open http://localhost:3000
   - Connect wallet
   - Should see homepage

3. **Smart Contracts**
   ```bash
   cd contracts
   npm test
   ```

4. **ZKP Circuits**
   ```bash
   cd zkp
   npm test
   ```

## Troubleshooting

### Common Issues

**1. "Cannot connect to database"**
```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

**2. "Contract deployment failed"**
- Check you have test ETH in your wallet
- Verify RPC URL is correct
- Check private key is valid

**3. "ZKP proof generation fails"**
- Ensure circuits are compiled: `cd zkp && npm run compile`
- Verify Powers of Tau downloaded: `cd zkp && npm run setup:ptau`
- Check circuit keys exist: `ls zkp/build/*/verification_key.json`
- **Workaround**: Use the Mock ZKP System which provides full functionality for development

**4. "IPFS upload fails"**
- Verify Pinata API keys are correct
- Check network connectivity
- Try alternative gateway

### Reset Everything

```bash
# Stop all services
docker-compose down -v

# Clean dependencies
rm -rf node_modules */node_modules

# Clean build artifacts
rm -rf contracts/artifacts contracts/cache
rm -rf zkp/build
rm -rf backend/dist
rm -rf frontend/.next

# Reinstall
./scripts/setup.sh
```

## Next Steps

- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./API.md)
- [User Guide](./USER_GUIDE.md)
- [Smart Contract Docs](./CONTRACTS.md)

## Support

For issues and questions:
- GitHub Issues: <repository-url>/issues
- Documentation: <repository-url>/docs
- Discord: <discord-link>


