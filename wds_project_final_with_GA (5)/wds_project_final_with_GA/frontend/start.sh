#!/bin/bash

# Water Network Analytics - Application Launcher
# This script provides multiple options to run the water network application

clear
echo "============================================================"
echo "🌊 WATER NETWORK ANALYTICS DASHBOARD"
echo "============================================================"
echo ""
echo "Welcome to the Water Network Performance Analytics System"
echo "This dashboard provides comprehensive insights into water"
echo "distribution network optimization across 198 wards."
echo ""
echo "============================================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to display menu
show_menu() {
    echo ""
    echo "📋 SELECT AN OPTION:"
    echo ""
    echo "  1. 🚀 Start Development Server (Recommended)"
    echo "  2. 🏗️  Build for Production"
    echo "  3. 🌐 Build & Preview Production"
    echo "  4. 📦 Install/Update Dependencies"
    echo "  5. 🔍 Check System Requirements"
    echo "  6. 📊 View Project Information"
    echo "  7. 🧹 Clean & Reset Project"
    echo "  8. ❌ Exit"
    echo ""
    echo "============================================================"
}

# Function to check system requirements
check_requirements() {
    echo ""
    echo "🔍 CHECKING SYSTEM REQUIREMENTS..."
    echo "============================================================"

    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        echo "✅ Node.js: $NODE_VERSION"
    else
        echo "❌ Node.js: Not installed"
        echo "   Please install from: https://nodejs.org/"
        return 1
    fi

    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        echo "✅ npm: $NPM_VERSION"
    else
        echo "❌ npm: Not installed"
        return 1
    fi

    # Check for other package managers
    if command_exists pnpm; then
        PNPM_VERSION=$(pnpm --version)
        echo "✅ pnpm: $PNPM_VERSION (optional)"
    else
        echo "ℹ️  pnpm: Not installed (optional)"
    fi

    if command_exists yarn; then
        YARN_VERSION=$(yarn --version)
        echo "✅ yarn: $YARN_VERSION (optional)"
    else
        echo "ℹ️  yarn: Not installed (optional)"
    fi

    # Check project files
    echo ""
    echo "📁 PROJECT FILES:"
    if [ -f "package.json" ]; then
        echo "✅ package.json: Found"
    else
        echo "❌ package.json: Not found"
        return 1
    fi

    if [ -d "node_modules" ]; then
        echo "✅ node_modules: Found"
    else
        echo "⚠️  node_modules: Not found (will install automatically)"
    fi

    if [ -f "vite.config.ts" ]; then
        echo "✅ vite.config.ts: Found"
    else
        echo "⚠️  vite.config.ts: Not found"
    fi

    echo ""
    echo "✅ System requirements check complete!"
}

# Function to install dependencies
install_dependencies() {
    echo ""
    echo "📦 INSTALLING DEPENDENCIES..."
    echo "============================================================"

    if command_exists pnpm; then
        echo "Using pnpm..."
        pnpm install
    elif command_exists npm; then
        echo "Using npm..."
        npm install
    elif command_exists yarn; then
        echo "Using yarn..."
        yarn install
    else
        echo "❌ No package manager found!"
        return 1
    fi

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Dependencies installed successfully!"
    else
        echo ""
        echo "❌ Failed to install dependencies!"
        return 1
    fi
}

# Function to start development server
start_dev_server() {
    echo ""
    echo "🚀 STARTING DEVELOPMENT SERVER..."
    echo "============================================================"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies first..."
        install_dependencies
        if [ $? -ne 0 ]; then
            return 1
        fi
    fi

    echo ""
    echo "🌐 Starting server with hot-reload enabled..."
    echo ""
    echo "📊 FEATURES AVAILABLE:"
    echo "   • Advanced Analytics Dashboard"
    echo "   • Interactive Ward Visualization (198 wards)"
    echo "   • Predictive Analytics Engine"
    echo "   • Data Export & Reporting Tools"
    echo "   • Real-time Performance Metrics"
    echo ""
    echo "🌐 ACCESS URLs:"
    echo "   • Local: http://localhost:5173"
    echo "   • Network: http://[your-ip]:5173"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo "============================================================"
    echo ""

    if command_exists pnpm; then
        pnpm dev
    elif command_exists npm; then
        npm run dev
    elif command_exists yarn; then
        yarn dev
    else
        echo "❌ No package manager found!"
        return 1
    fi
}

# Function to build for production
build_production() {
    echo ""
    echo "🏗️  BUILDING FOR PRODUCTION..."
    echo "============================================================"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies first..."
        install_dependencies
        if [ $? -ne 0 ]; then
            return 1
        fi
    fi

    echo ""
    echo "🔨 Building optimized production bundle..."

    if command_exists pnpm; then
        pnpm run build
    elif command_exists npm; then
        npm run build
    elif command_exists yarn; then
        yarn build
    else
        echo "❌ No package manager found!"
        return 1
    fi

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Production build completed successfully!"
        echo "📁 Built files are in the 'dist' directory"
    else
        echo ""
        echo "❌ Build failed!"
        return 1
    fi
}

# Function to build and preview
build_and_preview() {
    echo ""
    echo "🌐 BUILD & PREVIEW PRODUCTION..."
    echo "============================================================"

    build_production
    if [ $? -ne 0 ]; then
        return 1
    fi

    echo ""
    echo "🌐 Starting preview server..."
    echo "   • Local: http://localhost:4173"
    echo "   • Network: http://[your-ip]:4173"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo "============================================================"
    echo ""

    if command_exists pnpm; then
        pnpm run preview
    elif command_exists npm; then
        npm run preview
    elif command_exists yarn; then
        yarn preview
    else
        echo "❌ No package manager found!"
        return 1
    fi
}

# Function to show project info
show_project_info() {
    echo ""
    echo "📊 PROJECT INFORMATION"
    echo "============================================================"
    echo ""
    echo "🏷️  PROJECT DETAILS:"
    echo "   Name: Water Network Analytics Dashboard"
    echo "   Version: 1.0.0"
    echo "   Type: React TypeScript Application"
    echo "   Build Tool: Vite"
    echo ""
    echo "📁 LOCATION:"
    echo "   Path: $(pwd)"
    echo ""
    echo "🔧 TECHNOLOGY STACK:"
    echo "   • Frontend: React 18 + TypeScript"
    echo "   • Build Tool: Vite"
    echo "   • Styling: Tailwind CSS"
    echo "   • Charts: Recharts"
    echo "   • UI Components: Radix UI"
    echo "   • Backend: Express.js"
    echo ""
    echo "📈 FEATURES:"
    echo "   • Interactive Ward Map (198 wards)"
    echo "   • Advanced Analytics Dashboard"
    echo "   • Predictive Analytics Engine"
    echo "   • Data Export (CSV, JSON, PDF)"
    echo "   • Real-time Filtering & Search"
    echo "   • Performance Optimization Insights"
    echo ""
    if [ -f "package.json" ]; then
        echo "📦 DEPENDENCIES:"
        if command_exists node; then
            echo "   Node.js: $(node --version)"
        fi
        if command_exists npm; then
            echo "   npm: $(npm --version)"
        fi
        echo ""
        echo "🗂️  MAIN SCRIPTS:"
        echo "   • npm run dev     - Start development server"
        echo "   • npm run build   - Build for production"
        echo "   • npm run preview - Preview production build"
        echo "   • npm run check   - Type check"
    fi
}

# Function to clean and reset
clean_reset() {
    echo ""
    echo "🧹 CLEAN & RESET PROJECT"
    echo "============================================================"
    echo ""
    echo "⚠️  WARNING: This will delete:"
    echo "   • node_modules directory"
    echo "   • package-lock.json"
    echo "   • dist directory"
    echo "   • .vite directory (if exists)"
    echo ""
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "🗑️  Cleaning project..."

        [ -d "node_modules" ] && rm -rf node_modules && echo "✅ Removed node_modules"
        [ -f "package-lock.json" ] && rm -f package-lock.json && echo "✅ Removed package-lock.json"
        [ -f "yarn.lock" ] && rm -f yarn.lock && echo "✅ Removed yarn.lock"
        [ -f "pnpm-lock.yaml" ] && rm -f pnpm-lock.yaml && echo "✅ Removed pnpm-lock.yaml"
        [ -d "dist" ] && rm -rf dist && echo "✅ Removed dist"
        [ -d ".vite" ] && rm -rf .vite && echo "✅ Removed .vite"

        echo ""
        echo "✅ Project cleaned successfully!"
        echo ""
        read -p "Would you like to reinstall dependencies now? (y/N): " -n 1 -r
        echo ""

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_dependencies
        fi
    else
        echo ""
        echo "❌ Clean operation cancelled."
    fi
}

# Main menu loop
main() {
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        echo "❌ ERROR: package.json not found!"
        echo ""
        echo "Please run this script from the project root directory."
        echo "Expected location: water-network-landing-enhanced/"
        echo ""
        exit 1
    fi

    while true; do
        show_menu
        read -p "Enter your choice (1-8): " choice

        case $choice in
            1)
                start_dev_server
                ;;
            2)
                build_production
                ;;
            3)
                build_and_preview
                ;;
            4)
                install_dependencies
                ;;
            5)
                check_requirements
                ;;
            6)
                show_project_info
                ;;
            7)
                clean_reset
                ;;
            8)
                echo ""
                echo "👋 Thank you for using Water Network Analytics!"
                echo ""
                exit 0
                ;;
            *)
                echo ""
                echo "❌ Invalid option. Please choose 1-8."
                ;;
        esac

        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main
