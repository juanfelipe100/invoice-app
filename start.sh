#!/usr/bin/env bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== InvoiceHub Setup ===${NC}"

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}Node.js not found. Install it from https://nodejs.org (LTS)${NC}"
  exit 1
fi

echo "Node.js: $(node -v)"


# Install backend deps
echo -e "\n${GREEN}Installing backend dependencies...${NC}"
cd "$(dirname "$0")/backend"
npm install

# Install frontend deps
echo -e "\n${GREEN}Installing frontend dependencies...${NC}"
cd "../frontend"
npm install

echo -e "\n${GREEN}Starting servers...${NC}"
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:5173"
echo "  Admin:    http://localhost:5173/#admin"
echo ""
echo "Press Ctrl+C to stop."
echo ""

# Start both servers
cd ..
(cd backend && node server.js) &
BACKEND_PID=$!

(cd frontend && npm run dev) &
FRONTEND_PID=$!

# Wait and cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
