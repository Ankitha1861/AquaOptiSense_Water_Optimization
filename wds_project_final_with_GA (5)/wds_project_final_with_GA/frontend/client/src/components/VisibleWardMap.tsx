import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useState, useMemo } from "react";
import {
  MapPin,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Droplet,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid3X3,
  List,
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

interface VisibleWardMapProps {
  wards: WardData[];
  onWardSelect: (ward: WardData) => void;
  selectedWard?: WardData | null;
}

export default function VisibleWardMap({
  wards,
  onWardSelect,
  selectedWard,
}: VisibleWardMapProps) {
  const [filterMode, setFilterMode] = useState<
    "all" | "improved" | "critical" | "top"
  >("all");
  const [metricView, setMetricView] = useState<
    "shortage" | "pressure" | "efficiency" | "leakage"
  >("shortage");
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredWard, setHoveredWard] = useState<WardData | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showLegend, setShowLegend] = useState(true);

  // Process ward data for visualization
  const processedWards = useMemo(() => {
    return wards.map((ward, index) => {
      const shortageImprovement =
        ward.before.shortage_pct - ward.after.shortage_pct;
      const pressureImprovement = ward.after.pressure - ward.before.pressure;
      const leakageReduction = ward.before.leakage - ward.after.leakage;
      const efficiencyScore =
        shortageImprovement * 10 + pressureImprovement * 2 - ward.after.leakage;

      // Calculate position for grid layout (simulating ward positions)
      const row = Math.floor(index / 18);
      const col = index % 18;

      return {
        ...ward,
        gridPosition: { row, col },
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
    <section id="visible-ward-map" className="py-20 md:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
              Ward Performance Visualization
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Interactive visualization of all 198 wards with color-coded
              performance metrics. Hover over any ward to see detailed
              information and click to select for analysis.
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Filter and View Controls */}
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
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setViewMode("grid")}
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setViewMode("list")}
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
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
              <Card className="p-4 text-center bg-white shadow-sm">
                <p className="text-2xl font-bold text-slate-900">
                  {stats.total}
                </p>
                <p className="text-sm text-slate-600">Filtered Wards</p>
              </Card>
              <Card className="p-4 text-center bg-green-50 shadow-sm">
                <p className="text-2xl font-bold text-green-600">
                  {stats.improved}
                </p>
                <p className="text-sm text-slate-600">Improved</p>
              </Card>
              <Card className="p-4 text-center bg-red-50 shadow-sm">
                <p className="text-2xl font-bold text-red-600">
                  {stats.critical}
                </p>
                <p className="text-sm text-slate-600">Critical</p>
              </Card>
              <Card className="p-4 text-center bg-blue-50 shadow-sm">
                <p className="text-2xl font-bold text-blue-600">
                  {stats.avgImprovement.toFixed(2)}pp
                </p>
                <p className="text-sm text-slate-600">Avg Improvement</p>
              </Card>
            </div>
          </div>

          {/* Main Visualization Content */}
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Ward Visualization */}
            <div className="lg:col-span-3">
              <Card className="p-0 border-slate-200 overflow-hidden shadow-xl">
                <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Ward Performance Map -{" "}
                        {metricOptions.find(m => m.id === metricView)?.label}
                      </h3>
                      <p className="text-slate-600">
                        {viewMode === "grid" ? "Grid Layout" : "List View"} •{" "}
                        {stats.total} wards shown
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setShowLegend(!showLegend)}
                        variant="outline"
                        size="sm"
                      >
                        <Info className="w-4 h-4" />
                        {showLegend ? "Hide" : "Show"} Legend
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {viewMode === "grid" ? (
                    /* Grid View - Improved with better sizing */
                    <div className="grid grid-cols-10 md:grid-cols-14 lg:grid-cols-16 gap-2 max-h-96 overflow-y-auto p-4 bg-slate-50 rounded-lg">
                      {filteredWards.map(ward => (
                        <div
                          key={ward.id}
                          onClick={() => onWardSelect(ward)}
                          onMouseEnter={() => setHoveredWard(ward)}
                          onMouseLeave={() => setHoveredWard(null)}
                          className={`
                            relative w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded cursor-pointer border-2 border-white
                            transition-all duration-200 hover:scale-110 hover:z-10 hover:shadow-lg
                            ${selectedWard?.id === ward.id ? "ring-2 ring-blue-500 ring-offset-1 scale-110" : ""}
                          `}
                          style={{ backgroundColor: getWardColor(ward) }}
                          title={`${ward.name}: ${getMetricValue(ward)}`}
                        >
                          {/* Ward ID Number */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-white text-shadow">
                              {ward.id}
                            </span>
                          </div>
                          {/* Performance Indicators */}
                          {ward.metrics.isTopPerformer && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
                          )}
                          {ward.metrics.isCritical && (
                            <AlertTriangle className="absolute top-0.5 right-0.5 w-3 h-3 text-white" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* List View */
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredWards.map(ward => (
                        <div
                          key={ward.id}
                          onClick={() => onWardSelect(ward)}
                          onMouseEnter={() => setHoveredWard(ward)}
                          onMouseLeave={() => setHoveredWard(null)}
                          className={`
                            flex items-center justify-between p-3 rounded-lg cursor-pointer
                            transition-all duration-200 hover:shadow-md border-l-4
                            ${selectedWard?.id === ward.id ? "bg-blue-50 border-blue-500" : "bg-white hover:bg-slate-50"}
                          `}
                          style={{ borderLeftColor: getWardColor(ward) }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: getWardColor(ward) }}
                            ></div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {ward.name}
                              </p>
                              <p className="text-sm text-slate-600">
                                {
                                  metricOptions.find(m => m.id === metricView)
                                    ?.label
                                }
                                : {getMetricValue(ward)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {ward.metrics.isTopPerformer && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {ward.metrics.isCritical && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                            <span
                              className="text-sm font-semibold"
                              style={{ color: getWardColor(ward) }}
                            >
                              {getMetricValue(ward)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Ward Details & Legend */}
            <div className="space-y-6">
              {/* Hovered/Selected Ward Details */}
              {(hoveredWard || selectedWard) && (
                <Card className="p-6 bg-white shadow-lg">
                  <div className="space-y-4">
                    <div className="border-b pb-3">
                      <h4 className="text-lg font-bold text-slate-900">
                        {(hoveredWard || selectedWard)!.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {(() => {
                          const ward = hoveredWard || selectedWard!;
                          const processedWard = processedWards.find(
                            w => w.id === ward.id
                          );
                          if (!processedWard) return null;

                          return (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                processedWard.metrics.isCritical
                                  ? "bg-red-100 text-red-800"
                                  : processedWard.metrics.isTopPerformer
                                    ? "bg-green-100 text-green-800"
                                    : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {processedWard.metrics.isCritical
                                ? "Critical"
                                : processedWard.metrics.isTopPerformer
                                  ? "Top Performer"
                                  : "Normal"}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

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
                        <p className="text-slate-600">Supply</p>
                        <p className="font-bold text-slate-900">
                          {(hoveredWard || selectedWard)!.after.supply.toFixed(
                            0
                          )}{" "}
                          LPS
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {(hoveredWard || selectedWard)!.explanation}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Legend */}
              {showLegend && (
                <Card className="p-6 bg-white shadow-lg">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Performance Legend
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-3">
                        {metricOptions.find(m => m.id === metricView)?.label}{" "}
                        Scale
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-green-500 shadow-sm"></div>
                          <span className="text-sm text-slate-600">
                            {metricView === "shortage" &&
                              "Low Shortage (&lt; 5%)"}
                            {metricView === "pressure" &&
                              "High Pressure (&gt; 50m)"}
                            {metricView === "efficiency" &&
                              "High Efficiency (&gt; 50)"}
                            {metricView === "leakage" &&
                              "Low Leakage (&lt; 1%)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-yellow-500 shadow-sm"></div>
                          <span className="text-sm text-slate-600">
                            {metricView === "shortage" && "Moderate (5-10%)"}
                            {metricView === "pressure" && "Medium (30-50m)"}
                            {metricView === "efficiency" && "Moderate (0-50)"}
                            {metricView === "leakage" && "Medium (1-2%)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-red-500 shadow-sm"></div>
                          <span className="text-sm text-slate-600">
                            {metricView === "shortage" &&
                              "High Shortage (&gt; 10%)"}
                            {metricView === "pressure" &&
                              "Low Pressure (&lt; 30m)"}
                            {metricView === "efficiency" &&
                              "Low Efficiency (&lt; 0)"}
                            {metricView === "leakage" &&
                              "High Leakage (&gt; 2%)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm font-semibold text-slate-900 mb-2">
                        Special Indicators
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-sm"></div>
                          <span>Top Performer (&gt; 5pp improvement)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span>Needs Critical Attention</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Instructions */}
              <Card className="p-6 bg-blue-50 border-blue-200">
                <h4 className="text-lg font-bold text-blue-900 mb-3">
                  How to Use
                </h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>
                      Hover over any ward square to see detailed metrics
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Click on a ward to select it for analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Use filters to focus on specific categories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Switch between grid and list view modes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>
                      Change metric views to analyze different aspects
                    </span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
