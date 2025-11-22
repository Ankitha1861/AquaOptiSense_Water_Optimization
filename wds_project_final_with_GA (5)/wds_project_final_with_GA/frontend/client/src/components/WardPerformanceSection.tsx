import { useState } from "react";
import AllWardsLeafletMap from "./AllWardsLeafletMap";
import { Button } from "./ui/button";
import { Droplet, Gauge, TrendingUp, Zap } from "lucide-react";

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

interface WardPerformanceSectionProps {
  wards: WardData[];
}

export default function WardPerformanceSection({
  wards,
}: WardPerformanceSectionProps) {
  const [metricView, setMetricView] = useState<
    "shortage" | "pressure" | "efficiency" | "leakage" | "supplyDemand"
  >("shortage");

  return (
    <section
      id="ward-performance"
      className="py-20 md:py-32 bg-gradient-to-br from-slate-50 to-blue-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
              Ward Performance Analysis
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Interactive map showing all {wards.length} wards with real-time
              performance metrics - hover over any ward to see details
            </p>
          </div>

          {/* Metric View Selector */}
          <div className="flex justify-center">
            <div className="inline-flex gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
              <Button
                onClick={() => setMetricView("shortage")}
                variant={metricView === "shortage" ? "default" : "outline"}
                className={`flex items-center gap-2 ${
                  metricView === "shortage"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Droplet className="w-4 h-4" />
                Shortage
              </Button>
              <Button
                onClick={() => setMetricView("pressure")}
                variant={metricView === "pressure" ? "default" : "outline"}
                className={`flex items-center gap-2 ${
                  metricView === "pressure"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Gauge className="w-4 h-4" />
                Pressure
              </Button>
              <Button
                onClick={() => setMetricView("efficiency")}
                variant={metricView === "efficiency" ? "default" : "outline"}
                className={`flex items-center gap-2 ${
                  metricView === "efficiency"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Efficiency
              </Button>
              <Button
                onClick={() => setMetricView("leakage")}
                variant={metricView === "leakage" ? "default" : "outline"}
                className={`flex items-center gap-2 ${
                  metricView === "leakage"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Zap className="w-4 h-4" />
                Leakage
              </Button>
              <Button
                onClick={() => setMetricView("supplyDemand")}
                variant={metricView === "supplyDemand" ? "default" : "outline"}
                className={`flex items-center gap-2 ${
                  metricView === "supplyDemand"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Droplet className="w-4 h-4" />
                Supply vs Demand
              </Button>
            </div>
          </div>

          {/* All Wards Map */}
          <AllWardsLeafletMap wards={wards} metricView={metricView} />
        </div>
      </div>
    </section>
  );
}
