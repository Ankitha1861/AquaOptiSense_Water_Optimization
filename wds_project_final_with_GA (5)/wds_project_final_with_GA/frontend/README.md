# 🌊 AquaOptiSense - Water Network Analytics Dashboard

A comprehensive React-based dashboard for analyzing water distribution network performance across 198 wards. Features advanced analytics, interactive visualizations, predictive modeling, and data export capabilities.

![Water Network Dashboard](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)

## 🚀 Quick Start

### Option 1: Use the Launcher Script (Recommended)
```bash
# Run the interactive launcher
./start.sh
```

This will show a menu with all available options including development server, build tools, and system checks.

### Option 2: Direct Development Server
```bash
# Simple development server start
./run.sh
```

### Option 3: Windows Users
```batch
# For Windows Command Prompt/PowerShell
run.bat
```

### Option 4: Manual Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 📊 Features

### 🗺️ Interactive Ward Visualization
- **198 Ward Coverage**: Complete visualization of all water network wards
- **Color-Coded Performance**: Visual indicators for shortage, pressure, efficiency, and leakage
- **Hover Information**: Detailed metrics appear on ward hover
- **Click Selection**: Select wards for detailed analysis
- **Multiple Views**: Grid layout and list view options
- **Real-time Filtering**: Filter by performance categories

### 📈 Advanced Analytics Dashboard
- **Efficiency Analysis**: Ward rankings and performance scoring
- **Performance Metrics**: Distribution charts and radial visualizations
- **Correlation Analysis**: Scatter plots showing metric relationships
- **Benchmarks**: Performance categorization and standards

### 🔮 Predictive Analytics Engine
- **Multi-Scenario Forecasting**: Optimistic, realistic, and pessimistic predictions
- **Timeframe Options**: 6 months to 5 years projections
- **Investment Recommendations**: AI-powered ROI analysis and priority suggestions
- **Scenario Comparison**: Radar charts comparing different futures

### 📋 Data Export & Reporting
- **Multiple Formats**: CSV, JSON, Excel, PDF export options
- **Smart Filtering**: Export all, summary, critical, or improved wards
- **Automated Reports**: Generated summary reports with insights
- **Share Functionality**: Easy sharing and collaboration tools

### 📊 Enhanced Visualizations
- **Professional Charts**: Using Recharts library with proper axis labels
- **Interactive Elements**: Hover tooltips, click selections, zoom controls
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Color-coded Legends**: Clear performance indicators

## 🏗️ Architecture

### Frontend Stack
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety and better developer experience
- **Vite**: Lightning-fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Professional charting library
- **Radix UI**: Accessible component primitives

### Backend Stack
- **Express.js**: RESTful API server
- **Analytics Engine**: Advanced data processing and calculations
- **CORS Enabled**: Cross-origin resource sharing for development

### Data Processing
- **Ward Analysis**: 198 wards with before/after optimization metrics
- **Performance Scoring**: Advanced algorithms for efficiency calculation
- **Correlation Detection**: Statistical analysis of metric relationships
- **Predictive Modeling**: Future trend analysis and forecasting

## 📁 Project Structure

```
water-network-landing-enhanced/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ui/           # Reusable UI components
│   │   │   ├── AdvancedAnalytics.tsx    # Analytics dashboard
│   │   │   ├── VisibleWardMap.tsx       # Interactive ward map
│   │   │   ├── PredictiveAnalytics.tsx  # Forecasting engine
│   │   │   └── DataExport.tsx           # Export functionality
│   │   ├── pages/             # Page components
│   │   └── lib/              # Utilities and helpers
│   └── public/               # Static assets and ward data
├── server/                   # Backend Express server
│   ├── index.ts             # Main server file
│   └── analytics.ts         # Analytics API endpoints
├── shared/                  # Shared utilities
├── run.sh                   # Quick start script (Unix/Linux/Mac)
├── run.bat                  # Quick start script (Windows)
├── start.sh                 # Interactive launcher script
├── build.sh                 # Build script
└── package.json             # Project dependencies
```

## 🔧 Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # TypeScript type checking
```

### Custom Scripts
```bash
./start.sh           # Interactive launcher menu
./run.sh            # Quick development server start
./build.sh          # Build with preview option
```

## 🌐 Access URLs

Once running, the application will be available at:

- **Local Development**: http://localhost:5173
- **Network Access**: http://[your-ip]:5173
- **Production Preview**: http://localhost:4173

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- **Desktop**: Full feature set with multiple columns
- **Tablet**: Optimized layouts with collapsible sections
- **Mobile**: Touch-friendly interface with stacked layouts

## 🎯 Key Metrics Analyzed

### Water Distribution Performance
- **Shortage Percentage**: Current water deficit levels
- **Pressure Levels**: Water pressure in meters
- **Supply vs Demand**: Flow rates and capacity utilization
- **Leakage Rates**: Non-revenue water percentages

### System Improvements
- **42.8% Average Shortage Reduction**: Across all wards
- **5.9% Pressure Improvement**: Better service delivery
- **17,062 LPS Additional Supply**: Increased capacity
- **8.6% Leakage Reduction**: Improved efficiency

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- npm, pnpm, or yarn
- Modern web browser

### Setup
1. **Clone or download** the project
2. **Navigate** to project directory
3. **Run** `./start.sh` for interactive setup
4. **Or run** `npm install && npm run dev` manually

### Adding New Features
1. **Components**: Add to `client/src/components/`
2. **Pages**: Add to `client/src/pages/`
3. **API Routes**: Add to `server/analytics.ts`
4. **Types**: Define in component files or shared directory

## 🧪 Testing

```bash
npm run check        # Type checking
npm run build        # Build validation
npm run preview      # Production testing
```

## 📈 Performance Features

### Optimization Techniques
- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Components loaded on demand
- **Optimized Images**: Proper sizing and compression
- **Efficient Rendering**: Memoized components and calculations

### Data Processing
- **Client-side Analytics**: Fast calculations without server roundtrips
- **Efficient Filtering**: Real-time ward filtering and search
- **Cached Calculations**: Memoized expensive operations
- **Responsive Charts**: Optimized for different screen sizes

## 🌟 Advanced Features

### Ward Analysis
- **Individual Ward Profiles**: Detailed metrics for each of 198 wards
- **Performance Comparison**: Before/after optimization analysis
- **Efficiency Scoring**: Advanced algorithms for performance rating
- **Geographic Distribution**: Spatial analysis of performance patterns

### Predictive Capabilities
- **Growth Modeling**: Demand projection based on historical trends
- **Scenario Planning**: What-if analysis for different conditions
- **Investment Planning**: ROI calculations for infrastructure improvements
- **Risk Assessment**: Identification of critical attention areas

### Export & Sharing
- **Professional Reports**: Automatically generated summary documents
- **Multiple Formats**: CSV for analysis, JSON for developers, PDF for presentations
- **Custom Filtering**: Export specific subsets of data
- **URL Sharing**: Direct links to specific views and filters

## 📞 Support

### Troubleshooting
1. **Port Issues**: If port 5173 is busy, Vite will suggest alternatives
2. **Node Version**: Ensure Node.js 18+ is installed
3. **Dependencies**: Run `npm install` to ensure all packages are present
4. **Build Issues**: Check the console for specific error messages

### Common Solutions
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset development server
npm run dev -- --force

# Check for TypeScript errors
npm run check
```

## 🎉 Getting Started Checklist

- [ ] Install Node.js 18+
- [ ] Download/clone the project
- [ ] Run `./start.sh` or `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Explore the ward visualization
- [ ] Try the advanced analytics dashboard
- [ ] Test the predictive analytics features
- [ ] Export some data in different formats

---

**🌊 Water Network Analytics Dashboard** - Transforming water management through data-driven insights and advanced visualization.

For more information or issues, check the application's built-in help sections and tooltips throughout the interface.