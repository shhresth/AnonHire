#!/bin/bash

# AnonHire Stop Script for Linux/Mac
# This script stops all AnonHire services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🛑 Stopping AnonHire Services${NC}"
echo -e "${RED}=============================${NC}"

# Function to stop processes on specific ports
kill_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        echo -e "${YELLOW}🔄 Stopping processes on port $port...${NC}"
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✅ Stopped processes on port $port${NC}"
    else
        echo -e "${BLUE}ℹ️  No processes found on port $port${NC}"
    fi
}

# Stop services on specific ports
echo -e "${YELLOW}🔧 Stopping backend service (port 3001)...${NC}"
kill_port 3001

echo -e "${YELLOW}🎨 Stopping frontend service (port 3000)...${NC}"
kill_port 3000

echo -e "${YELLOW}🗄️  Stopping database service (port 5432)...${NC}"
kill_port 5432

# Kill any remaining node processes
echo -e "${YELLOW}🔄 Stopping all Node.js processes...${NC}"
if pgrep -f node >/dev/null 2>&1; then
    pkill -f node
    echo -e "${GREEN}✅ Stopped Node.js processes${NC}"
else
    echo -e "${BLUE}ℹ️  No Node.js processes found${NC}"
fi

# Stop Docker containers if running
echo -e "${YELLOW}🐳 Stopping Docker containers...${NC}"
if command -v docker-compose >/dev/null 2>&1; then
    docker-compose down 2>/dev/null || true
    echo -e "${GREEN}✅ Docker containers stopped${NC}"
else
    echo -e "${BLUE}ℹ️  Docker Compose not found${NC}"
fi

# Clean up PID files
rm -f .backend.pid .frontend.pid 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ All AnonHire services stopped successfully!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "${BLUE}To restart services, run: ./scripts/deploy.sh${NC}"
