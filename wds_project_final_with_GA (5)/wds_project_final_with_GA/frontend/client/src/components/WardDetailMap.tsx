import { useEffect, useRef, useState } from "react";
import { Card } from "./ui/card";
import {
  MapPin,
  Droplet,
  Gauge,
  TrendingDown,
  AlertCircle,
  Info,
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

interface WardDetailMapProps {
  ward: WardData;
  metricView?:
    | "shortage"
    | "pressure"
    | "efficiency"
    | "leakage"
    | "supplyDemand";
}

export default function WardDetailMap({
  ward,
  metricView = "shortage",
}: WardDetailMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [wardFeature, setWardFeature] = useState<any>(null);
  const [hovering, setHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tooltipData, setTooltipData] = useState<any>(null);

  // --- Fast path: cache GeoJSON and a normalized name → feature index ---
  // Module-level cache to avoid re-fetching and O(n) scans for each ward
  // Using function-scoped singletons keeps types local to this module
  const geoCacheRef = useRef<{
    data?: any;
    index?: Map<string, any>;
    // also store a list for fallback fuzzy matching only once
    normalizedNameList?: Array<{ name: string; feature: any }>;
    loadingPromise?: Promise<any>;
  }>({});

        const normalizeWardName = (name: string) => {
          if (!name) return "";
          return name
            .toLowerCase()
      .replace(/\./g, "")
      .replace(/ward\b/g, "")
            .replace(/\bward\b/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
            .trim();
        };

  const loadGeoJsonOnce = async () => {
    if (geoCacheRef.current.data) return geoCacheRef.current.data;
    if (!geoCacheRef.current.loadingPromise) {
      geoCacheRef.current.loadingPromise = fetch("/BBMP.geojson")
        .then(res => res.json())
        .then(data => {
          // Build index once
          const idx = new Map<string, any>();
          const list: Array<{ name: string; feature: any }> = [];
          try {
            for (const f of data.features || []) {
              const raw = f?.properties?.KGISWardName || "";
              const norm = normalizeWardName(raw);
              if (norm) {
                if (!idx.has(norm)) idx.set(norm, f);
                list.push({ name: norm, feature: f });
              }
            }
          } catch {}
          geoCacheRef.current = { data, index: idx, normalizedNameList: list };
          return data;
        });
    }
    return geoCacheRef.current.loadingPromise;
  };

  useEffect(() => {
    let isActive = true;
    loadGeoJsonOnce()
      .then((data: any) => {
        if (!isActive) return;
        setGeojsonData(data);

        const normalizedWardNameValue = normalizeWardName(ward.name);
        const idx = geoCacheRef.current.index;
        const list = geoCacheRef.current.normalizedNameList || [];

        // 1) Exact match via index
        let feature = idx?.get(normalizedWardNameValue) || null;

        if (!feature) {
          // 2) Contains/contained-in match across precomputed list (one-time array)
          if (normalizedWardNameValue.length > 2) {
            feature =
              list.find(
                e =>
                  e.name.includes(normalizedWardNameValue) ||
                  normalizedWardNameValue.includes(e.name)
              )?.feature || null;
          }
        }

        if (!feature) {
          // 3) Token overlap fallback
          const wardTokens = normalizedWardNameValue.split(" ").filter(Boolean);
          feature =
            list.find(e => {
              const geoTokens = e.name.split(" ").filter(Boolean);
          const common = wardTokens.filter(wt => geoTokens.includes(wt));
              return common.some(t => t.length >= 4);
            })?.feature || null;
        }

        if (feature) {
          try {
            // Optional console for debugging name mismatches
            // console.log(`Matched ${ward.name} → ${feature.properties?.KGISWardName}`);
          } catch {}
        } else {
          console.warn(`⚠️ No ward boundary found for: ${ward.name}`);
        }

        if (isActive) setWardFeature(feature);
      })
      .catch(err => console.error("Error loading GeoJSON:", err));

    return () => {
      isActive = false;
    };
  }, [ward]);

  useEffect(() => {
    if (!wardFeature || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get coordinates from the ward feature
    const coordinates = wardFeature.geometry.coordinates;

    // Calculate bounds
    let minLng = Infinity,
      maxLng = -Infinity;
    let minLat = Infinity,
      maxLat = -Infinity;

    const processCoordinates = (coords: any) => {
      if (typeof coords[0] === "number") {
        minLng = Math.min(minLng, coords[0]);
        maxLng = Math.max(maxLng, coords[0]);
        minLat = Math.min(minLat, coords[1]);
        maxLat = Math.max(maxLat, coords[1]);
      } else {
        coords.forEach((coord: any) => processCoordinates(coord));
      }
    };

    processCoordinates(coordinates);

    const padding = 0.003; // Add padding around the ward
    minLng -= padding;
    maxLng += padding;
    minLat -= padding;
    maxLat += padding;

    const width = canvas.width;
    const height = canvas.height;

    // Calculate scale
    const lngRange = maxLng - minLng;
    const latRange = maxLat - minLat;
    const scale = Math.min(width / lngRange, height / latRange) * 0.85;

    // Calculate offset to center the ward
    const offsetX = (width - lngRange * scale) / 2;
    const offsetY = (height - latRange * scale) / 2;

    // Transform function
    const transform = (lng: number, lat: number): [number, number] => {
      const x = (lng - minLng) * scale + offsetX;
      const y = height - ((lat - minLat) * scale + offsetY);
      return [x, y];
    };

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#f8fafc");
    bgGradient.addColorStop(1, "#e2e8f0");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Determine color based on metric
    let fillColor = "#3b82f6";
    let strokeColor = "#1e40af";
    const shortageImprovement =
      ward.before.shortage_pct - ward.after.shortage_pct;
    const pressureImprovement = ward.after.pressure - ward.before.pressure;

    switch (metricView) {
      case "shortage":
        if (ward.after.shortage_pct < 2) {
          fillColor = "#10b981";
          strokeColor = "#059669";
        } else if (ward.after.shortage_pct < 5) {
          fillColor = "#22c55e";
          strokeColor = "#16a34a";
        } else if (ward.after.shortage_pct < 10) {
          fillColor = "#f59e0b";
          strokeColor = "#d97706";
        } else {
          fillColor = "#ef4444";
          strokeColor = "#dc2626";
        }
        break;
      case "pressure":
        if (pressureImprovement > 2) {
          fillColor = "#10b981";
          strokeColor = "#059669";
        } else if (pressureImprovement > 0) {
          fillColor = "#22c55e";
          strokeColor = "#16a34a";
        } else if (pressureImprovement > -1) {
          fillColor = "#f59e0b";
          strokeColor = "#d97706";
        } else {
          fillColor = "#ef4444";
          strokeColor = "#dc2626";
        }
        break;
      case "efficiency":
        if (shortageImprovement > 5) {
          fillColor = "#10b981";
          strokeColor = "#059669";
        } else if (shortageImprovement > 2) {
          fillColor = "#22c55e";
          strokeColor = "#16a34a";
        } else if (shortageImprovement > 0) {
          fillColor = "#f59e0b";
          strokeColor = "#d97706";
        } else {
          fillColor = "#ef4444";
          strokeColor = "#dc2626";
        }
        break;
      case "leakage":
        if (ward.after.leakage < 0.9) {
          fillColor = "#10b981";
          strokeColor = "#059669";
        } else if (ward.after.leakage < 0.95) {
          fillColor = "#22c55e";
          strokeColor = "#16a34a";
        } else if (ward.after.leakage < 1) {
          fillColor = "#f59e0b";
          strokeColor = "#d97706";
        } else {
          fillColor = "#ef4444";
          strokeColor = "#dc2626";
        }
        break;
      case "supplyDemand":
        const supplyDemandRatio = (ward.after.supply / ward.after.demand) * 100;
        if (supplyDemandRatio >= 98) {
          fillColor = "#10b981";
          strokeColor = "#059669";
        } else if (supplyDemandRatio >= 95) {
          fillColor = "#22c55e";
          strokeColor = "#16a34a";
        } else if (supplyDemandRatio >= 90) {
          fillColor = "#f59e0b";
          strokeColor = "#d97706";
        } else if (supplyDemandRatio >= 85) {
          fillColor = "#fb923c";
          strokeColor = "#ea580c";
        } else {
          fillColor = "#ef4444";
          strokeColor = "#dc2626";
        }
        break;
    }

    // Draw the ward polygon with shadow
    const drawPolygon = (coords: any, isShadow = false) => {
      if (typeof coords[0][0] === "number") {
        ctx.beginPath();
        coords.forEach((coord: any, i: number) => {
          const [x, y] = transform(coord[0], coord[1]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();

        if (isShadow) {
          // Shadow layer
          ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
          ctx.fill();
        } else {
          // Create gradient fill for the ward
          const centerX = width / 2;
          const centerY = height / 2;
          const gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            0,
            centerX,
            centerY,
            Math.max(width, height) / 2
          );

          // Parse the hex color and create lighter/darker variations
          const hex = fillColor.replace("#", "");
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);

          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.6)`);

          ctx.fillStyle = gradient;
          ctx.fill();

          // Stroke with thicker line
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 3;
          ctx.stroke();

          // Inner glow effect
          ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      } else {
        coords.forEach((ring: any) => drawPolygon(ring, isShadow));
      }
    };

    // Draw shadow first (offset)
    ctx.save();
    ctx.translate(4, 4);
    coordinates.forEach((polygon: any) => drawPolygon(polygon, true));
    ctx.restore();

    // Draw actual polygon
    coordinates.forEach((polygon: any) => drawPolygon(polygon, false));

    // Draw ward label with background
    ctx.save();
    ctx.font = "bold 18px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textX = width / 2;
    const textY = height / 2;
    const textMetrics = ctx.measureText(ward.name);
    const textWidth = textMetrics.width;
    const textHeight = 24;

    // Draw text background with rounded corners
    const labelPadding = 12;
    const bgX = textX - textWidth / 2 - labelPadding;
    const bgY = textY - textHeight / 2 - labelPadding / 2;
    const bgWidth = textWidth + labelPadding * 2;
    const bgHeight = textHeight + labelPadding;
    const radius = 8;

    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    ctx.moveTo(bgX + radius, bgY);
    ctx.lineTo(bgX + bgWidth - radius, bgY);
    ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + radius);
    ctx.lineTo(bgX + bgWidth, bgY + bgHeight - radius);
    ctx.quadraticCurveTo(
      bgX + bgWidth,
      bgY + bgHeight,
      bgX + bgWidth - radius,
      bgY + bgHeight
    );
    ctx.lineTo(bgX + radius, bgY + bgHeight);
    ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - radius);
    ctx.lineTo(bgX, bgY + radius);
    ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
    ctx.closePath();
    ctx.fill();

    // Draw text
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#1e293b";
    ctx.fillText(ward.name, textX, textY);
    ctx.restore();

    // Draw decorative corner elements
    const drawCornerDecoration = (x: number, y: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.strokeStyle = fillColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(20, 0);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 20);
      ctx.stroke();
      ctx.restore();
    };

    drawCornerDecoration(20, 20, 0);
    drawCornerDecoration(width - 20, 20, Math.PI / 2);
    drawCornerDecoration(width - 20, height - 20, Math.PI);
    drawCornerDecoration(20, height - 20, -Math.PI / 2);
  }, [wardFeature, ward, metricView]);

  // Handle mouse move for tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    // Set tooltip data
    setTooltipData({
      shortage: ward.after.shortage_pct.toFixed(2),
      pressure: ward.after.pressure.toFixed(2),
      supply: ward.after.supply.toFixed(2),
      leakage: ward.after.leakage.toFixed(2),
      improvement: (ward.before.shortage_pct - ward.after.shortage_pct).toFixed(
        2
      ),
    });
  };

  const shortageImprovement = (
    ward.before.shortage_pct - ward.after.shortage_pct
  ).toFixed(2);
  const pressureImprovement = (
    ward.after.pressure - ward.before.pressure
  ).toFixed(2);
  const leakageReduction = (ward.before.leakage - ward.after.leakage).toFixed(
    2
  );

  return (
    <Card className="p-6 bg-gradient-to-br from-white via-slate-50 to-blue-50 border-slate-200 shadow-xl w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">{ward.name}</h3>
          <p className="text-xs text-slate-600 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Hover over map for detailed metrics
          </p>
        </div>
      </div>

      {/* Horizontal Layout: Map + Metrics */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Map Canvas with Tooltip */}
        <div
          ref={containerRef}
          className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden border-2 border-slate-300 shadow-inner flex-1 lg:w-2/3"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onMouseMove={handleMouseMove}
        >
          {wardFeature ? (
            <>
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full h-auto"
              />

              {/* Hover Tooltip */}
              {hovering && tooltipData && (
                <div
                  className="absolute pointer-events-none z-10 transition-opacity duration-200"
                  style={{
                    left: `${mousePos.x + 15}px`,
                    top: `${mousePos.y + 15}px`,
                  }}
                >
                  <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl border border-slate-700 min-w-[200px]">
                    <div className="text-xs font-semibold text-slate-300 mb-2">
                      {ward.name}
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Shortage:</span>
                        <span className="font-semibold text-red-300">
                          {tooltipData.shortage}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Pressure:</span>
                        <span className="font-semibold text-blue-300">
                          {tooltipData.pressure}m
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Supply:</span>
                        <span className="font-semibold text-green-300">
                          {tooltipData.supply} LPS
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Leakage:</span>
                        <span className="font-semibold text-yellow-300">
                          {tooltipData.leakage}
                        </span>
                      </div>
                      <div className="border-t border-slate-700 pt-1.5 mt-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Improvement:</span>
                          <span className="font-bold text-emerald-300">
                            ↓ {tooltipData.improvement}pp
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-96 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-3 animate-pulse" />
                <p className="text-slate-600 font-medium">
                  Loading ward boundary...
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Searching for: {ward.name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Metrics Grid - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4 flex-1 lg:w-1/3">
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border-2 border-red-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <Droplet className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                Shortage
              </span>
            </div>
            <div className="text-2xl font-bold text-red-900">
              {ward.after.shortage_pct.toFixed(2)}%
            </div>
            <div className="text-xs text-red-700 mt-2 flex items-center gap-1">
              {Number(shortageImprovement) >= 0 ? "↓" : "↑"}
              <span className="font-semibold">
                {Math.abs(Number(shortageImprovement)).toFixed(2)}pp
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Gauge className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                Pressure
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {ward.after.pressure.toFixed(2)}m
            </div>
            <div className="text-xs text-blue-700 mt-2 flex items-center gap-1">
              {Number(pressureImprovement) >= 0 ? "↑" : "↓"}
              <span className="font-semibold">
                {Math.abs(Number(pressureImprovement)).toFixed(2)}m
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                Leakage
              </span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {ward.after.leakage.toFixed(2)}
            </div>
            <div className="text-xs text-green-700 mt-2 flex items-center gap-1">
              {Number(leakageReduction) >= 0 ? "↓" : "↑"}
              <span className="font-semibold">
                {Math.abs(Number(leakageReduction)).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Droplet className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                Supply
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {ward.after.supply.toFixed(2)}
            </div>
            <div className="text-xs text-purple-700 mt-2">
              <span className="font-semibold">LPS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation with improved styling - Full Width Below */}
      <div className="mt-6 bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-xl border-2 border-slate-200 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-1">
              Analysis
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {ward.explanation}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
