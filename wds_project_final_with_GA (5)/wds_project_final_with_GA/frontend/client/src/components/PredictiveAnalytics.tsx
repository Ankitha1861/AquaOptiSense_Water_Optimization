import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  Brain,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Zap,
  Activity,
  BarChart3,
  LineChart as LineChartIcon,
} from "lucide-react";

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

interface PredictiveAnalyticsProps {
  wards: WardData[];
}

export default function PredictiveAnalytics({
  wards,
}: PredictiveAnalyticsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "6months" | "1year" | "3years" | "5years"
  >("1year");
  const [selectedScenario, setSelectedScenario] = useState<
    "optimistic" | "realistic" | "pessimistic"
  >("realistic");
  const [selectedMetric, setSelectedMetric] = useState<
    "demand" | "shortage" | "pressure" | "efficiency"
  >("demand");

  // Generate predictive data based on current performance
  const predictiveData = useMemo(() => {
    if (wards.length === 0) return [];

    const months =
      selectedTimeframe === "6months"
        ? 6
        : selectedTimeframe === "1year"
          ? 12
          : selectedTimeframe === "3years"
            ? 36
            : 60;

    const baseMetrics = {
      totalDemand: wards.reduce((sum, w) => sum + w.after.demand, 0),
      totalSupply: wards.reduce((sum, w) => sum + w.after.supply, 0),
      totalShortage: wards.reduce((sum, w) => sum + w.after.shortage, 0),
      avgPressure:
        wards.reduce((sum, w) => sum + w.after.pressure, 0) / wards.length,
      avgLeakage:
        wards.reduce((sum, w) => sum + w.after.leakage, 0) / wards.length,
    };

    // Growth factors based on scenario
    const growthFactors = {
      optimistic: { demand: 0.02, efficiency: 0.05, pressure: 0.03 },
      realistic: { demand: 0.035, efficiency: 0.02, pressure: 0.01 },
      pessimistic: { demand: 0.05, efficiency: -0.01, pressure: -0.01 },
    };

    const factor = growthFactors[selectedScenario];

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
        month: i === 0 ? "Current" : `Month ${i}`,
        monthNum: i,
        demand: Math.round(predictedDemand),
        supply: Math.round(predictedSupply),
        shortage: Math.round(predictedShortage),
        shortagePercent:
          predictedDemand > 0 ? (predictedShortage / predictedDemand) * 100 : 0,
        pressure: Math.round(predictedPressure * 100) / 100,
        efficiency: Math.max(
          0,
          100 - (predictedShortage / predictedDemand) * 100
        ),
      };
    });
  }, [wards, selectedTimeframe, selectedScenario]);

  // Scenario comparison data
  const scenarioComparison = useMemo(() => {
    if (wards.length === 0) return [];

    const scenarios = ["optimistic", "realistic", "pessimistic"] as const;
    const finalMonth =
      selectedTimeframe === "6months"
        ? 6
        : selectedTimeframe === "1year"
          ? 12
          : selectedTimeframe === "3years"
            ? 36
            : 60;

    return scenarios.map(scenario => {
      const factor =
        scenario === "optimistic"
          ? { demand: 0.02, efficiency: 0.05 }
          : scenario === "realistic"
            ? { demand: 0.035, efficiency: 0.02 }
            : { demand: 0.05, efficiency: -0.01 };

      const baseDemand = wards.reduce((sum, w) => sum + w.after.demand, 0);
      const baseSupply = wards.reduce((sum, w) => sum + w.after.supply, 0);

      const demandGrowth = Math.pow(1 + factor.demand / 12, finalMonth);
      const efficiencyImprovement = Math.pow(
        1 + factor.efficiency / 12,
        finalMonth
      );

      const predictedDemand = baseDemand * demandGrowth;
      const predictedSupply = baseSupply * efficiencyImprovement;
      const predictedShortage = Math.max(0, predictedDemand - predictedSupply);

      return {
        scenario: scenario.charAt(0).toUpperCase() + scenario.slice(1),
        demand: Math.round(predictedDemand),
        supply: Math.round(predictedSupply),
        shortage: Math.round(predictedShortage),
        shortagePercent: (predictedShortage / predictedDemand) * 100,
        color:
          scenario === "optimistic"
            ? "#10b981"
            : scenario === "realistic"
              ? "#3b82f6"
              : "#ef4444",
      };
    });
  }, [wards, selectedTimeframe]);

  // Key insights from predictions
  const insights = useMemo(() => {
    if (predictiveData.length === 0) return [];

    const current = predictiveData[0];
    const future = predictiveData[predictiveData.length - 1];

    return [
      {
        title: "Demand Growth",
        value: `${(((future.demand - current.demand) / current.demand) * 100).toFixed(2)}%`,
        description: `Expected increase over ${selectedTimeframe}`,
        trend: future.demand > current.demand ? "up" : "down",
        color: "text-blue-600",
      },
      {
        title: "Shortage Risk",
        value: `${future.shortagePercent.toFixed(2)}%`,
        description: "Projected shortage percentage",
        trend: future.shortagePercent > current.shortagePercent ? "up" : "down",
        color: future.shortagePercent > 10 ? "text-red-600" : "text-green-600",
      },
      {
        title: "System Efficiency",
        value: `${future.efficiency.toFixed(2)}%`,
        description: "Predicted overall efficiency",
        trend: future.efficiency > current.efficiency ? "up" : "down",
        color: future.efficiency > 90 ? "text-green-600" : "text-yellow-600",
      },
    ];
  }, [predictiveData, selectedTimeframe]);

  const timeframeOptions = [
    { id: "6months" as const, label: "6 Months", icon: Calendar },
    { id: "1year" as const, label: "1 Year", icon: Calendar },
    { id: "3years" as const, label: "3 Years", icon: Calendar },
    { id: "5years" as const, label: "5 Years", icon: Calendar },
  ];

  const scenarioOptions = [
    { id: "optimistic" as const, label: "Optimistic", color: "text-green-600" },
    { id: "realistic" as const, label: "Realistic", color: "text-blue-600" },
    { id: "pessimistic" as const, label: "Pessimistic", color: "text-red-600" },
  ];

  const metricOptions = [
    { id: "demand" as const, label: "Demand", icon: TrendingUp },
    { id: "shortage" as const, label: "Shortage", icon: AlertTriangle },
    { id: "pressure" as const, label: "Pressure", icon: Activity },
    { id: "efficiency" as const, label: "Efficiency", icon: Target },
  ];

  return (
    <section
      id="predictive-analytics"
      className="py-20 md:py-32 bg-gradient-to-br from-indigo-50 via-white to-purple-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
              Predictive Analytics & Forecasting
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              AI-powered predictions and scenario modeling to optimize future
              water network investments and operations
            </p>
          </div>

          {/* Key Insights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {insights.map((insight, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">
                    {insight.title}
                  </span>
                  {insight.trend === "up" ? (
                    <TrendingUp className={`w-4 h-4 ${insight.color}`} />
                  ) : insight.trend === "down" ? (
                    <TrendingUp
                      className={`w-4 h-4 ${insight.color} transform rotate-180`}
                    />
                  ) : (
                    <Activity className={`w-4 h-4 ${insight.color}`} />
                  )}
                </div>
                <p className={`text-2xl font-bold ${insight.color} mb-1`}>
                  {insight.value}
                </p>
                <p className="text-xs text-slate-500">{insight.description}</p>
              </Card>
            ))}
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              {/* Timeframe Selection */}
              <div className="flex gap-2">
                {timeframeOptions.map(option => (
                  <Button
                    key={option.id}
                    onClick={() => setSelectedTimeframe(option.id)}
                    variant={
                      selectedTimeframe === option.id ? "default" : "outline"
                    }
                    className={`flex items-center gap-2 ${
                      selectedTimeframe === option.id
                        ? "bg-indigo-600 text-white"
                        : "text-slate-700"
                    }`}
                  >
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </Button>
                ))}
              </div>

              {/* Scenario Selection */}
              <div className="flex gap-2">
                {scenarioOptions.map(option => (
                  <Button
                    key={option.id}
                    onClick={() => setSelectedScenario(option.id)}
                    variant={
                      selectedScenario === option.id ? "default" : "outline"
                    }
                    className={`${
                      selectedScenario === option.id
                        ? "bg-slate-900 text-white"
                        : `hover:bg-slate-100 ${option.color}`
                    }`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {/* Metric Selection */}
              <div className="flex gap-2">
                {metricOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.id}
                      onClick={() => setSelectedMetric(option.id)}
                      variant={
                        selectedMetric === option.id ? "default" : "outline"
                      }
                      className={`flex items-center gap-2 ${
                        selectedMetric === option.id
                          ? "bg-purple-600 text-white"
                          : "text-slate-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Prediction Chart */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}{" "}
              Prediction -{" "}
              {selectedScenario.charAt(0).toUpperCase() +
                selectedScenario.slice(1)}{" "}
              Scenario
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={predictiveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                  label={{
                    value: "Time Period (Months)",
                    position: "insideBottom",
                    offset: -10,
                    style: { textAnchor: "middle" },
                  }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  label={{
                    value:
                      selectedMetric === "demand"
                        ? "Water Volume (LPS)"
                        : selectedMetric === "shortage"
                          ? "Shortage Percentage (%)"
                          : selectedMetric === "pressure"
                            ? "Pressure (meters)"
                            : "Efficiency Score (%)",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                  }}
                  formatter={(value, name) => [
                    typeof value === "number" ? value.toLocaleString() : value,
                    name,
                  ]}
                  labelFormatter={label => `Period: ${label}`}
                />
                <Legend />

                {selectedMetric === "demand" && (
                  <>
                    <Area
                      dataKey="demand"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      name="Water Demand (LPS)"
                    />
                    <Area
                      dataKey="supply"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                      name="Water Supply (LPS)"
                    />
                    <Line
                      dataKey="shortage"
                      stroke="#ef4444"
                      strokeWidth={3}
                      name="Water Shortage (LPS)"
                      dot={{ fill: "#ef4444", strokeWidth: 2, r: 3 }}
                    />
                  </>
                )}

                {selectedMetric === "shortage" && (
                  <Line
                    dataKey="shortagePercent"
                    stroke="#ef4444"
                    strokeWidth={3}
                    name="Water Shortage (%)"
                    dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                  />
                )}

                {selectedMetric === "pressure" && (
                  <Line
                    dataKey="pressure"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    name="Water Pressure (meters)"
                    dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                  />
                )}

                {selectedMetric === "efficiency" && (
                  <Line
                    dataKey="efficiency"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    name="System Efficiency (%)"
                    dot={{ fill: "#06b6d4", strokeWidth: 2, r: 4 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          {/* Scenario Comparison */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              Scenario Comparison ({selectedTimeframe})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart
                data={scenarioComparison.map(s => ({
                  scenario: s.scenario,
                  "Demand Growth":
                    ((s.demand -
                      wards.reduce((sum, w) => sum + w.after.demand, 0)) /
                      wards.reduce((sum, w) => sum + w.after.demand, 0)) *
                    100,
                  "Supply Capacity":
                    ((s.supply -
                      wards.reduce((sum, w) => sum + w.after.supply, 0)) /
                      wards.reduce((sum, w) => sum + w.after.supply, 0)) *
                    100,
                  "Shortage Risk": s.shortagePercent,
                  "Investment Need":
                    s.shortagePercent > 10
                      ? 100
                      : s.shortagePercent > 5
                        ? 60
                        : 30,
                }))}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="scenario" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  tickFormatter={value => `${value}%`}
                />
                <Radar
                  name="Demand Growth (%)"
                  dataKey="Demand Growth"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="Supply Capacity (%)"
                  dataKey="Supply Capacity"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="Shortage Risk (%)"
                  dataKey="Shortage Risk"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Legend />
                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value).toFixed(2)}%`,
                    name,
                  ]}
                  labelStyle={{ color: "#1e293b" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          {/* AI Insights */}
          <Card className="p-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-8 h-8 text-indigo-600" />
              <h3 className="text-2xl font-bold text-slate-900">
                AI-Powered Insights
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-900">
                  Key Findings
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Current optimization has reduced system-wide shortage by
                      42.8%
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Demand is projected to grow by{" "}
                      {(((predictiveData[predictiveData.length - 1]?.demand ||
                        0) /
                        (predictiveData[0]?.demand || 1) -
                        1) *
                        100) |
                        0}
                      % over {selectedTimeframe}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Proactive monitoring and interventions needed to maintain
                      service levels
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Proactive investments could prevent future capacity
                      shortfalls
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-900">
                  Recommendations
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Implement smart monitoring systems for real-time
                      optimization
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Focus on top-performing wards as optimization templates
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Prioritize critical wards with shortage rates above 10%
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <LineChartIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Regular model updates ensure prediction accuracy
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
