import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Zap,
  AlertTriangle,
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

interface AdvancedAnalyticsProps {
  wards: WardData[];
}

export default function AdvancedAnalytics({ wards }: AdvancedAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<
    "efficiency" | "performance" | "correlation" | "benchmarks"
  >("efficiency");

  // Calculate advanced metrics
  const advancedMetrics = useMemo(() => {
    if (wards.length === 0) return null;

    const totalDemandBefore = wards.reduce(
      (sum, w) => sum + w.before.demand,
      0
    );
    const totalDemandAfter = wards.reduce((sum, w) => sum + w.after.demand, 0);
    const totalShortageReduction = wards.reduce(
      (sum, w) => sum + (w.before.shortage - w.after.shortage),
      0
    );
    const avgPressureImprovement =
      wards.reduce(
        (sum, w) => sum + (w.after.pressure - w.before.pressure),
        0
      ) / wards.length;

    // Efficiency Score (0-100)
    const efficiencyScore = Math.min(
      100,
      Math.max(
        0,
        (totalShortageReduction /
          wards.reduce((sum, w) => sum + w.before.shortage, 0)) *
          100
      )
    );

    // ROI Calculation (simplified)
    const waterValue = 0.5; // $/LPS/day
    const dailySavings = totalShortageReduction * waterValue;
    const annualSavings = dailySavings * 365;

    return {
      totalDemandBefore,
      totalDemandAfter,
      totalShortageReduction,
      avgPressureImprovement,
      efficiencyScore,
      annualSavings,
      wardsImproved: wards.filter(w => w.after.shortage < w.before.shortage)
        .length,
      criticalWards: wards.filter(w => w.after.shortage_pct > 10).length,
    };
  }, [wards]);

  // Ward efficiency distribution
  const efficiencyData = useMemo(() => {
    if (wards.length === 0) return [];

    return wards
      .map(ward => {
        const shortageReduction =
          ward.before.shortage_pct - ward.after.shortage_pct;
        const pressureImprovement = ward.after.pressure - ward.before.pressure;
        const supplyIncrease = ward.after.supply - ward.before.supply;

        return {
          name:
            ward.name.substring(0, 15) + (ward.name.length > 15 ? "..." : ""),
          efficiency: shortageReduction,
          pressure: pressureImprovement,
          supply: supplyIncrease,
          original: ward,
        };
      })
      .sort((a, b) => b.efficiency - a.efficiency);
  }, [wards]);

  // Performance correlation data
  const correlationData = useMemo(() => {
    if (wards.length === 0) return [];

    return wards.map(ward => ({
      pressure: ward.after.pressure,
      shortage: ward.after.shortage_pct,
      supply: ward.after.supply,
      leakage: ward.after.leakage,
      demand: ward.after.demand,
      name: ward.name,
    }));
  }, [wards]);

  // Ward performance benchmarks
  const benchmarkData = useMemo(() => {
    if (wards.length === 0) return [];

    const sortedByEfficiency = [...wards].sort(
      (a, b) =>
        b.before.shortage_pct -
        b.after.shortage_pct -
        (a.before.shortage_pct - a.after.shortage_pct)
    );

    return [
      {
        category: "Top Performers",
        count: Math.ceil(wards.length * 0.2),
        fill: "#10b981",
      },
      {
        category: "Above Average",
        count: Math.ceil(wards.length * 0.3),
        fill: "#3b82f6",
      },
      {
        category: "Average",
        count: Math.ceil(wards.length * 0.3),
        fill: "#f59e0b",
      },
      {
        category: "Below Average",
        count: Math.floor(wards.length * 0.2),
        fill: "#ef4444",
      },
    ];
  }, [wards]);

  // Top and bottom performers
  const { topPerformers, bottomPerformers } = useMemo(() => {
    if (wards.length === 0) return { topPerformers: [], bottomPerformers: [] };

    const sorted = [...wards].sort(
      (a, b) =>
        b.before.shortage_pct -
        b.after.shortage_pct -
        (a.before.shortage_pct - a.after.shortage_pct)
    );

    return {
      topPerformers: sorted.slice(0, 5),
      bottomPerformers: sorted.slice(-5).reverse(),
    };
  }, [wards]);

  if (!advancedMetrics) return null;

  const tabButtons = [
    {
      id: "efficiency" as const,
      label: "Efficiency Analysis",
      icon: BarChart3,
    },
    {
      id: "performance" as const,
      label: "Performance Metrics",
      icon: Activity,
    },
    { id: "correlation" as const, label: "Correlation Analysis", icon: Target },
    { id: "benchmarks" as const, label: "Benchmarks", icon: Zap },
  ];

  return (
    <section
      id="advanced-analytics"
      className="py-20 md:py-32 bg-gradient-to-br from-slate-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
              Advanced Analytics Dashboard
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Deep insights into water network performance with predictive
              analytics and optimization recommendations
            </p>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Efficiency Score
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {advancedMetrics.efficiencyScore.toFixed(2)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Annual Savings
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    ${(advancedMetrics.annualSavings / 1000).toFixed(2)}K
                  </p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">
                    Wards Improved
                  </p>
                  <p className="text-3xl font-bold text-purple-900">
                    {advancedMetrics.wardsImproved}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">
                    Critical Wards
                  </p>
                  <p className="text-3xl font-bold text-red-900">
                    {advancedMetrics.criticalWards}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {tabButtons.map(tab => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  className={`flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === "efficiency" && (
            <div className="space-y-8">
              <Card className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  Ward Efficiency Ranking
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={efficiencyData.slice(0, 20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 11 }}
                      label={{
                        value: "Ward Names (Top 20 Performers)",
                        position: "insideBottom",
                        offset: -5,
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Shortage Reduction (%)",
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
                    />
                    <Bar dataKey="efficiency" radius={[4, 4, 0, 0]}>
                      {efficiencyData.slice(0, 20).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.efficiency > 5
                              ? "#10b981"
                              : entry.efficiency > 0
                                ? "#f59e0b"
                                : "#ef4444"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-6">
                  <h4 className="text-lg font-bold text-green-700 mb-4">
                    🏆 Top Performers
                  </h4>
                  <div className="space-y-3">
                    {topPerformers.map((ward, idx) => (
                      <div
                        key={ward.id}
                        className="flex justify-between items-center p-3 bg-green-50 rounded-lg"
                      >
                        <span className="font-medium text-slate-700">
                          {idx + 1}. {ward.name}
                        </span>
                        <span className="text-green-600 font-bold">
                          {(
                            ward.before.shortage_pct - ward.after.shortage_pct
                          ).toFixed(2)}
                          pp
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h4 className="text-lg font-bold text-red-700 mb-4">
                    ⚠️ Needs Attention
                  </h4>
                  <div className="space-y-3">
                    {bottomPerformers.map((ward, idx) => (
                      <div
                        key={ward.id}
                        className="flex justify-between items-center p-3 bg-red-50 rounded-lg"
                      >
                        <span className="font-medium text-slate-700">
                          {ward.name}
                        </span>
                        <span className="text-red-600 font-bold">
                          {(
                            ward.before.shortage_pct - ward.after.shortage_pct
                          ).toFixed(2)}
                          pp
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "performance" && (
            <div className="space-y-8">
              <Card className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  Performance Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart
                    data={benchmarkData}
                    innerRadius="20%"
                    outerRadius="80%"
                  >
                    <RadialBar dataKey="count" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                        color: "#f1f5f9",
                      }}
                      formatter={(value, name) => [`${value} Wards`, name]}
                    />
                    <Legend />
                  </RadialBarChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4">
                    Pressure Distribution
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={efficiencyData.slice(0, 10)}>
                      <Area dataKey="pressure" fill="#3b82f6" />
                      <XAxis dataKey="name" hide />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        label={{
                          value: "Pressure (m)",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fontSize: 10 },
                        }}
                      />
                      <Tooltip
                        formatter={value => [
                          `${value} m`,
                          "Pressure Improvement",
                        ]}
                        labelStyle={{ color: "#1e293b" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4">
                    Supply Improvement
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={efficiencyData.slice(0, 10)}>
                      <Area dataKey="supply" fill="#10b981" />
                      <XAxis dataKey="name" hide />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        label={{
                          value: "Supply (LPS)",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fontSize: 10 },
                        }}
                      />
                      <Tooltip
                        formatter={value => [
                          `${value} LPS`,
                          "Supply Improvement",
                        ]}
                        labelStyle={{ color: "#1e293b" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4">
                    Efficiency Trend
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={efficiencyData.slice(0, 10)}>
                      <Line
                        type="monotone"
                        dataKey="efficiency"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                      />
                      <XAxis dataKey="name" hide />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        label={{
                          value: "Efficiency Score",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fontSize: 10 },
                        }}
                      />
                      <Tooltip
                        formatter={value => [`${value}`, "Efficiency Score"]}
                        labelStyle={{ color: "#1e293b" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "correlation" && (
            <div className="space-y-8">
              <Card className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  Pressure vs Shortage Correlation
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart data={correlationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="pressure"
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Water Pressure (meters)",
                        position: "insideBottom",
                        offset: -10,
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <YAxis
                      dataKey="shortage"
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Water Shortage (%)",
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
                    />
                    <Scatter dataKey="shortage" fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4">
                    Supply vs Demand
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <ScatterChart data={correlationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="demand"
                        tick={{ fontSize: 11 }}
                        label={{
                          value: "Water Demand (LPS)",
                          position: "insideBottom",
                          offset: -5,
                          style: { textAnchor: "middle", fontSize: 11 },
                        }}
                      />
                      <YAxis
                        dataKey="supply"
                        tick={{ fontSize: 11 }}
                        label={{
                          value: "Water Supply (LPS)",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fontSize: 11 },
                        }}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          `${value} LPS`,
                          name === "supply" ? "Supply" : "Demand",
                        ]}
                      />
                      <Scatter dataKey="supply" fill="#10b981" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4">
                    Leakage Distribution
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Low Leakage (<1%)",
                            value: correlationData.filter(d => d.leakage < 1)
                              .length,
                          },
                          {
                            name: "Medium Leakage (1-2%)",
                            value: correlationData.filter(
                              d => d.leakage >= 1 && d.leakage < 2
                            ).length,
                          },
                          {
                            name: "High Leakage (>2%)",
                            value: correlationData.filter(d => d.leakage >= 2)
                              .length,
                          },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "benchmarks" && (
            <div className="space-y-8">
              <Card className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  Performance Benchmarks
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={benchmarkData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Performance Categories",
                        position: "insideBottom",
                        offset: -10,
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Number of Wards",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <Tooltip
                      formatter={(value, name) => [`${value} Wards`, "Count"]}
                      labelStyle={{ color: "#1e293b" }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {benchmarkData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 bg-green-50 border-green-200">
                  <h4 className="text-lg font-bold text-green-800 mb-2">
                    Excellence Standard
                  </h4>
                  <p className="text-3xl font-bold text-green-700">
                    {Math.ceil(wards.length * 0.2)}
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    Top 20% performers
                  </p>
                </Card>

                <Card className="p-6 bg-yellow-50 border-yellow-200">
                  <h4 className="text-lg font-bold text-yellow-800 mb-2">
                    Target Standard
                  </h4>
                  <p className="text-3xl font-bold text-yellow-700">
                    {Math.ceil(wards.length * 0.5)}
                  </p>
                  <p className="text-sm text-yellow-600 mt-2">
                    Above average performance
                  </p>
                </Card>

                <Card className="p-6 bg-red-50 border-red-200">
                  <h4 className="text-lg font-bold text-red-800 mb-2">
                    Improvement Needed
                  </h4>
                  <p className="text-3xl font-bold text-red-700">
                    {Math.floor(wards.length * 0.2)}
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    Requires immediate attention
                  </p>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
