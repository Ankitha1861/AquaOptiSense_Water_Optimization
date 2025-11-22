import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useState, useMemo, useEffect, useRef } from "react";
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
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
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

interface InteractiveWardMapProps {
  wards: WardData[];
  onWardSelect: (ward: WardData) => void;
  selectedWard?: WardData | null;
}

// Enhanced Ward Map Component with Interactive Features
export default function InteractiveWardMap({
  wards,
  onWardSelect,
  selectedWard,
}: InteractiveWardMapProps) {
  const [filterMode, setFilterMode] = useState<
    "all" | "improved" | "critical" | "top"
  >("all");
  const [metricView, setMetricView] = useState<
    "shortage" | "pressure" | "efficiency" | "leakage"
  >("shortage");
  const [searchTerm, setSearchTerm] = useState("");
  const [showLegend, setShowLegend] = useState(true);
  const [hoveredWard, setHoveredWard] = useState<WardData | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLIFrameElement>(null);
  const [wardDataLoaded, setWardDataLoaded] = useState(false);

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
        return `${ward.after.shortage_pct.toFixed(1)}%`;
      case "pressure":
        return `${ward.after.pressure.toFixed(1)}m`;
      case "efficiency":
        return ward.metrics.efficiencyScore.toFixed(0);
      case "leakage":
        return `${ward.after.leakage.toFixed(2)}%`;
      default:
        return "";
    }
  };

  // Get metric improvement
  const getMetricImprovement = (ward: (typeof processedWards)[0]) => {
    switch (metricView) {
      case "shortage":
        return `${ward.metrics.shortageImprovement.toFixed(1)}pp`;
      case "pressure":
        return `${ward.metrics.pressureImprovement.toFixed(1)}m`;
      case "efficiency":
        return ward.metrics.efficiencyScore > 0 ? "Improved" : "Needs Work";
      case "leakage":
        return `${ward.metrics.leakageReduction.toFixed(2)}pp`;
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
      count: processedWards.length,
    },
    {
      id: "improved" as const,
      label: "Improved",
      icon: TrendingUp,
      color: "text-green-600",
      count: processedWards.filter(w => w.metrics.isImproved).length,
    },
    {
      id: "critical" as const,
      label: "Critical",
      icon: AlertTriangle,
      color: "text-red-600",
      count: processedWards.filter(w => w.metrics.isCritical).length,
    },
    {
      id: "top" as const,
      label: "Top Performers",
      icon: CheckCircle,
      color: "text-blue-600",
      count: processedWards.filter(w => w.metrics.isTopPerformer).length,
    },
  ];

  const metricOptions = [
    {
      id: "shortage" as const,
      label: "Water Shortage",
      icon: Droplet,
      unit: "%",
      description: "Current water shortage percentage",
    },
    {
      id: "pressure" as const,
      label: "Pressure",
      icon: Gauge,
      unit: "m",
      description: "Water pressure in meters",
    },
    {
      id: "efficiency" as const,
      label: "Efficiency Score",
      icon: TrendingUp,
      unit: "",
      description: "Overall performance efficiency",
    },
    {
      id: "leakage" as const,
      label: "Leakage Rate",
      icon: AlertTriangle,
      unit: "%",
      description: "Water leakage percentage",
    },
  ];

  // Enhanced ward information for tooltip
  const getWardTooltipInfo = (ward: (typeof processedWards)[0]) => {
    return {
      name: ward.name,
      currentMetric: getMetricValue(ward),
      improvement: getMetricImprovement(ward),
      status: ward.metrics.isCritical
        ? "Critical"
        : ward.metrics.isTopPerformer
          ? "Top Performer"
          : "Normal",
      statusColor: ward.metrics.isCritical
        ? "text-red-600"
        : ward.metrics.isTopPerformer
          ? "text-green-600"
          : "text-slate-600",
      details: {
        shortage: `${ward.after.shortage_pct.toFixed(1)}%`,
        pressure: `${ward.after.pressure.toFixed(1)}m`,
        supply: `${ward.after.supply.toFixed(0)} LPS`,
        leakage: `${ward.after.leakage.toFixed(2)}%`,
      },
    };
  };

  // Load ward data into the map iframe when it's loaded
  useEffect(() => {
    if (mapLoaded && wards.length > 0 && !wardDataLoaded) {
      try {
        const iframe = mapRef.current;
        if (iframe && iframe.contentWindow) {
          // Send ward data to the iframe
          const message = {
            type: "WARD_DATA_UPDATE",
            data: {
              wards: processedWards,
              metricView,
              filterMode,
            },
          };
          iframe.contentWindow.postMessage(message, "*");
          setWardDataLoaded(true);
        }
      } catch (error) {
        console.warn("Could not send data to map iframe:", error);
      }
    }
  }, [
    mapLoaded,
    processedWards,
    metricView,
    filterMode,
    wards.length,
    wardDataLoaded,
  ]);

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "WARD_HOVER") {
        const wardId = event.data.wardId;
        const ward = processedWards.find(w => w.id === wardId);
        setHoveredWard(ward || null);
      } else if (event.data.type === "WARD_CLICK") {
        const wardId = event.data.wardId;
        const ward = processedWards.find(w => w.id === wardId);
        if (ward) {
          onWardSelect(ward);
        }
      } else if (event.data.type === "MAP_LOADED") {
        setMapLoaded(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [processedWards, onWardSelect]);

  return (
    <section id="interactive-ward-map" className="py-20 md:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
              Interactive Ward Performance Map
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Explore detailed performance metrics across all 198 wards with
              interactive mapping and real-time insights
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
                      <span className="ml-1 px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded-full">
                        {option.count}
                      </span>
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
                    onClick={() => {
                      setMetricView(option.id);
                      setWardDataLoaded(false); // Trigger data refresh
                    }}
                    variant={metricView === option.id ? "default" : "outline"}
                    className={`flex items-center gap-2 ${
                      metricView === option.id
                        ? "bg-blue-600 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    title={option.description}
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
                  {stats.avgImprovement.toFixed(1)}pp
                </p>
                <p className="text-sm text-slate-600">Avg Improvement</p>
              </Card>
            </div>
          </div>

          {/* Main Map Content */}
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Interactive Map */}
            <div className="lg:col-span-3">
              <Card className="p-0 border-slate-200 overflow-hidden shadow-xl">
                <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {metricOptions.find(m => m.id === metricView)?.label}{" "}
                        Distribution
                      </h3>
                      <p className="text-slate-600">
                        Hover over wards to see detailed information • Click to
                        select
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="relative" style={{ height: "600px" }}>
                  <iframe
                    ref={mapRef}
                    src="/ward_map.html"
                    title="Interactive Ward Performance Map"
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                    onLoad={() => setMapLoaded(true)}
                  />

                  {!mapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-600">
                          Loading interactive map...
                        </p>
                      </div>
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

                          const info = getWardTooltipInfo(processedWard);
                          return (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                info.status === "Critical"
                                  ? "bg-red-100 text-red-800"
                                  : info.status === "Top Performer"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {info.status}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">
                          Current{" "}
                          {metricOptions.find(m => m.id === metricView)?.label}
                        </p>
                        <p className="font-bold text-slate-900">
                          {(() => {
                            const ward = hoveredWard || selectedWard!;
                            const processedWard = processedWards.find(
                              w => w.id === ward.id
                            );
                            return processedWard
                              ? getMetricValue(processedWard)
                              : "N/A";
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Improvement</p>
                        <p className="font-bold text-green-600">
                          {(() => {
                            const ward = hoveredWard || selectedWard!;
                            const processedWard = processedWards.find(
                              w => w.id === ward.id
                            );
                            return processedWard
                              ? getMetricImprovement(processedWard)
                              : "N/A";
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Shortage</p>
                        <p className="font-bold text-slate-900">
                          {(hoveredWard ||
                            selectedWard)!.after.shortage_pct.toFixed(1)}
                          %
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Pressure</p>
                        <p className="font-bold text-slate-900">
                          {(hoveredWard ||
                            selectedWard)!.after.pressure.toFixed(1)}
                          m
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

              {/* Enhanced Legend */}
              {showLegend && (
                <Card className="p-6 bg-white shadow-lg">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Color Legend
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
                            {metricView === "shortage" && "Excellent (< 5%)"}
                            {metricView === "pressure" && "High (> 50m)"}
                            {metricView === "efficiency" &&
                              "High Efficiency (> 50)"}
                            {metricView === "leakage" && "Low Leakage (< 1%)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-yellow-500 shadow-sm"></div>
                          <span className="text-sm text-slate-600">
                            {metricView === "shortage" && "Moderate (5-10%)"}
                            {metricView === "pressure" && "Medium (30-50m)"}
                            {metricView === "efficiency" &&
                              "Moderate Efficiency (0-50)"}
                            {metricView === "leakage" &&
                              "Medium Leakage (1-2%)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-red-500 shadow-sm"></div>
                          <span className="text-sm text-slate-600">
                            {metricView === "shortage" && "Critical (> 10%)"}
                            {metricView === "pressure" && "Low (< 30m)"}
                            {metricView === "efficiency" &&
                              "Low Efficiency (< 0)"}
                            {metricView === "leakage" && "High Leakage (> 2%)"}
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

              {/* Map Instructions */}
              <Card className="p-6 bg-blue-50 border-blue-200">
                <h4 className="text-lg font-bold text-blue-900 mb-3">
                  How to Use
                </h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Hover over any ward to see detailed metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>
                      Click on a ward to select it for detailed analysis
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>
                      Use filters to focus on specific ward categories
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>
                      Switch metric views to analyze different aspects
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
