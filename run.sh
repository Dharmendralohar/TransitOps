#!/bin/bash
echo "=== Starting TransitOps Fleet Management Dashboard ==="
echo "Installing dependencies..."
npm install --no-audit --no-fund
echo "Compiling system check..."
npm run build
echo "Starting local Vite server on port 5173..."
npm run dev
