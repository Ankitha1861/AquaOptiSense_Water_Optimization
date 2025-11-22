import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Search,
  Filter,
  Eye,
  ChevronDown,
  Droplet,
  Gauge,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import WardDetailMap from "./WardDetailMap";

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

interface ImprovedWardMapProps {
  wards: WardData[];
  onWardSelect: (ward: WardData) => void;
  selectedWard: WardData | null;
}

const WARD_GRID_CONFIG = {
  rows: 14,
  cols: 14,
  cellSize: 32,
  gap: 2,
};

export default function ImprovedWardMap({
  wards,
  onWardSelect,
  selectedWard,
}: ImprovedWardMapProps) {
  const [filterMode, setFilterMode] = useState<
    "all" | "improved" | "critical" | "top"
  >("all");
  const [metricView, setMetricView] = useState<
    "shortage" | "pressure" | "efficiency" | "leakage" | "supplyDemand"
  >("shortage");
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredWard, setHoveredWard] = useState<WardData | null>(null);
  const [showIndividualMap, setShowIndividualMap] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Process ward data for visualization
  const processedWards = useMemo(() => {
    return wards.map((ward, index) => {
      const shortageImprovement =
        ward.before.shortage_pct - ward.after.shortage_pct;
      const pressureImprovement = ward.after.pressure - ward.before.pressure;
      const leakageReduction = ward.before.leakage - ward.after.leakage;
      const efficiencyScore =
        shortageImprovement * 10 + pressureImprovement * 2 - ward.after.leakage;

      // Create a more realistic grid position based on ward ID
      const row = Math.floor(index / WARD_GRID_CONFIG.cols);
      const col = index % WARD_GRID_CONFIG.cols;

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
        if (ward.after.shortage_pct > 10) return "#ef4444";
        if (ward.after.shortage_pct > 5) return "#f59e0b";
        return "#10b981";

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

      case "supplyDemand":
        const supplyDemandRatio = (ward.after.supply / ward.after.demand) * 100;
        if (supplyDemandRatio >= 98) return "#10b981";
        if (supplyDemandRatio >= 95) return "#22c55e";
        if (supplyDemandRatio >= 90) return "#f59e0b";
        if (supplyDemandRatio >= 85) return "#fb923c";
        return "#ef4444";

      default:
        return "#64748b";
    }
  };

  const getMetricValue = (ward: (typeof processedWards)[0]) => {
    switch (metricView) {
      case "shortage":
        return `${ward.after.shortage_pct.toFixed(2)}%`;
      case "pressure":
        return `${ward.after.pressure.toFixed(2)}m`;
      case "efficiency":
        return `${ward.metrics.efficiencyScore.toFixed(2)}`;
      case "leakage":
        return `${ward.after.leakage.toFixed(2)}L/s`;
      case "supplyDemand":
        return `${((ward.after.supply / ward.after.demand) * 100).toFixed(2)}%`;
      default:
        return "";
    }
  };

  const stats = useMemo(() => {
    const total = filteredWards.length;
    const improved = filteredWards.filter(w => w.metrics.isImproved).length;
    const critical = filteredWards.filter(w => w.metrics.isCritical).length;
    const avgImprovement =
      filteredWards.reduce((sum, w) => sum + w.metrics.shortageImprovement, 0) /
      total;
    const totalDemand = filteredWards.reduce(
      (sum, w) => sum + w.after.demand,
      0
    );
    const totalSupply = filteredWards.reduce(
      (sum, w) => sum + w.after.supply,
      0
    );
    const avgSupplyDemandRatio =
      filteredWards.reduce(
        (sum, w) => sum + (w.after.supply / w.after.demand) * 100,
        0
      ) / total;

    return {
      total,
      improved,
      critical,
      avgImprovement: avgImprovement || 0,
      totalDemand,
      totalSupply,
      avgSupplyDemandRatio: avgSupplyDemandRatio || 0,
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
    { id: "shortage" as const, label: "Water Shortage", icon: Droplet },
    { id: "pressure" as const, label: "Pressure", icon: Gauge },
    { id: "efficiency" as const, label: "Efficiency", icon: TrendingUp },
    { id: "leakage" as const, label: "Leakage", icon: AlertTriangle },
    { id: "supplyDemand" as const, label: "Supply vs Demand", icon: Droplet },
  ];

  return (
    <section
      id="improved-ward-map"
      className="py-20 md:py-32 bg-gradient-to-br from-slate-50 to-blue-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
              Interactive Ward Performance Map
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive visualization of water network improvements across
              all wards with enhanced interactivity and detailed analytics.
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
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
              <Card className="p-4 text-center bg-cyan-50 shadow-sm">
                <p className="text-2xl font-bold text-cyan-600">
                  {(stats.totalDemand / 1000).toFixed(1)}K
                </p>
                <p className="text-sm text-slate-600">Total Demand</p>
              </Card>
              <Card className="p-4 text-center bg-emerald-50 shadow-sm">
                <p className="text-2xl font-bold text-emerald-600">
                  {(stats.totalSupply / 1000).toFixed(1)}K
                </p>
                <p className="text-sm text-slate-600">Total Supply</p>
              </Card>
              <Card className="p-4 text-center bg-indigo-50 shadow-sm">
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.avgSupplyDemandRatio.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-600">Avg S/D Ratio</p>
              </Card>
            </div>
          </div>

          {/* Main Map and Individual Ward View */}
          <div className="space-y-8">
            {/* Top Row: Ward List + Ward Details */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Ward List View (instead of grid) */}
              <div className="lg:col-span-2">
                <Card className="p-0 border-slate-200 overflow-hidden shadow-xl">
                  <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          Ward List -{" "}
                          {metricOptions.find(m => m.id === metricView)?.label}
                        </h3>
                        <p className="text-slate-600">
                          Click any ward to view its geographic map •{" "}
                          {stats.total} wards shown
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="overflow-auto bg-slate-50"
                    style={{ maxHeight: "600px" }}
                  >
                    <div className="divide-y divide-slate-200">
                      {filteredWards.map(ward => {
                        const isSelected = selectedWard?.id === ward.id;
                        const shortageImprovement = (
                          ward.before.shortage_pct - ward.after.shortage_pct
                        ).toFixed(2);

                        return (
                          <div
                            key={ward.id}
                            onClick={() => {
                              onWardSelect(ward);
                              setShowIndividualMap(true);
                            }}
                            onMouseEnter={() => setHoveredWard(ward)}
                            onMouseLeave={() => setHoveredWard(null)}
                            className={`
                            p-4 cursor-pointer transition-all duration-200
                            hover:bg-blue-50
                            ${isSelected ? "bg-blue-100 border-l-4 border-blue-600" : "bg-white"}
                          `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-4 h-4 rounded-full border-2 border-white shadow"
                                    style={{
                                      backgroundColor: getWardColor(ward),
                                    }}
                                  />
                                  <div>
                                    <h4 className="font-semibold text-slate-900">
                                      {ward.name}
                                    </h4>
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                      <span>{getMetricValue(ward)}</span>
                                      <span className="text-xs text-slate-400">
                                        •
                                      </span>
                                      <span className="text-xs">
                                        D: {ward.after.demand.toFixed(0)} | S:{" "}
                                        {ward.after.supply.toFixed(0)} LPS
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-xs text-slate-500">
                                    Supply/Demand
                                  </div>
                                  <div className="text-sm font-bold text-indigo-600">
                                    {(
                                      (ward.after.supply / ward.after.demand) *
                                      100
                                    ).toFixed(1)}
                                    %
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-slate-500">
                                    Improvement
                                  </div>
                                  <div
                                    className={`text-sm font-bold ${
                                      Number(shortageImprovement) > 5
                                        ? "text-green-600"
                                        : Number(shortageImprovement) > 0
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                    }`}
                                  >
                                    {Number(shortageImprovement) >= 0
                                      ? "↓"
                                      : "↑"}{" "}
                                    {Math.abs(Number(shortageImprovement))}pp
                                  </div>
                                </div>

                                {ward.metrics.isTopPerformer && (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                                {ward.metrics.isCritical && (
                                  <AlertTriangle className="w-5 h-5 text-red-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Ward Details - Right Column */}
              <div className="space-y-6">
                {/* Ward Details */}
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

                      <div className="space-y-3">
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                          <p className="text-xs text-red-700 font-medium mb-1">
                            Shortage
                          </p>
                          <p className="text-xl font-bold text-red-900">
                            {(hoveredWard ||
                              selectedWard)!.after.shortage_pct.toFixed(2)}
                            %
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            ↓{" "}
                            {(
                              (hoveredWard || selectedWard)!.before
                                .shortage_pct -
                              (hoveredWard || selectedWard)!.after.shortage_pct
                            ).toFixed(2)}
                            pp
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-700 font-medium mb-1">
                            Pressure
                          </p>
                          <p className="text-xl font-bold text-blue-900">
                            {(hoveredWard ||
                              selectedWard)!.after.pressure.toFixed(2)}
                            m
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            ↑{" "}
                            {(
                              (hoveredWard || selectedWard)!.after.pressure -
                              (hoveredWard || selectedWard)!.before.pressure
                            ).toFixed(2)}
                            m
                          </p>
                        </div>
                        <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200">
                          <p className="text-xs text-cyan-700 font-medium mb-1">
                            Demand
                          </p>
                          <p className="text-xl font-bold text-cyan-900">
                            {(hoveredWard ||
                              selectedWard)!.after.demand.toFixed(2)}
                          </p>
                          <p className="text-xs text-cyan-600 mt-1">LPS</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <p className="text-xs text-green-700 font-medium mb-1">
                            Supply (After)
                          </p>
                          <p className="text-xl font-bold text-green-900">
                            {(hoveredWard ||
                              selectedWard)!.after.supply.toFixed(2)}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            ↑{" "}
                            {(
                              (hoveredWard || selectedWard)!.after.supply -
                              (hoveredWard || selectedWard)!.before.supply
                            ).toFixed(2)}{" "}
                            LPS
                          </p>
                        </div>
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                          <p className="text-xs text-indigo-700 font-medium mb-1">
                            Supply/Demand Ratio
                          </p>
                          <p className="text-xl font-bold text-indigo-900">
                            {(
                              ((hoveredWard || selectedWard)!.after.supply /
                                (hoveredWard || selectedWard)!.after.demand) *
                              100
                            ).toFixed(2)}
                            %
                          </p>
                          <p className="text-xs text-indigo-600 mt-1">
                            ↑{" "}
                            {(
                              ((hoveredWard || selectedWard)!.after.supply /
                                (hoveredWard || selectedWard)!.after.demand) *
                                100 -
                              ((hoveredWard || selectedWard)!.before.supply /
                                (hoveredWard || selectedWard)!.before.demand) *
                                100
                            ).toFixed(2)}{" "}
                            pp
                          </p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                          <p className="text-xs text-purple-700 font-medium mb-1">
                            Leakage
                          </p>
                          <p className="text-xl font-bold text-purple-900">
                            {(hoveredWard ||
                              selectedWard)!.after.leakage.toFixed(2)}
                            %
                          </p>
                          <p className="text-xs text-purple-600 mt-1">
                            ↓{" "}
                            {(
                              (hoveredWard || selectedWard)!.before.leakage -
                              (hoveredWard || selectedWard)!.after.leakage
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          onWardSelect((hoveredWard || selectedWard)!);
                          setShowIndividualMap(true);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Ward Map
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Legend */}
                <Card className="p-6 bg-white shadow-sm">
                  <h4 className="font-semibold text-slate-900 mb-3">Legend</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm text-slate-600">
                        Good Performance
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-sm text-slate-600">
                        Moderate Performance
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm text-slate-600">
                        Needs Improvement
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span className="text-sm text-slate-600">
                        Top Performer
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-slate-600">
                        Critical Status
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Geographic Ward Boundary - Full Width Below */}
            {selectedWard && showIndividualMap && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-semibold text-slate-900">
                    Geographic Ward Boundary
                  </h4>
                  <Button
                    onClick={() => setShowIndividualMap(false)}
                    variant="outline"
                    size="sm"
                  >
                    Close Map
                  </Button>
                </div>
                <WardDetailMap ward={selectedWard} metricView={metricView} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
