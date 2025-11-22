@echo off
setlocal enabledelayedexpansion

:: Water Network Analytics - Development Server Launcher (Windows)
:: This batch file helps run the water network application on Windows

echo ==========================================
echo 🌊 Water Network Analytics Dashboard
echo ==========================================
echo.

:: Function to check if command exists
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Recommended version: 18.x or higher
    echo.
    pause
    exit /b 1
)

:: Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found!
    echo Please run this script from the project root directory.
    echo.
    pause
    exit /b 1
)

:: Display project information
echo 🔧 Project Information:
echo    - Location: %CD%
for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version 2^>nul') do set NPM_VERSION=%%i
echo    - Node.js: %NODE_VERSION%
echo    - npm: %NPM_VERSION%
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo 📦 node_modules not found. Installing dependencies first...
    echo Installing dependencies...

    :: Try different package managers
    where pnpm >nul 2>&1
    if %errorlevel% equ 0 (
        echo Using pnpm...
        pnpm install
    ) else (
        where npm >nul 2>&1
        if %errorlevel% equ 0 (
            echo Using npm...
            npm install
        ) else (
            echo ❌ No package manager found
            pause
            exit /b 1
        )
    )

    echo ✅ Dependencies installed successfully!
    echo.
)

echo 🚀 Starting Water Network Analytics Dashboard...
echo    📊 Advanced Analytics Dashboard
echo    🗺️  Interactive Ward Visualization
echo    📈 Predictive Analytics Engine
echo    📋 Data Export ^& Reporting
echo.
echo Once started, the application will be available at:
echo    🌐 Local: http://localhost:5173
echo    🌐 Network: http://[your-ip]:5173
echo.
echo Press Ctrl+C to stop the server
echo ==========================================
echo.

:: Try to start the development server with different package managers
where pnpm >nul 2>&1
if %errorlevel% equ 0 (
    echo 📦 Using pnpm...
    pnpm dev
    goto :end
)

where npm >nul 2>&1
if %errorlevel% equ 0 (
    echo 📦 Using npm...
    npm run dev
    goto :end
)

where yarn >nul 2>&1
if %errorlevel% equ 0 (
    echo 📦 Using yarn...
    yarn dev
    goto :end
)

echo ❌ No package manager found ^(npm, pnpm, or yarn^)
echo Please install Node.js and npm first.
goto :error

:end
goto :eof

:error
echo.
echo ❌ Failed to start the development server
echo.
echo Troubleshooting tips:
echo 1. Make sure you're in the project root directory
echo 2. Try running: npm install
echo 3. Check if port 5173 is already in use
echo 4. Try running: npm run build ^&^& npm run preview
echo 5. Restart your terminal as Administrator if needed
echo.
echo For more help, check the README.md file
echo.
pause
exit /b 1
