#!/bin/bash

# AnonHire Deployment Script for Linux/Mac
# This script automates the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${CYAN}🚀 $1${NC}"
    echo -e "${CYAN}================================${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    if port_in_use $port; then
        echo -e "${YELLOW}🔄 Stopping processes on port $port...${NC}"
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=${3:-30}
    
    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready...${NC}"
    for i in $(seq 1 $max_attempts); do
        if curl -s -f "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        echo -e "${YELLOW}⏳ Attempt $i/$max_attempts - $service_name not ready yet...${NC}"
        sleep 2
    done
    print_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

# Parse command line arguments
SKIP_DEPENDENCIES=false
SKIP_CONTRACTS=false
SKIP_ZKP=false
PRODUCTION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-dependencies)
            SKIP_DEPENDENCIES=true
            shift
            ;;
        --skip-contracts)
            SKIP_CONTRACTS=true
            shift
            ;;
        --skip-zkp)
            SKIP_ZKP=true
            shift
            ;;
        --production)
            PRODUCTION=true
            shift
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

print_header "AnonHire Deployment Script"

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

# Check if Docker is available (optional)
if command_exists docker; then
    print_success "Docker is available"
    USE_DOCKER=true
else
    print_warning "Docker not found, will use manual setup"
    USE_DOCKER=false
fi

# Stop any existing processes
print_status "Stopping existing processes..."
kill_port 3000
kill_port 3001
kill_port 5432

# Kill any remaining node processes
pkill -f node 2>/dev/null || true

# Install dependencies
if [ "$SKIP_DEPENDENCIES" = false ]; then
    print_status "Installing dependencies..."
    npm run install:all
    print_success "Dependencies installed successfully"
fi

# Check environment configuration
print_status "Checking environment configuration..."

if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create it from .env.example"
    exit 1
fi

# Check if contract addresses are configured
if ! grep -q "CONTRACT_DID_REGISTRY=0x" .env; then
    print_warning "Smart contract addresses not configured in .env"
    if [ "$SKIP_CONTRACTS" = false ]; then
        print_status "Deploying smart contracts..."
        cd contracts
        npm run deploy:sepolia
        cd ..
        print_success "Smart contracts deployed successfully"
    fi
fi

# Setup ZKP circuits
if [ "$SKIP_ZKP" = false ]; then
    print_status "Setting up ZKP circuits..."
    cd zkp
    
    # Download Powers of Tau if not exists
    if [ ! -f "build/powersOfTau28_hez_final_12.ptau" ]; then
        print_status "Downloading Powers of Tau..."
        npm run setup:ptau
    fi
    
    # Try to compile circuits
    print_status "Compiling ZKP circuits..."
    if npm run compile; then
        print_success "ZKP circuits compiled successfully"
    else
        print_warning "ZKP circuit compilation failed, but mock system will work"
    fi
    
    cd ..
fi

# Setup database
print_status "Setting up database..."

if [ "$USE_DOCKER" = true ]; then
    print_status "Starting PostgreSQL with Docker..."
    docker-compose up -d postgres
    sleep 10
else
    print_warning "Please ensure PostgreSQL is running on localhost:5432"
fi

# Generate Prisma client and push schema
print_status "Setting up database schema..."
cd backend
npx prisma generate
npx prisma db push
cd ..
print_success "Database schema setup complete"

# Start services
print_status "Starting services..."

# Start backend
print_status "Starting backend service..."
npm run dev:backend &
BACKEND_PID=$!
sleep 5

# Wait for backend to be ready
if ! wait_for_service "http://localhost:3001/health" "Backend"; then
    print_error "Backend failed to start"
    exit 1
fi

# Start frontend
print_status "Starting frontend service..."
npm run dev:frontend &
FRONTEND_PID=$!
sleep 5

# Wait for frontend to be ready
if ! wait_for_service "http://localhost:3000" "Frontend"; then
    print_error "Frontend failed to start"
    exit 1
fi

# Test system functionality
print_status "Testing system functionality..."

# Test backend health
if curl -s -f "http://localhost:3001/health" >/dev/null 2>&1; then
    print_success "Backend health check passed"
else
    print_error "Backend health check failed"
fi

# Test ZKP system
if curl -s -f "http://localhost:3001/api/v1/zkp/status" >/dev/null 2>&1; then
    print_success "ZKP system is operational"
else
    print_warning "ZKP system test failed (mock system should still work)"
fi

# Display success message
echo ""
print_success "AnonHire Deployment Complete!"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${CYAN}🌐 Frontend: http://localhost:3000${NC}"
echo -e "${CYAN}🔧 Backend:  http://localhost:3001${NC}"
echo -e "${CYAN}📊 Health:   http://localhost:3001/health${NC}"
echo ""
echo -e "${YELLOW}📋 Available Pages:${NC}"
echo -e "  • Home: http://localhost:3000"
echo -e "  • Wallet: http://localhost:3000/wallet"
echo -e "  • Verifier: http://localhost:3000/verifier"
echo -e "  • University Issuer: http://localhost:3000/issuer/university"
echo -e "  • Employer Issuer: http://localhost:3000/issuer/employer"
echo ""

# Display contract addresses
echo -e "${YELLOW}🔑 Smart Contract Addresses:${NC}"
if grep -q "CONTRACT_DID_REGISTRY=0x" .env; then
    DID_REGISTRY=$(grep "CONTRACT_DID_REGISTRY=" .env | cut -d'=' -f2)
    echo -e "  • DID Registry: $DID_REGISTRY"
fi
if grep -q "CONTRACT_REVOCATION_REGISTRY=0x" .env; then
    REVOCATION_REGISTRY=$(grep "CONTRACT_REVOCATION_REGISTRY=" .env | cut -d'=' -f2)
    echo -e "  • Revocation Registry: $REVOCATION_REGISTRY"
fi
if grep -q "CONTRACT_VERIFIABLE_CREDENTIAL=0x" .env; then
    VERIFIABLE_CREDENTIAL=$(grep "CONTRACT_VERIFIABLE_CREDENTIAL=" .env | cut -d'=' -f2)
    echo -e "  • Verifiable Credential: $VERIFIABLE_CREDENTIAL"
fi

echo ""
echo -e "${YELLOW}📚 Next Steps:${NC}"
echo -e "  1. Open http://localhost:3000 in your browser"
echo -e "  2. Connect your MetaMask wallet"
echo -e "  3. Try adding a credential as an issuer"
echo -e "  4. View credentials in the wallet"
echo -e "  5. Generate ZKP proofs"
echo -e "  6. Verify credentials as a verifier"
echo ""
echo -e "${RED}🛑 To stop services, run: ./scripts/stop.sh${NC}"
echo ""
echo -e "${MAGENTA}✨ Happy credential verification!${NC}"

# Save PIDs for cleanup
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid
