#!/bin/bash

# Water Network Analytics - Build & Preview Script
# This script builds the application for production and starts a preview server

echo "=========================================="
echo "🏗️  Water Network Analytics - Build Script"
echo "=========================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to build the application
build_application() {
    echo "🔨 Building application for production..."
    echo ""

    if command_exists pnpm; then
        echo "📦 Using pnpm..."
        pnpm run build
    elif command_exists npm; then
        echo "📦 Using npm..."
        npm run build
    elif command_exists yarn; then
        echo "📦 Using yarn..."
        yarn build
    else
        echo "❌ No package manager found (npm, pnpm, or yarn)"
        echo "Please install Node.js and npm first."
        exit 1
    fi
}

# Function to preview the built application
preview_application() {
    echo ""
    echo "🌐 Starting preview server..."
    echo ""

    if command_exists pnpm; then
        echo "📦 Using pnpm..."
        pnpm run preview
    elif command_exists npm; then
        echo "📦 Using npm..."
        npm run preview
    elif command_exists yarn; then
        echo "📦 Using yarn..."
        yarn preview
    else
        echo "❌ No package manager found"
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

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules not found. Installing dependencies first..."
    install_dependencies
fi

echo "🔧 Build Information:"
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

echo "🚀 Building Water Network Analytics Dashboard..."
echo "   📊 Advanced Analytics Dashboard"
echo "   🗺️  Interactive Ward Visualization"
echo "   📈 Predictive Analytics Engine"
echo "   📋 Data Export & Reporting"
echo ""

# Build the application
build_application

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo ""
    echo "📁 Built files are located in the 'dist' directory"
    echo ""

    # Ask if user wants to preview
    read -p "🌐 Would you like to start the preview server? (y/N): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Starting preview server..."
        echo "The application will be available at:"
        echo "   🌐 Local: http://localhost:4173"
        echo "   🌐 Network: http://[your-ip]:4173"
        echo ""
        echo "Press Ctrl+C to stop the server"
        echo "=========================================="
        echo ""

        preview_application
    else
        echo ""
        echo "✅ Build complete! You can manually start the preview server with:"
        echo "   npm run preview"
        echo ""
        echo "Or deploy the 'dist' directory to your web server."
    fi
else
    echo ""
    echo "❌ Build failed!"
    echo ""
    echo "Troubleshooting tips:"
    echo "1. Check for TypeScript errors: npm run check"
    echo "2. Make sure all dependencies are installed: npm install"
    echo "3. Check the console output above for specific errors"
    echo "4. Try cleaning and rebuilding:"
    echo "   - Delete node_modules and package-lock.json"
    echo "   - Run npm install"
    echo "   - Try building again"
    echo ""
    exit 1
fi
