import express from 'express';
import { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface WardData {
  id: string;
  name: string;
  before: {
    pressure: number;
    demand: number;
    supply: number;
    shortage: number;
    shortage_pct: number;
    leakage: number;
  };
  after: {
    pressure: number;
    demand: number;
    supply: number;
    shortage: number;
    shortage_pct: number;
    leakage: number;
  };
  explanation: string;
}

interface AnalyticsData {
  wards: WardData[];
  systemMetrics: {
    totalWards: number;
    totalDemand: number;
    totalSupply: number;
    totalShortage: number;
    avgPressure: number;
    avgLeakage: number;
    improvementRate: number;
  };
  performance: {
    topPerformers: WardData[];
    criticalWards: WardData[];
    improvementCategories: {
      high: number;
      moderate: number;
      low: number;
    };
  };
}

export class AnalyticsService {
  private wardsData: WardData[] = [];
  private lastUpdated: Date = new Date();

  constructor() {
    this.loadWardsData();
  }

  private async loadWardsData(): Promise<void> {
    try {
      const dataPath = path.resolve(__dirname, '..', 'client', 'public', 'ward-data.json');
      const rawData = await fs.readFile(dataPath, 'utf-8');
      this.wardsData = JSON.parse(rawData);
      this.lastUpdated = new Date();
      console.log(`Loaded ${this.wardsData.length} wards data successfully`);
    } catch (error) {
      console.error('Error loading wards data:', error);
      this.wardsData = [];
    }
  }

  // Get comprehensive analytics data
  getAnalyticsData(): AnalyticsData {
    const systemMetrics = this.calculateSystemMetrics();
    const performance = this.calculatePerformanceMetrics();

    return {
      wards: this.wardsData,
      systemMetrics,
      performance,
    };
  }

  // Calculate system-wide metrics
  private calculateSystemMetrics() {
    if (this.wardsData.length === 0) {
      return {
        totalWards: 0,
        totalDemand: 0,
        totalSupply: 0,
        totalShortage: 0,
        avgPressure: 0,
        avgLeakage: 0,
        improvementRate: 0,
      };
    }

    const totalDemand = this.wardsData.reduce((sum, w) => sum + w.after.demand, 0);
    const totalSupply = this.wardsData.reduce((sum, w) => sum + w.after.supply, 0);
    const totalShortage = this.wardsData.reduce((sum, w) => sum + w.after.shortage, 0);
    const avgPressure = this.wardsData.reduce((sum, w) => sum + w.after.pressure, 0) / this.wardsData.length;
    const avgLeakage = this.wardsData.reduce((sum, w) => sum + w.after.leakage, 0) / this.wardsData.length;

    const improvedWards = this.wardsData.filter(w => w.after.shortage_pct < w.before.shortage_pct).length;
    const improvementRate = (improvedWards / this.wardsData.length) * 100;

    return {
      totalWards: this.wardsData.length,
      totalDemand: Math.round(totalDemand),
      totalSupply: Math.round(totalSupply),
      totalShortage: Math.round(totalShortage),
      avgPressure: Math.round(avgPressure * 100) / 100,
      avgLeakage: Math.round(avgLeakage * 100) / 100,
      improvementRate: Math.round(improvementRate * 100) / 100,
    };
  }

  // Calculate performance metrics
  private calculatePerformanceMetrics() {
    if (this.wardsData.length === 0) {
      return {
        topPerformers: [],
        criticalWards: [],
        improvementCategories: { high: 0, moderate: 0, low: 0 },
      };
    }

    // Sort by improvement in shortage percentage
    const sortedByImprovement = [...this.wardsData].sort((a, b) =>
      (b.before.shortage_pct - b.after.shortage_pct) - (a.before.shortage_pct - a.after.shortage_pct)
    );

    const topPerformers = sortedByImprovement.slice(0, 10);
    const criticalWards = this.wardsData.filter(w => w.after.shortage_pct > 10);

    // Categorize improvements
    const improvementCategories = {
      high: this.wardsData.filter(w => (w.before.shortage_pct - w.after.shortage_pct) > 5).length,
      moderate: this.wardsData.filter(w => {
        const improvement = w.before.shortage_pct - w.after.shortage_pct;
        return improvement > 0 && improvement <= 5;
      }).length,
      low: this.wardsData.filter(w => (w.before.shortage_pct - w.after.shortage_pct) <= 0).length,
    };

    return {
      topPerformers,
      criticalWards,
      improvementCategories,
    };
  }

  // Get predictive analytics data
  getPredictiveData(timeframe: string = '1year', scenario: string = 'realistic') {
    if (this.wardsData.length === 0) return [];

    const months = timeframe === '6months' ? 6 :
                   timeframe === '1year' ? 12 :
                   timeframe === '3years' ? 36 : 60;

    const baseMetrics = this.calculateSystemMetrics();

    // Growth factors based on scenario
    const growthFactors = {
      optimistic: { demand: 0.02, efficiency: 0.05, pressure: 0.03 },
      realistic: { demand: 0.035, efficiency: 0.02, pressure: 0.01 },
      pessimistic: { demand: 0.05, efficiency: -0.01, pressure: -0.01 },
    } as const;

    const factor = growthFactors[scenario as keyof typeof growthFactors] || growthFactors.realistic;

    return Array.from({ length: months + 1 }, (_, i) => {
      const month = i;
      const demandGrowth = Math.pow(1 + factor.demand / 12, month);
      const efficiencyImprovement = Math.pow(1 + factor.efficiency / 12, month);
      const pressureChange = Math.pow(1 + factor.pressure / 12, month);

      const predictedDemand = baseMetrics.totalDemand * demandGrowth;
      const predictedSupply = baseMetrics.totalSupply * efficiencyImprovement;
      const predictedShortage = Math.max(0, predictedDemand - predictedSupply);
      const predictedPressure = baseMetrics.avgPressure * pressureChange;

      return {
        month: i === 0 ? 'Current' : `Month ${i}`,
        monthNum: i,
        demand: Math.round(predictedDemand),
        supply: Math.round(predictedSupply),
        shortage: Math.round(predictedShortage),
        shortagePercent: predictedDemand > 0 ? (predictedShortage / predictedDemand) * 100 : 0,
        pressure: Math.round(predictedPressure * 100) / 100,
        efficiency: Math.max(0, 100 - (predictedShortage / predictedDemand) * 100),
        scenario,
        timeframe,
      };
    });
  }

  // Get ward efficiency rankings
  getWardEfficiencyRankings() {
    if (this.wardsData.length === 0) return [];

    return this.wardsData.map(ward => {
      const shortageReduction = ward.before.shortage_pct - ward.after.shortage_pct;
      const pressureImprovement = ward.after.pressure - ward.before.pressure;
      const supplyIncrease = ward.after.supply - ward.before.supply;
      const leakageReduction = ward.before.leakage - ward.after.leakage;

      // Calculate efficiency score (weighted)
      const efficiencyScore = (shortageReduction * 10) + (pressureImprovement * 2) +
                             (supplyIncrease * 0.01) + (leakageReduction * 5);

      return {
        id: ward.id,
        name: ward.name,
        shortageReduction,
        pressureImprovement,
        supplyIncrease,
        leakageReduction,
        efficiencyScore: Math.round(efficiencyScore * 100) / 100,
        rank: 0, // Will be set after sorting
        category: efficiencyScore > 50 ? 'excellent' :
                  efficiencyScore > 25 ? 'good' :
                  efficiencyScore > 0 ? 'fair' : 'needs_improvement',
      };
    }).sort((a, b) => b.efficiencyScore - a.efficiencyScore)
      .map((ward, index) => ({ ...ward, rank: index + 1 }));
  }

  // Get correlation analysis
  getCorrelationAnalysis() {
    if (this.wardsData.length === 0) return {};

    const data = this.wardsData.map(w => ({
      pressure: w.after.pressure,
      shortage: w.after.shortage_pct,
      supply: w.after.supply,
      demand: w.after.demand,
      leakage: w.after.leakage,
    }));

    // Simple correlation calculations
    const correlations = {
      pressureVsShortage: this.calculateCorrelation(
        data.map(d => d.pressure),
        data.map(d => d.shortage)
      ),
      supplyVsDemand: this.calculateCorrelation(
        data.map(d => d.supply),
        data.map(d => d.demand)
      ),
      pressureVsLeakage: this.calculateCorrelation(
        data.map(d => d.pressure),
        data.map(d => d.leakage)
      ),
    };

    return {
      correlations,
      data,
      insights: this.generateCorrelationInsights(correlations),
    };
  }

  // Calculate Pearson correlation coefficient
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
    const sumXX = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);
    const sumYY = y.map(yi => yi * yi).reduce((a, b) => a + b, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 1000;
  }

  // Generate insights from correlation analysis
  private generateCorrelationInsights(correlations: any) {
    const insights = [];

    if (correlations.pressureVsShortage < -0.5) {
      insights.push('Strong negative correlation between pressure and shortage - higher pressure reduces water shortage');
    }
    if (correlations.supplyVsDemand > 0.7) {
      insights.push('Strong positive correlation between supply and demand - supply effectively matches demand patterns');
    }
    if (Math.abs(correlations.pressureVsLeakage) > 0.4) {
      insights.push('Significant correlation between pressure and leakage - pressure management affects leak rates');
    }

    return insights;
  }

  // Get data freshness info
  getDataInfo() {
    return {
      lastUpdated: this.lastUpdated.toISOString(),
      totalWards: this.wardsData.length,
      dataSource: 'ward-data.json',
      version: '1.0.0',
    };
  }
}

// Create analytics router
export function createAnalyticsRouter(): express.Router {
  const router = express.Router();
  const analyticsService = new AnalyticsService();

  // Enable CORS for all analytics routes
  router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
  });

  // Get comprehensive analytics data
  router.get('/analytics', (req: Request, res: Response) => {
    try {
      const data = analyticsService.getAnalyticsData();
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get predictive analytics
  router.get('/analytics/predictions', (req: Request, res: Response) => {
    try {
      const { timeframe = '1year', scenario = 'realistic' } = req.query;
      const data = analyticsService.getPredictiveData(
        timeframe as string,
        scenario as string
      );
      res.json({
        success: true,
        data,
        parameters: { timeframe, scenario },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Predictions error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get ward efficiency rankings
  router.get('/analytics/efficiency', (req: Request, res: Response) => {
    try {
      const data = analyticsService.getWardEfficiencyRankings();
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Efficiency error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get correlation analysis
  router.get('/analytics/correlations', (req: Request, res: Response) => {
    try {
      const data = analyticsService.getCorrelationAnalysis();
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Correlation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get specific ward data
  router.get('/analytics/ward/:wardId', (req: Request, res: Response) => {
    try {
      const { wardId } = req.params;
      const data = analyticsService.getAnalyticsData();
      const ward = data.wards.find(w => w.id === wardId || w.name.toLowerCase() === wardId.toLowerCase());

      if (!ward) {
        return res.status(404).json({
          success: false,
          error: 'Ward not found',
          message: `Ward with ID "${wardId}" not found`,
        });
      }

      res.json({
        success: true,
        data: ward,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Ward data error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get system health metrics
  router.get('/analytics/health', (req: Request, res: Response) => {
    try {
      const data = analyticsService.getAnalyticsData();
      const health = {
        systemStatus: 'operational',
        criticalWardsCount: data.performance.criticalWards.length,
        improvementRate: data.systemMetrics.improvementRate,
        avgPressure: data.systemMetrics.avgPressure,
        totalShortagePercent: (data.systemMetrics.totalShortage / data.systemMetrics.totalDemand) * 100,
        recommendedActions: data.performance.criticalWards.length > 20 ?
          ['Immediate intervention needed for critical wards', 'Review supply capacity'] :
          ['Monitor performance trends', 'Continue optimization efforts'],
      };

      res.json({
        success: true,
        data: health,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Health metrics error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get data info
  router.get('/analytics/info', (req: Request, res: Response) => {
    try {
      const info = analyticsService.getDataInfo();
      res.json({
        success: true,
        data: info,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Data info error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
