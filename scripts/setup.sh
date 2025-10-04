#!/bin/bash

# Setup script for AnonHire project

set -e

echo "=== AnonHire Setup Script ==="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

if [[ ! "$NODE_VERSION" =~ ^v18 ]] && [[ ! "$NODE_VERSION" =~ ^v20 ]]; then
    echo "⚠️  Warning: Node.js 18+ is recommended"
fi

# Check npm version
echo "Checking npm version..."
NPM_VERSION=$(npm -v)
echo "npm version: $NPM_VERSION"

# Install root dependencies
echo ""
echo "Installing root dependencies..."
npm install

# Install contract dependencies
echo ""
echo "Installing contract dependencies..."
cd contracts && npm install && cd ..

# Install ZKP dependencies
echo ""
echo "Installing ZKP dependencies..."
cd zkp && npm install && cd ..

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
cd backend && npm install && cd ..

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Setup environment file
echo ""
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cat > .env << 'EOF'
# Blockchain Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_MAINNET_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key

# IPFS Configuration
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Backend Configuration
NODE_ENV=development
PORT=3001
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=7d

# Database Configuration
DATABASE_URL=postgresql://anonhire:anonhire_password@localhost:5432/anonhire

# Encryption
AES_SECRET_KEY=your_aes_256_bit_secret_key_here

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CHAIN_ID=11155111

# Contract Addresses (Update after deployment)
CONTRACT_DID_REGISTRY=
CONTRACT_REVOCATION_REGISTRY=
CONTRACT_VERIFIABLE_CREDENTIAL=

# CORS
CORS_ORIGIN=http://localhost:3000
EOF
    echo "✓ .env file created"
    echo "⚠️  Please update the .env file with your actual values"
else
    echo "✓ .env file already exists"
fi

# Setup Prisma
echo ""
echo "Setting up Prisma..."
cd backend
npx prisma generate
echo "✓ Prisma client generated"
cd ..

# Create logs directory
echo ""
echo "Creating logs directory..."
mkdir -p backend/logs
echo "✓ Logs directory created"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Start PostgreSQL: docker-compose up -d postgres"
echo "3. Run database migrations: cd backend && npx prisma db push"
echo "4. Compile smart contracts: cd contracts && npm run build"
echo "5. Setup ZKP circuits: cd zkp && npm run setup"
echo "6. Deploy contracts: cd contracts && npm run deploy:sepolia"
echo "7. Start backend: npm run dev:backend"
echo "8. Start frontend: npm run dev:frontend"
echo ""
echo "For full documentation, see: docs/SETUP.md"


