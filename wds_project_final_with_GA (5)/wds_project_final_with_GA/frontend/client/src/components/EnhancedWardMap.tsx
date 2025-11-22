import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useState, useMemo, useEffect } from "react";
import {
  MapPin,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Droplet,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
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

interface EnhancedWardMapProps {
  wards: WardData[];
  onWardSelect: (ward: WardData) => void;
  selectedWard?: WardData | null;
}

export default function EnhancedWardMap({
  wards,
  onWardSelect,
  selectedWard,
}: EnhancedWardMapProps) {
  const [filterMode, setFilterMode] = useState<
    "all" | "improved" | "critical" | "top"
  >("all");
  const [metricView, setMetricView] = useState<
    "shortage" | "pressure" | "efficiency" | "leakage"
  >("shortage");
  const [searchTerm, setSearchTerm] = useState("");
  const [showLegend, setShowLegend] = useState(true);
  const [hoveredWard, setHoveredWard] = useState<WardData | null>(null);

  // Process ward data for visualization
  const processedWards = useMemo(() => {
    return wards.map(ward => {
      const shortageImprovement =
        ward.before.shortage_pct - ward.after.shortage_pct;
      const pressureImprovement = ward.after.pressure - ward.before.pressure;
      const leakageReduction = ward.before.leakage - ward.after.leakage;
      const efficiencyScore =
        shortageImprovement * 10 + pressureImprovement * 2 - ward.after.leakage;

      return {
        ...ward,
        metrics: {
          shortageImprovement,
          pressureImprovement,
          leakageReduction,
          efficiencyScore,
          isCritical: ward.after.shortage_pct > 10,
          isImproved: shortageImprovement > 0,
          isTopPerformer: shortageImprovement > 5,
        },
      };
    });
  }, [wards]);

  // Filter wards based on current filter mode
  const filteredWards = useMemo(() => {
    let filtered = processedWards;

    // Apply filter mode
    switch (filterMode) {
      case "improved":
        filtered = filtered.filter(w => w.metrics.isImproved);
        break;
      case "critical":
        filtered = filtered.filter(w => w.metrics.isCritical);
        break;
      case "top":
        filtered = filtered.filter(w => w.metrics.isTopPerformer);
        break;
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort(
      (a, b) => b.metrics.efficiencyScore - a.metrics.efficiencyScore
    );
  }, [processedWards, filterMode, searchTerm]);

  // Get color based on metric and value
  const getWardColor = (ward: (typeof processedWards)[0]) => {
    switch (metricView) {
      case "shortage":
        if (ward.after.shortage_pct > 10) return "#ef4444"; // Red - Critical
        if (ward.after.shortage_pct > 5) return "#f59e0b"; // Yellow - Moderate
        return "#10b981"; // Green - Good

      case "pressure":
        if (ward.after.pressure < 30) return "#ef4444";
        if (ward.after.pressure < 50) return "#f59e0b";
        return "#10b981";

      case "efficiency":
        if (ward.metrics.efficiencyScore > 50) return "#10b981";
        if (ward.metrics.efficiencyScore > 0) return "#f59e0b";
        return "#ef4444";

      case "leakage":
        if (ward.after.leakage > 2) return "#ef4444";
        if (ward.after.leakage > 1) return "#f59e0b";
        return "#10b981";

      default:
        return "#64748b";
    }
  };

  // Get metric value for display
  const getMetricValue = (ward: (typeof processedWards)[0]) => {
    switch (metricView) {
      case "shortage":
        return `${ward.after.shortage_pct.toFixed(2)}%`;
      case "pressure":
        return `${ward.after.pressure.toFixed(2)}m`;
      case "efficiency":
        return ward.metrics.efficiencyScore.toFixed(2);
      case "leakage":
        return `${ward.after.leakage.toFixed(2)}%`;
      default:
        return "";
    }
  };

  // Statistics for current filter
  const stats = useMemo(() => {
    return {
      total: filteredWards.length,
      improved: filteredWards.filter(w => w.metrics.isImproved).length,
      critical: filteredWards.filter(w => w.metrics.isCritical).length,
      avgImprovement:
        filteredWards.reduce(
          (sum, w) => sum + w.metrics.shortageImprovement,
          0
        ) / filteredWards.length || 0,
    };
  }, [filteredWards]);

  const filterOptions = [
    {
      id: "all" as const,
      label: "All Wards",
      icon: MapPin,
      color: "text-slate-600",
    },
    {
      id: "improved" as const,
      label: "Improved",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      id: "critical" as const,
      label: "Critical",
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      id: "top" as const,
      label: "Top Performers",
      icon: CheckCircle,
      color: "text-blue-600",
    },
  ];

  const metricOptions = [
    {
      id: "shortage" as const,
      label: "Water Shortage",
      icon: Droplet,
      unit: "%",
    },
    { id: "pressure" as const, label: "Pressure", icon: Gauge, unit: "m" },
    {
      id: "efficiency" as const,
      label: "Efficiency Score",
      icon: TrendingUp,
      unit: "",
    },
    {
      id: "leakage" as const,
      label: "Leakage Rate",
      icon: AlertTriangle,
      unit: "%",
    },
  ];

  return (
    <section id="enhanced-ward-map" className="py-20 md:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
              Interactive Ward Analysis
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Explore detailed performance metrics across all 198 wards with
              interactive filtering and real-time insights
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Filter Controls */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {filterOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.id}
                      onClick={() => setFilterMode(option.id)}
                      variant={filterMode === option.id ? "default" : "outline"}
                      className={`flex items-center gap-2 ${
                        filterMode === option.id
                          ? "bg-slate-900 text-white"
                          : `hover:bg-slate-100 ${option.color}`
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search wards..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <Button
                  onClick={() => setShowLegend(!showLegend)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {showLegend ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  Legend
                </Button>
              </div>
            </div>

            {/* Metric View Selector */}
            <div className="flex flex-wrap gap-2 justify-center">
              {metricOptions.map(option => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.id}
                    onClick={() => setMetricView(option.id)}
                    variant={metricView === option.id ? "default" : "outline"}
                    className={`flex items-center gap-2 ${
                      metricView === option.id
                        ? "bg-blue-600 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {stats.total}
                </p>
                <p className="text-sm text-slate-600">Total Wards</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {stats.improved}
                </p>
                <p className="text-sm text-slate-600">Improved</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">
                  {stats.critical}
                </p>
                <p className="text-sm text-slate-600">Critical</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {stats.avgImprovement.toFixed(2)}pp
                </p>
                <p className="text-sm text-slate-600">Avg Improvement</p>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Ward Grid */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    Ward Performance Grid
                  </h3>
                  <span className="text-sm text-slate-600">
                    Showing {filteredWards.length} of {wards.length} wards
                  </span>
                </div>

                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-96 overflow-y-auto">
                  {filteredWards.map(ward => (
                    <div
                      key={ward.id}
                      onClick={() => onWardSelect(ward)}
                      onMouseEnter={() => setHoveredWard(ward)}
                      onMouseLeave={() => setHoveredWard(null)}
                      className={`
                        relative w-12 h-12 rounded-lg cursor-pointer transition-all duration-200
                        hover:scale-110 hover:z-10 hover:shadow-lg
                        ${selectedWard?.id === ward.id ? "ring-2 ring-blue-500 ring-offset-2" : ""}
                      `}
                      style={{ backgroundColor: getWardColor(ward) }}
                      title={`${ward.name}: ${getMetricValue(ward)}`}
                    >
                      {ward.metrics.isTopPerformer && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
                      )}
                      {ward.metrics.isCritical && (
                        <AlertTriangle className="absolute top-1 right-1 w-3 h-3 text-white" />
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Ward Details & Legend */}
            <div className="space-y-6">
              {/* Hovered/Selected Ward Details */}
              {(hoveredWard || selectedWard) && (
                <Card className="p-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900">
                      {(hoveredWard || selectedWard)!.name}
                    </h4>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Current Shortage</p>
                        <p className="font-bold text-slate-900">
                          {(hoveredWard ||
                            selectedWard)!.after.shortage_pct.toFixed(2)}
                          %
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Improvement</p>
                        <p className="font-bold text-green-600">
                          {(
                            (hoveredWard || selectedWard)!.before.shortage_pct -
                            (hoveredWard || selectedWard)!.after.shortage_pct
                          ).toFixed(2)}
                          pp
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Pressure</p>
                        <p className="font-bold text-slate-900">
                          {(hoveredWard ||
                            selectedWard)!.after.pressure.toFixed(2)}
                          m
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Efficiency</p>
                        <p className="font-bold text-blue-600">
                          {(
                            ((hoveredWard || selectedWard)!.before
                              .shortage_pct -
                              (hoveredWard || selectedWard)!.after
                                .shortage_pct) *
                              10 +
                            ((hoveredWard || selectedWard)!.after.pressure -
                              (hoveredWard || selectedWard)!.before.pressure) *
                              2 -
                            (hoveredWard || selectedWard)!.after.leakage
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-xs text-slate-600">
                        {(hoveredWard || selectedWard)!.explanation}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Legend */}
              {showLegend && (
                <Card className="p-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4">
                    {metricOptions.find(m => m.id === metricView)?.label} Legend
                  </h4>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-green-500"></div>
                      <span className="text-sm text-slate-600">
                        {metricView === "shortage" && "Low Shortage (<5%)"}
                        {metricView === "pressure" && "Good Pressure (>50m)"}
                        {metricView === "efficiency" && "High Efficiency (>50)"}
                        {metricView === "leakage" && "Low Leakage (<1%)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-yellow-500"></div>
                      <span className="text-sm text-slate-600">
                        {metricView === "shortage" &&
                          "Moderate Shortage (5-10%)"}
                        {metricView === "pressure" && "Fair Pressure (30-50m)"}
                        {metricView === "efficiency" &&
                          "Moderate Efficiency (0-50)"}
                        {metricView === "leakage" && "Moderate Leakage (1-2%)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-red-500"></div>
                      <span className="text-sm text-slate-600">
                        {metricView === "shortage" && "High Shortage (>10%)"}
                        {metricView === "pressure" && "Low Pressure (<30m)"}
                        {metricView === "efficiency" && "Low Efficiency (<0)"}
                        {metricView === "leakage" && "High Leakage (>2%)"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span>Top Performer</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Needs Attention</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Quick Actions */}
              <Card className="p-6">
                <h4 className="text-lg font-bold text-slate-900 mb-4">
                  Quick Actions
                </h4>
                <div className="space-y-2">
                  <Button
                    onClick={() => setFilterMode("critical")}
                    variant="outline"
                    className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    View Critical Wards
                  </Button>
                  <Button
                    onClick={() => setFilterMode("top")}
                    variant="outline"
                    className="w-full justify-start text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    View Top Performers
                  </Button>
                  <Button
                    onClick={() => setMetricView("efficiency")}
                    variant="outline"
                    className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Efficiency Analysis
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Traditional Map */}
          <Card className="p-0 border-slate-200 overflow-hidden shadow-xl">
            <div className="p-6 border-b bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">
                Geographic Ward Distribution
              </h3>
              <p className="text-slate-600">
                Interactive map showing ward boundaries and performance metrics
              </p>
            </div>
            <iframe
              src="/ward_map.html"
              title="Ward Performance Map"
              width="100%"
              height="600px"
              style={{ border: "none" }}
            />
          </Card>
        </div>
      </div>
    </section>
  );
}
