import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import WardMap from "@/components/WardMap";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import EnhancedWardMap from "@/components/EnhancedWardMap";
import VisibleWardMap from "@/components/VisibleWardMap";
import ImprovedWardMap from "@/components/ImprovedWardMap";
import WardPerformanceSection from "@/components/WardPerformanceSection";
import PredictiveAnalytics from "@/components/PredictiveAnalytics";
import DataExport from "@/components/DataExport";
import { TrendingUp, Droplet, Zap, MapPin, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// Types
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

// Data for system-wide visualizations
const shortageData = [
  { name: "Before", value: 39839, fill: "#ef4444" },
  { name: "After", value: 22777, fill: "#10b981" },
];

const comparisonData = [
  {
    metric: "Demand (LPS)",
    before: 355959,
    after: 355959,
    improvement: "0%",
  },
  {
    metric: "Supply (LPS)",
    before: 316120,
    after: 333182,
    improvement: "5.4%",
  },
  {
    metric: "Shortage (LPS)",
    before: 39839,
    after: 22777,
    improvement: "42.8%",
  },
  {
    metric: "Supply/Demand Ratio (%)",
    before: 88.8,
    after: 93.6,
    improvement: "5.4%",
  },
  {
    metric: "Pressure (m)",
    before: 52.8,
    after: 55.9,
    improvement: "5.9%",
  },
  {
    metric: "Leakage (%)",
    before: 1.4,
    after: 1.28,
    improvement: "8.6%",
  },
];

const systemMetrics = [
  {
    label: "Total Wards",
    value: "198",
    icon: MapPin,
    color: "from-blue-500 to-blue-600",
  },
  {
    label: "System Demand",
    value: "355,959 LPS",
    icon: Droplet,
    color: "from-cyan-500 to-cyan-600",
  },
  {
    label: "Total Supply (After)",
    value: "333,182 LPS",
    icon: Droplet,
    color: "from-blue-500 to-blue-600",
  },
  {
    label: "Demand vs Supply Gap",
    value: "22,777 LPS",
    icon: TrendingUp,
    color: "from-red-500 to-red-600",
  },
  {
    label: "Shortage Reduction",
    value: "42.8%",
    icon: TrendingUp,
    color: "from-green-500 to-green-600",
  },
  {
    label: "Supply Improvement",
    value: "17,062 LPS",
    icon: Zap,
    color: "from-orange-500 to-orange-600",
  },
];

const detailedMetrics = [
  {
    title: "System Demand",
    before: "355,959 LPS",
    after: "355,959 LPS",
    change: "Constant",
    percentage: "0%",
    description: "Total water demand across all 198 wards remains consistent",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  {
    title: "System Supply",
    before: "316,120 LPS",
    after: "333,182 LPS",
    increase: "17,062 LPS",
    percentage: "5.4%",
    description: "Enhanced water availability through network optimization",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "Demand vs Supply Gap",
    before: "39,839 LPS (88.8%)",
    after: "22,777 LPS (93.6%)",
    reduction: "17,062 LPS",
    percentage: "42.8%",
    description: "Supply now meets 93.6% of demand, up from 88.8%",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Water Shortage",
    before: "39,839 LPS",
    after: "22,777 LPS",
    reduction: "17,062 LPS",
    percentage: "42.8%",
    description: "Significant reduction in water deficit across the network",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    title: "Average Pressure",
    before: "52.8 m",
    after: "55.9 m",
    increase: "3.1 m",
    percentage: "5.9%",
    description: "Improved pressure stability for better service delivery",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    title: "Leakage Rate",
    before: "1.40%",
    after: "1.28%",
    reduction: "0.12 pp",
    percentage: "8.6%",
    description: "Reduced non-revenue water through leak detection",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

export default function Home() {
  const [wards, setWards] = useState<WardData[]>([]);
  const [selectedWard, setSelectedWard] = useState<WardData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate improvement categories for the new Pie Chart
  const improvementCategories = {
    high: wards.filter(w => w.before.shortage_pct - w.after.shortage_pct > 5)
      .length,
    moderate: wards.filter(
      w =>
        w.before.shortage_pct - w.after.shortage_pct > 0 &&
        w.before.shortage_pct - w.after.shortage_pct <= 5
    ).length,
    low: wards.filter(w => w.before.shortage_pct - w.after.shortage_pct <= 0)
      .length,
  };

  const improvementData = [
    {
      name: "High Improvement (>5pp)",
      value: improvementCategories.high,
      fill: "#10b981",
    },
    {
      name: "Moderate Improvement (0-5pp)",
      value: improvementCategories.moderate,
      fill: "#fcd34d",
    },
    {
      name: "Low/No Improvement (<=0pp)",
      value: improvementCategories.low,
      fill: "#ef4444",
    },
  ];

  useEffect(() => {
    // Load ward data from JSON file
    fetch("/ward-data.json")
      .then(res => res.json())
      .then(data => {
        setWards(data);
        if (data.length > 0) {
          setSelectedWard(data[0]);
        }
      })
      .catch(err => console.error("Error loading ward data:", err));
  }, []);

  const filteredWards = wards.filter(ward =>
    ward.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWardSelect = (ward: WardData) => {
    setSelectedWard(ward);
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  // Prepare ward comparison data for radar chart
  const wardComparisonData = selectedWard
    ? [
        {
          metric: "Pressure",
          before: selectedWard.before.pressure,
          after: selectedWard.after.pressure,
          fullMark:
            Math.max(
              selectedWard.before.pressure,
              selectedWard.after.pressure
            ) * 1.2,
        },
        {
          metric: "Supply (×100)",
          before: selectedWard.before.supply / 100,
          after: selectedWard.after.supply / 100,
          fullMark:
            (Math.max(selectedWard.before.supply, selectedWard.after.supply) /
              100) *
            1.2,
        },
        {
          metric: "Shortage",
          before: selectedWard.before.shortage,
          after: selectedWard.after.shortage,
          fullMark:
            Math.max(
              selectedWard.before.shortage,
              selectedWard.after.shortage
            ) * 1.2,
        },
        {
          metric: "Leakage %",
          before: selectedWard.before.leakage,
          after: selectedWard.after.leakage,
          fullMark:
            Math.max(selectedWard.before.leakage, selectedWard.after.leakage) *
            1.2,
        },
      ]
    : [];

  // Prepare ward metrics for bar chart
  const wardMetricsData = selectedWard
    ? [
        {
          name: "Pressure (m)",
          before: selectedWard.before.pressure,
          after: selectedWard.after.pressure,
        },
        {
          name: "Supply (LPS)",
          before: selectedWard.before.supply,
          after: selectedWard.after.supply,
        },
        {
          name: "Shortage (LPS)",
          before: selectedWard.before.shortage,
          after: selectedWard.after.shortage,
        },
        {
          name: "Leakage %",
          before: selectedWard.before.leakage,
          after: selectedWard.after.leakage,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <Droplet className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">
              AquaOptiSense
            </span>
          </div>
          <div className="hidden md:flex gap-8">
            <a
              href="#results"
              onClick={e => {
                e.preventDefault();
                document
                  .getElementById("results")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Results
            </a>
            <a
              href="#ward-performance"
              onClick={e => {
                e.preventDefault();
                document
                  .getElementById("ward-performance")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Ward Map
            </a>
            <a
              href="#improved-ward-map"
              onClick={e => {
                e.preventDefault();
                document
                  .getElementById("improved-ward-map")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Ward Analysis
            </a>
            <a
              href="#advanced-analytics"
              onClick={e => {
                e.preventDefault();
                document
                  .getElementById("advanced-analytics")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Analytics
            </a>
            <a
              href="#predictive-analytics"
              onClick={e => {
                e.preventDefault();
                document
                  .getElementById("predictive-analytics")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Predictions
            </a>
            <a
              href="#data-export"
              onClick={e => {
                e.preventDefault();
                document
                  .getElementById("data-export")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Export Data
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                   Bangalore Water Distribution System {" "}
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Using Genetic Algorithm And Epanet Simulation
                  </span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Transform urban water management through advanced network
                  optimization. Reduce shortages by 42.8%, improve supply
                  reliability, and minimize non-revenue water losses.
                </p>
              </div>
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-slate-900">198</div>
                  <div className="text-sm text-slate-600">Wards Analyzed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">42.8%</div>
                  <div className="text-sm text-slate-600">
                    Shortage Reduction
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">356K</div>
                  <div className="text-sm text-slate-600">LPS Demand</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">333K</div>
                  <div className="text-sm text-slate-600">LPS Supply</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">93.6%</div>
                  <div className="text-sm text-slate-600">Supply/Demand</div>
                </div>
              </div>
            </div>
            <div className="relative h-96 md:h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
                <div className="space-y-6">
                  <div className="h-48 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                      <p className="text-slate-600 font-semibold">
                        System Performance Dashboard
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="text-2xl font-bold text-green-600">
                        ↓ 42.8%
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Shortage Reduced
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">
                        ↑ 5.4%
                      </div>
                      <p className="text-xs text-blue-700 mt-1">
                        Supply Increased
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 md:py-32 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">The Challenge</h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Urban water distribution networks face critical challenges that
                impact millions of people
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Water Shortage Crisis",
                  description:
                    "Over 39,839 LPS of water demand goes unmet daily, affecting service delivery across multiple wards.",
                  icon: "💧",
                },
                {
                  title: "Non-Revenue Water Loss",
                  description:
                    "1.4% average leakage rate represents significant water loss and operational inefficiency.",
                  icon: "🔴",
                },
                {
                  title: "Pressure Inconsistency",
                  description:
                    "Low average pressure (52.8m) leads to service reliability issues and customer dissatisfaction.",
                  icon: "📉",
                },
              ].map((item, idx) => (
                <Card
                  key={idx}
                  className="bg-slate-800 border-slate-700 p-8 hover:border-slate-600 transition"
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
                Our Solution
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Advanced network optimization powered by data analytics and
                machine learning
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {systemMetrics.map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <Card
                    key={idx}
                    className="p-8 hover:shadow-lg transition border-slate-200"
                  >
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center mb-4`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-600 mb-2">
                      {metric.label}
                    </h3>
                    <p className="text-3xl font-bold text-slate-900">
                      {metric.value}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section id="results" className="py-20 md:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
                Proven Results
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Measurable improvements across all critical water distribution
                metrics
              </p>
            </div>

            {/* Main Comparison Chart */}
            <Card className="p-8 border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">
                Before & After Comparison
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="metric"
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Performance Metrics",
                      position: "insideBottom",
                      offset: -10,
                      fill: "#64748b",
                      style: { textAnchor: "middle" },
                    }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Performance Values",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#64748b",
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
                  <Legend />
                  <Bar
                    dataKey="before"
                    fill="#ef4444"
                    name="Before Optimization"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="after"
                    fill="#10b981"
                    name="After Optimization"
                    radius={[8, 8, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            {/* Detailed Metrics Cards */}
            <div className="grid md:grid-cols-2 gap-8">
              {detailedMetrics.map((metric, idx) => (
                <Card
                  key={idx}
                  className={`p-8 border-l-4 border-l-slate-300 ${metric.bgColor}`}
                >
                  <h3 className={`text-2xl font-bold ${metric.color} mb-4`}>
                    {metric.title}
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Before</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {metric.before}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">After</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {metric.after}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Improvement
                        </span>
                        <span className={`text-lg font-bold ${metric.color}`}>
                          {metric.percentage}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {metric.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Shortage Reduction Visual */}
            <Card className="p-8 border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">
                Water Shortage Reduction
              </h3>
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={shortageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fontSize: 12 }}
                        label={{
                          value: "Optimization Status",
                          position: "insideBottom",
                          offset: -10,
                          fill: "#64748b",
                          style: { textAnchor: "middle" },
                        }}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 12 }}
                        label={{
                          value: "Water Shortage (LPS)",
                          angle: -90,
                          position: "insideLeft",
                          fill: "#64748b",
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
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {shortageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center space-y-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-2">
                      Total Reduction
                    </p>
                    <p className="text-4xl font-bold text-green-600">
                      17,062 LPS
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-2">
                      Percentage Improvement
                    </p>
                    <p className="text-4xl font-bold text-green-600">42.8%</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-700">
                      This represents a significant improvement in water
                      availability across the network, directly improving
                      service delivery to 198 wards.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Demand vs Supply Comparison */}
            <Card className="p-8 border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">
                Demand vs Supply Analysis
              </h3>
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          name: "Before",
                          Demand: 355959,
                          Supply: 316120,
                          Gap: 39839,
                        },
                        {
                          name: "After",
                          Demand: 355959,
                          Supply: 333182,
                          Gap: 22777,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 12 }}
                        label={{
                          value: "Water Flow (LPS)",
                          angle: -90,
                          position: "insideLeft",
                          fill: "#64748b",
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
                      <Legend />
                      <Bar
                        dataKey="Demand"
                        fill="#06b6d4"
                        name="Total Demand"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="Supply"
                        fill="#10b981"
                        name="Total Supply"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="Gap"
                        fill="#ef4444"
                        name="Shortage Gap"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center space-y-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-2">
                      Total System Demand
                    </p>
                    <p className="text-4xl font-bold text-cyan-600">
                      355,959 LPS
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Constant across all wards
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-2">
                      Supply (After)
                    </p>
                    <p className="text-4xl font-bold text-green-600">
                      333,182 LPS
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      93.6% of total demand met
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Remaining Gap</p>
                    <p className="text-4xl font-bold text-red-600">
                      22,777 LPS
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Down from 39,839 LPS (42.8% improvement)
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      Network optimization increased supply efficiency from
                      88.8% to 93.6% of total demand, significantly reducing the
                      supply-demand gap.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Ward Performance Section - With Dropdown and Geographic Map */}
      <WardPerformanceSection wards={wards} />

      {/* Improved Ward Map Section - Main Interactive Map */}
      <ImprovedWardMap
        wards={wards}
        onWardSelect={handleWardSelect}
        selectedWard={selectedWard}
      />

      {/* Advanced Analytics Section */}
      <AdvancedAnalytics wards={wards} />

      {/* Predictive Analytics Section */}
      <PredictiveAnalytics wards={wards} />

      {/* Data Export Section */}
      <DataExport wards={wards} />

      {/* Improvement Distribution Section */}
      <section id="improvement-distribution" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
              Ward Improvement Distribution
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Distribution of wards based on the percentage point reduction in
              water shortage.
            </p>
          </div>
          <Card className="p-8 mt-12 border-slate-200">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={improvementData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label
                >
                  {improvementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </section>

      {/* Ward-Specific Data Section */}
      <section
        id="ward-data"
        className="py-20 md:py-32 bg-slate-900 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">
                Ward-Specific Analysis
              </h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Explore detailed metrics for each ward to understand localized
                improvements
              </p>
            </div>

            {/* Ward Selector */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white flex justify-between items-center hover:bg-slate-700 transition"
                >
                  <span>{selectedWard?.name || "Select a Ward"}</span>
                  <ChevronDown className="w-5 h-5" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20">
                    <div className="p-3 border-b border-slate-700">
                      <input
                        type="text"
                        placeholder="Search wards..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredWards.length > 0 ? (
                        filteredWards.map(ward => (
                          <button
                            key={ward.id}
                            onClick={() => handleWardSelect(ward)}
                            className={`w-full text-left px-4 py-2 hover:bg-slate-700 transition ${
                              selectedWard?.id === ward.id ? "bg-cyan-600" : ""
                            }`}
                          >
                            {ward.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-slate-400">
                          No wards found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ward Details */}
            {selectedWard && (
              <div className="space-y-8">
                {/* Ward Name and Explanation */}
                <Card className="bg-slate-800 border-slate-700 p-8">
                  <h3 className="text-2xl font-bold mb-4">
                    {selectedWard.name}
                  </h3>
                  <p className="text-slate-300 text-lg">
                    {selectedWard.explanation}
                  </p>
                </Card>

                {/* Ward Metrics Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Pressure */}
                  <Card className="bg-slate-800 border-slate-700 p-6">
                    <h4 className="text-lg font-bold mb-4 text-cyan-400">
                      Pressure (m)
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Before</span>
                        <span className="text-2xl font-bold">
                          {selectedWard.before.pressure.toFixed(2)} m
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">After</span>
                        <span className="text-2xl font-bold text-green-400">
                          {selectedWard.after.pressure.toFixed(2)} m
                        </span>
                      </div>
                      <div className="pt-4 border-t border-slate-700">
                        <div className="text-sm text-slate-400">
                          Improvement
                        </div>
                        <div className="text-xl font-bold text-green-400">
                          +
                          {(
                            selectedWard.after.pressure -
                            selectedWard.before.pressure
                          ).toFixed(2)}{" "}
                          m
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Demand */}
                  <Card className="bg-slate-800 border-slate-700 p-6">
                    <h4 className="text-lg font-bold mb-4 text-cyan-400">
                      Demand (LPS)
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Before</span>
                        <span className="text-2xl font-bold">
                          {selectedWard.before.demand.toFixed(2)} LPS
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">After</span>
                        <span className="text-2xl font-bold">
                          {selectedWard.after.demand.toFixed(2)} LPS
                        </span>
                      </div>
                      <div className="pt-4 border-t border-slate-700">
                        <div className="text-sm text-slate-400">Change</div>
                        <div className="text-xl font-bold text-slate-400">
                          Constant
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Supply */}
                  <Card className="bg-slate-800 border-slate-700 p-6">
                    <h4 className="text-lg font-bold mb-4 text-blue-400">
                      Supply (LPS)
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Before</span>
                        <span className="text-2xl font-bold">
                          {selectedWard.before.supply.toFixed(2)} LPS
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">After</span>
                        <span className="text-2xl font-bold text-green-400">
                          {selectedWard.after.supply.toFixed(2)} LPS
                        </span>
                      </div>
                      <div className="pt-4 border-t border-slate-700">
                        <div className="text-sm text-slate-400">
                          Improvement
                        </div>
                        <div className="text-xl font-bold text-green-400">
                          +
                          {(
                            selectedWard.after.supply -
                            selectedWard.before.supply
                          ).toFixed(2)}{" "}
                          LPS
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Supply/Demand Ratio */}
                  <Card className="bg-slate-800 border-slate-700 p-6">
                    <h4 className="text-lg font-bold mb-4 text-indigo-400">
                      Supply/Demand Ratio (%)
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Before</span>
                        <span className="text-2xl font-bold">
                          {(
                            (selectedWard.before.supply /
                              selectedWard.before.demand) *
                            100
                          ).toFixed(2)}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">After</span>
                        <span className="text-2xl font-bold text-green-400">
                          {(
                            (selectedWard.after.supply /
                              selectedWard.after.demand) *
                            100
                          ).toFixed(2)}
                          %
                        </span>
                      </div>
                      <div className="pt-4 border-t border-slate-700">
                        <div className="text-sm text-slate-400">
                          Improvement
                        </div>
                        <div className="text-xl font-bold text-green-400">
                          +
                          {(
                            (selectedWard.after.supply /
                              selectedWard.after.demand) *
                              100 -
                            (selectedWard.before.supply /
                              selectedWard.before.demand) *
                              100
                          ).toFixed(2)}{" "}
                          pp
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Shortage */}
                  <Card className="bg-slate-800 border-slate-700 p-6">
                    <h4 className="text-lg font-bold mb-4 text-red-400">
                      Shortage (LPS)
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Before</span>
                        <span className="text-2xl font-bold">
                          {selectedWard.before.shortage.toFixed(2)} LPS
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">After</span>
                        <span className="text-2xl font-bold text-green-400">
                          {selectedWard.after.shortage.toFixed(2)} LPS
                        </span>
                      </div>
                      <div className="pt-4 border-t border-slate-700">
                        <div className="text-sm text-slate-400">Reduction</div>
                        <div className="text-xl font-bold text-green-400">
                          -
                          {(
                            selectedWard.before.shortage -
                            selectedWard.after.shortage
                          ).toFixed(2)}{" "}
                          LPS
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Leakage */}
                  <Card className="bg-slate-800 border-slate-700 p-6">
                    <h4 className="text-lg font-bold mb-4 text-purple-400">
                      Leakage (%)
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Before</span>
                        <span className="text-2xl font-bold">
                          {selectedWard.before.leakage.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">After</span>
                        <span className="text-2xl font-bold text-green-400">
                          {selectedWard.after.leakage.toFixed(2)}%
                        </span>
                      </div>
                      <div className="pt-4 border-t border-slate-700">
                        <div className="text-sm text-slate-400">Reduction</div>
                        <div className="text-xl font-bold text-green-400">
                          -
                          {(
                            selectedWard.before.leakage -
                            selectedWard.after.leakage
                          ).toFixed(2)}{" "}
                          pp
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Ward Comparison Charts */}
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Bar Chart */}
                  <Card className="bg-slate-800 border-slate-700 p-8">
                    <h4 className="text-lg font-bold mb-6 text-white">
                      Metrics Comparison
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={wardMetricsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis
                          dataKey="name"
                          stroke="#94a3b8"
                          tick={{ fontSize: 11 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          label={{
                            value: "Performance Metrics",
                            position: "insideBottom",
                            offset: -5,
                            fill: "#94a3b8",
                            style: { textAnchor: "middle" },
                          }}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          tick={{ fontSize: 11 }}
                          label={{
                            value: "Metric Values",
                            angle: -90,
                            position: "insideLeft",
                            fill: "#94a3b8",
                            style: { textAnchor: "middle" },
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #475569",
                            borderRadius: "8px",
                            color: "#f1f5f9",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="before"
                          fill="#ef4444"
                          name="Before"
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          dataKey="after"
                          fill="#10b981"
                          name="After"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Radar Chart */}
                  <Card className="bg-slate-800 border-slate-700 p-8">
                    <h4 className="text-lg font-bold mb-6 text-white">
                      Performance Profile
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={wardComparisonData}>
                        <PolarGrid stroke="#475569" />
                        <PolarAngleAxis
                          dataKey="metric"
                          stroke="#94a3b8"
                          name="Metric"
                        />
                        <PolarRadiusAxis stroke="#94a3b8" />
                        <Radar
                          name="Before"
                          dataKey="before"
                          stroke="#ef4444"
                          fill="#ef4444"
                          fillOpacity={0.3}
                        />
                        <Radar
                          name="After"
                          dataKey="after"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.3}
                        />
                        <Legend />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #475569",
                            borderRadius: "8px",
                            color: "#f1f5f9",
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                {/* Ward Demand vs Supply Chart */}
                <Card className="bg-slate-800 border-slate-700 p-8">
                  <h4 className="text-lg font-bold mb-6 text-white">
                    Demand vs Supply Analysis
                  </h4>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={[
                        {
                          status: "Before",
                          Demand: selectedWard.before.demand,
                          Supply: selectedWard.before.supply,
                          Shortage: selectedWard.before.shortage,
                        },
                        {
                          status: "After",
                          Demand: selectedWard.after.demand,
                          Supply: selectedWard.after.supply,
                          Shortage: selectedWard.after.shortage,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis
                        dataKey="status"
                        stroke="#94a3b8"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        tick={{ fontSize: 12 }}
                        label={{
                          value: "Water Flow (LPS)",
                          angle: -90,
                          position: "insideLeft",
                          fill: "#94a3b8",
                          style: { textAnchor: "middle" },
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #475569",
                          borderRadius: "8px",
                          color: "#f1f5f9",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="Demand"
                        fill="#06b6d4"
                        name="Demand"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="Supply"
                        fill="#10b981"
                        name="Supply"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="Shortage"
                        fill="#ef4444"
                        name="Shortage"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-3">
                      <div className="text-xs text-cyan-400 mb-1">
                        Total Demand
                      </div>
                      <div className="text-lg font-bold text-white">
                        {selectedWard.before.demand.toFixed(2)} LPS
                      </div>
                    </div>
                    <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                      <div className="text-xs text-green-400 mb-1">
                        Supply (After)
                      </div>
                      <div className="text-lg font-bold text-white">
                        {selectedWard.after.supply.toFixed(2)} LPS
                      </div>
                    </div>
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                      <div className="text-xs text-red-400 mb-1">
                        Gap Remaining
                      </div>
                      <div className="text-lg font-bold text-white">
                        {selectedWard.after.shortage.toFixed(2)} LPS
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 md:py-32 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">
                Technology Stack
              </h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Built with modern, scalable technologies for real-world
                deployment
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-slate-800 border-slate-700 p-8">
                <h3 className="text-xl font-bold mb-6">
                  Backend & Data Processing
                </h3>
                <ul className="space-y-4 text-slate-300">
                  <li className="flex gap-3">
                    <span className="text-cyan-400">✓</span>
                    <span>
                      <strong>Python Flask</strong> - RESTful API for data
                      serving
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-cyan-400">✓</span>
                    <span>
                      <strong>Pandas</strong> - Large dataset processing and
                      analysis
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-cyan-400">✓</span>
                    <span>
                      <strong>CORS Enabled</strong> - Seamless frontend
                      integration
                    </span>
                  </li>
                </ul>
              </Card>
              <Card className="bg-slate-800 border-slate-700 p-8">
                <h3 className="text-xl font-bold mb-6">
                  Frontend & Visualization
                </h3>
                <ul className="space-y-4 text-slate-300">
                  <li className="flex gap-3">
                    <span className="text-cyan-400">✓</span>
                    <span>
                      <strong>React 19</strong> - Modern UI framework
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-cyan-400">✓</span>
                    <span>
                      <strong>TypeScript</strong> - Type-safe development
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-cyan-400">✓</span>
                    <span>
                      <strong>Recharts</strong> - Professional data
                      visualizations
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-cyan-400">✓</span>
                    <span>
                      <strong>Tailwind CSS</strong> - Responsive design system
                    </span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div>
              <div className="flex items-center gap-2 mb-4 justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Droplet className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white">AquaOptiSense</span>
              </div>
              <p className="text-sm text-center">
                © 2025 AquaOptiSense. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
