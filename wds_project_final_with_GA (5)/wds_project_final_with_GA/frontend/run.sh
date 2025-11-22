#!/bin/bash

# Water Network Analytics - Development Server Launcher
# This script helps run the water network application with proper error handling

echo "=========================================="
echo "🌊 Water Network Analytics Dashboard"
echo "=========================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run with different package managers
run_dev_server() {
    echo "Starting development server..."
    echo ""

    # Try different approaches to run the dev server
    if command_exists pnpm; then
        echo "📦 Using pnpm..."
        pnpm dev
    elif command_exists npm; then
        echo "📦 Using npm..."
        npm run dev
    elif command_exists yarn; then
        echo "📦 Using yarn..."
        yarn dev
    else
        echo "❌ No package manager found (npm, pnpm, or yarn)"
        echo "Please install Node.js and npm first."
        exit 1
    fi
}

# Function to install dependencies if needed
install_dependencies() {
    echo "Installing dependencies..."

    if command_exists pnpm; then
        pnpm install
    elif command_exists npm; then
        npm install
    elif command_exists yarn; then
        yarn install
    else
        echo "❌ No package manager found"
        exit 1
    fi

    echo "✅ Dependencies installed successfully!"
    echo ""
}

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules not found. Installing dependencies first..."
    install_dependencies
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo "🔧 Project Information:"
echo "   - Location: $(pwd)"
echo "   - Node.js: $(node --version 2>/dev/null || echo 'Not found')"
echo "   - npm: $(npm --version 2>/dev/null || echo 'Not found')"
echo ""

# Check if Node.js is installed
if ! command_exists node; then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    echo "Recommended version: 18.x or higher"
    exit 1
fi

echo "🚀 Starting Water Network Analytics Dashboard..."
echo "   📊 Advanced Analytics Dashboard"
echo "   🗺️  Interactive Ward Visualization"
echo "   📈 Predictive Analytics Engine"
echo "   📋 Data Export & Reporting"
echo ""
echo "Once started, the application will be available at:"
echo "   🌐 Local: http://localhost:5173"
echo "   🌐 Network: http://[your-ip]:5173"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=========================================="
echo ""

# Run the development server
run_dev_server

# If we get here, something went wrong
echo ""
echo "❌ Failed to start the development server"
echo ""
echo "Troubleshooting tips:"
echo "1. Make sure you're in the project root directory"
echo "2. Try running: npm install"
echo "3. Check if port 5173 is already in use"
echo "4. Try running: npm run build && npm run preview"
echo ""
echo "For more help, check the README.md file"
