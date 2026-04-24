#!/bin/bash

# ============================================
# AI Venue Manager - Start Script
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════╗"
echo "║        AI Venue Manager                  ║"
echo "║     Smart Event Platform                 ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✅ Environment variables loaded${NC}"
else
  echo -e "${RED}❌ .env file not found! Creating default...${NC}"
  cat > .env << 'ENVEOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_venue_manager
DB_USER=postgres
DB_PASSWORD=postgres
SERVER_PORT=4000
CLIENT_PORT=3000
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5
JWT_SECRET=venue-manager-secret-key-2024
ENVEOF
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✅ Default .env created${NC}"
fi

SERVER_PORT=${SERVER_PORT:-4000}
CLIENT_PORT=${CLIENT_PORT:-3000}

# ============================================
# Clean up used ports
# ============================================
echo -e "\n${YELLOW}🔌 Cleaning up ports...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}   Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
  echo -e "${GREEN}   Port $port is free${NC}"
}

cleanup_port $SERVER_PORT
cleanup_port $CLIENT_PORT

# ============================================
# Check PostgreSQL
# ============================================
echo -e "\n${YELLOW}🐘 Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
  echo -e "${RED}❌ PostgreSQL is not installed${NC}"
  exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} > /dev/null 2>&1; then
  echo -e "${YELLOW}   Starting PostgreSQL...${NC}"
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || {
    echo -e "${RED}❌ Could not start PostgreSQL. Please start it manually.${NC}"
    exit 1
  }
  sleep 2
fi
echo -e "${GREEN}✅ PostgreSQL is running${NC}"

# ============================================
# Create database if not exists
# ============================================
echo -e "\n${YELLOW}📦 Setting up database...${NC}"
DB_EXISTS=$(psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "${DB_NAME:-ai_venue_manager}" && echo "yes" || echo "no")

if [ "$DB_EXISTS" = "no" ]; then
  echo -e "${YELLOW}   Creating database ${DB_NAME}...${NC}"
  createdb -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} "${DB_NAME:-ai_venue_manager}" 2>/dev/null || {
    psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -c "CREATE DATABASE ${DB_NAME:-ai_venue_manager};" 2>/dev/null || true
  }
fi
echo -e "${GREEN}✅ Database ready${NC}"

# ============================================
# Install dependencies
# ============================================
echo -e "\n${YELLOW}📥 Installing dependencies...${NC}"

if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}   Installing server dependencies...${NC}"
  npm install --silent 2>&1 | tail -1
else
  echo -e "${GREEN}   Server dependencies already installed${NC}"
fi

if [ ! -d "client/node_modules" ]; then
  echo -e "${YELLOW}   Installing client dependencies...${NC}"
  cd client && npm install --silent 2>&1 | tail -1 && cd ..
else
  echo -e "${GREEN}   Client dependencies already installed${NC}"
fi

echo -e "${GREEN}✅ Dependencies ready${NC}"

# ============================================
# Seed database
# ============================================
echo -e "\n${YELLOW}🌱 Seeding database...${NC}"
node server/seed.js
echo -e "${GREEN}✅ Database seeded${NC}"

# ============================================
# Start application with hot reload
# ============================================
echo -e "\n${PURPLE}╔══════════════════════════════════════════╗"
echo -e "║  🚀 Starting AI Venue Manager            ║"
echo -e "║                                          ║"
echo -e "║  Server:  http://localhost:${SERVER_PORT}           ║"
echo -e "║  Client:  http://localhost:${CLIENT_PORT}           ║"
echo -e "║                                          ║"
echo -e "║  Login:   admin@venue.com                ║"
echo -e "║  Pass:    password123                    ║"
echo -e "║                                          ║"
echo -e "║  Press Ctrl+C to stop                    ║"
echo -e "╚══════════════════════════════════════════╝${NC}"
echo ""

# Start with hot reload using nodemon for server, react-scripts for client
npm start
