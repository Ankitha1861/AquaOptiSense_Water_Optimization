import { useEffect, useRef, useState } from "react";
import { Card } from "./ui/card";
import { MapPin, Droplet, Gauge, AlertCircle } from "lucide-react";

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

interface AllWardsLeafletMapProps {
  wards: WardData[];
  metricView?:
    | "shortage"
    | "pressure"
    | "efficiency"
    | "leakage"
    | "supplyDemand";
}

export default function AllWardsLeafletMap({
  wards,
  metricView = "shortage",
}: AllWardsLeafletMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [hoveredWard, setHoveredWard] = useState<any>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [bounds, setBounds] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [renderedWardsCount, setRenderedWardsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Cache for rendered layers
  const layerCacheRef = useRef<{ [key: string]: ImageData }>({});
  const lastRenderRef = useRef<{ zoom: number; pan: { x: number; y: number } }>(
    { zoom: 1, pan: { x: 0, y: 0 } }
  );
  const renderTimeoutRef = useRef<number | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simplify polygon coordinates for better performance
  const simplifyPolygon = (
    coords: any[],
    tolerance: number = 0.00001
  ): any[] => {
    if (typeof coords[0][0] === "number") {
      // Simple distance-based point reduction
      return coords.filter((_, i) => {
        if (i === 0 || i === coords.length - 1) return true;
        const prev = coords[i - 1];
        const curr = coords[i];
        const dx = prev[0] - curr[0];
        const dy = prev[1] - curr[1];
        return Math.sqrt(dx * dx + dy * dy) > tolerance;
      });
    }
    return coords.map(ring => simplifyPolygon(ring, tolerance));
  };

  // Cache for simplified GeoJSON
  const simplifiedGeoJsonRef = useRef<any>(null);
  // Track if we already drew a quick preview for the current view key
  const lastPreviewKeyRef = useRef<string>("");

  // Clear all refs and state when component unmounts or remounts
  useEffect(() => {
    return () => {
      setGeojsonData(null);
      setBounds(null);
      setIsLoading(true);
      setHoveredWard(null);
      layerCacheRef.current = {};
      lastPreviewKeyRef.current = "";
      if (offscreenCanvasRef.current) {
        offscreenCanvasRef.current = null;
      }
      if (renderTimeoutRef.current) {
        cancelAnimationFrame(renderTimeoutRef.current);
        renderTimeoutRef.current = null;
      }
    };
  }, []);

  // Load GeoJSON data and precompute ward↔feature mapping
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      if (!isMounted) return;

      setIsLoading(true);
      setGeojsonData(null);
      setBounds(null);

      try {
        const response = await fetch("/BBMP.geojson", {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache", // Prevent stale data
            Pragma: "no-cache",
          },
        });
        const data = await response.json();

        if (!isMounted) return;

        // Simplify geometries for better performance
        if (!simplifiedGeoJsonRef.current) {
          const simplifiedFeatures = data.features.map((f: any) => ({
            ...f,
            geometry: {
              ...f.geometry,
              // Use higher tolerance for city-scale first paint
              coordinates: simplifyPolygon(f.geometry.coordinates, 0.0005),
            },
          }));
          // Also compute an ultra-simplified preview coordinate set to draw instantly
          const previewFeatures = data.features.map((f: any) => ({
            ...f,
            __previewCoordinates: simplifyPolygon(
              f.geometry.coordinates,
              0.005
            ),
          }));
          simplifiedGeoJsonRef.current = {
            ...data,
            features: simplifiedFeatures.map((sf: any, i: number) => ({
              ...sf,
              __previewCoordinates: previewFeatures[i].__previewCoordinates,
            })),
          };
        }

        const workingData = simplifiedGeoJsonRef.current;

        // Calculate bounds
        let minLng = Infinity,
          maxLng = -Infinity;
        let minLat = Infinity,
          maxLat = -Infinity;

        workingData.features.forEach((feature: any) => {
          const coords = feature.geometry.coordinates;
          const processCoords = (c: any) => {
            if (typeof c[0] === "number") {
              minLng = Math.min(minLng, c[0]);
              maxLng = Math.max(maxLng, c[0]);
              minLat = Math.min(minLat, c[1]);
              maxLat = Math.max(maxLat, c[1]);
            } else {
              c.forEach((sub: any) => processCoords(sub));
            }
          };
          processCoords(coords);
        });

        if (isMounted) {
          setBounds({ minLng, maxLng, minLat, maxLat });

          // Build ward↔feature mapping so we can ensure every ward-data entry is attempted to be mapped
          try {
            const features = workingData.features || [];

            // Create a spatial index for faster point-in-polygon checks
            const featuresWithBounds = features.map((f: any, index: number) => {
              let fMinLng = Infinity,
                fMaxLng = -Infinity;
              let fMinLat = Infinity,
                fMaxLat = -Infinity;

              const processCoords = (c: any) => {
                if (typeof c[0] === "number") {
                  fMinLng = Math.min(fMinLng, c[0]);
                  fMaxLng = Math.max(fMaxLng, c[0]);
                  fMinLat = Math.min(fMinLat, c[1]);
                  fMaxLat = Math.max(fMaxLat, c[1]);
                } else {
                  c.forEach((sub: any) => processCoords(sub));
                }
              };
              processCoords(f.geometry.coordinates);

              return {
                ...f,
                __bounds: {
                  minLng: fMinLng,
                  maxLng: fMaxLng,
                  minLat: fMinLat,
                  maxLat: fMaxLat,
                },
                __index: index,
              };
            });

            // Reuse normalization and similarity helpers from above (defined in file scope)
            const normalizeLocal = (s: string) =>
              normalizeWardName(String(s || ""));

            // Simple Levenshtein and similarity functions (copied from matching logic)
            const levenshteinLocal = (a: string, b: string) => {
              const an = a.length;
              const bn = b.length;
              if (an === 0) return bn;
              if (bn === 0) return an;
              const matrix: number[][] = Array.from({ length: an + 1 }, () =>
                new Array(bn + 1).fill(0)
              );
              for (let i = 0; i <= an; i++) matrix[i][0] = i;
              for (let j = 0; j <= bn; j++) matrix[0][j] = j;
              for (let i = 1; i <= an; i++) {
                for (let j = 1; j <= bn; j++) {
                  const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                  matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                  );
                }
              }
              return matrix[an][bn];
            };

            const similarityLocal = (a: string, b: string) => {
              const A = normalizeLocal(a);
              const B = normalizeLocal(b);
              if (!A && !B) return 0;
              const dist = levenshteinLocal(A, B);
              return 1 - dist / Math.max(A.length, B.length, 1);
            };

            // Threshold for mapping ward-data -> geo features. Tuned to cover most matches while avoiding bad matches.
            const MATCH_THRESHOLD = 0.5; // can be tuned

            const featureBestMatch: Array<
              { wardIndex: number; score: number } | undefined
            > = new Array(features.length).fill(undefined);
            const wardToFeatureIndices: Record<number, number[]> = {};

            // Web Worker would be ideal here, but for now we'll chunk the processing
            const CHUNK_SIZE = 50;
            let processedCount = 0;

            const processNextChunk = () => {
              const chunk = features.slice(
                processedCount,
                processedCount + CHUNK_SIZE
              );
              if (chunk.length === 0) {
                // All chunks processed, finalize
                const matchedWardCount = Object.values(
                  wardToFeatureIndices
                ).filter(arr => arr.length > 0).length;
                setRenderedWardsCount(matchedWardCount);

                // Build reverse mapping for quick lookup
                const featureToWardIndex: Array<number | undefined> =
                  featureBestMatch.map(x => (x ? x.wardIndex : undefined));

                // Store mappings and spatial index in the geojson data
                setGeojsonData({
                  ...workingData,
                  __featureToWardIndex: featureToWardIndex,
                  __wardToFeatureIndices: wardToFeatureIndices,
                  __featuresWithBounds: featuresWithBounds,
                });
                return;
              }

              // Process this chunk
              chunk.forEach((feature: any, chunkIndex: number) => {
                const fi = processedCount + chunkIndex;
                const fname = normalizeLocal(
                  feature.properties?.KGISWardName ||
                    feature.properties?.KGISWardNo ||
                    ""
                );

                wards.forEach((ward: any, wIndex: number) => {
                  const wn = normalizeLocal(ward.name || ward.id || "");
                  if (!wardToFeatureIndices[wIndex]) {
                    wardToFeatureIndices[wIndex] = [];
                  }

                  // exact contains checks
                  if (
                    fname === wn ||
                    fname.includes(wn) ||
                    wn.includes(fname)
                  ) {
                    const score = 1;
                    wardToFeatureIndices[wIndex].push(fi);
                    const prev = featureBestMatch[fi];
                    if (!prev || score > prev.score) {
                      featureBestMatch[fi] = { wardIndex: wIndex, score };
                    }
                    return;
                  }

                  const score = similarityLocal(wn, fname);
                  if (score >= MATCH_THRESHOLD) {
                    wardToFeatureIndices[wIndex].push(fi);
                    const prev = featureBestMatch[fi];
                    if (!prev || score > prev.score) {
                      featureBestMatch[fi] = { wardIndex: wIndex, score };
                    }
                  }
                });
              });

              processedCount += chunk.length;
              requestAnimationFrame(processNextChunk);
            };

            // Start processing chunks
            requestAnimationFrame(processNextChunk);
          } catch (e) {
            console.warn("Mapping wards to features failed", e);
          }
        }
      } catch (error) {
        console.error("Error loading GeoJSON:", error);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [wards]);

  // Normalize ward names for matching
  const normalizeWardName = (name: string) => {
    return name.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  };

  // Levenshtein distance (for fuzzy matching)
  const levenshtein = (a: string, b: string) => {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = Array.from({ length: an + 1 }, () =>
      new Array(bn + 1).fill(0)
    );
    for (let i = 0; i <= an; i++) matrix[i][0] = i;
    for (let j = 0; j <= bn; j++) matrix[0][j] = j;
    for (let i = 1; i <= an; i++) {
      for (let j = 1; j <= bn; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[an][bn];
  };

  const similarity = (a: string, b: string) => {
    const A = normalizeWardName(a);
    const B = normalizeWardName(b);
    if (!A && !B) return 0;
    const dist = levenshtein(A, B);
    return 1 - dist / Math.max(A.length, B.length, 1);
  };

  // Get ward data by GeoJSON feature using multiple strategies and fuzzy matching
  const getWardDataByFeature = (feature: any) => {
    const geojsonName = normalizeWardName(
      feature.properties?.KGISWardName || ""
    );
    const geojsonNo = String(
      feature.properties?.KGISWardNo || feature.properties?.KGISWardID || ""
    ).toLowerCase();

    // 1) Exact or contains matches (fast)
    let found = wards.find(ward => {
      const wardName = normalizeWardName(ward.name);
      return (
        geojsonName === wardName ||
        geojsonName.includes(wardName) ||
        wardName.includes(geojsonName)
      );
    });
    if (found) return found;

    // 2) Match by ward number if ward-data includes it in id or name
    found = wards.find(ward => {
      const id = String(ward.id || "").toLowerCase();
      const name = normalizeWardName(ward.name || "");
      return (
        id.includes(geojsonNo) || name.includes(geojsonNo) || id === geojsonNo
      );
    });
    if (found) return found;

    // 3) Fuzzy match: pick best ward with similarity above threshold
    let best: { ward?: any; score: number } = { ward: undefined, score: 0 };
    wards.forEach(ward => {
      const wardName = ward.name || ward.id || "";
      const score = similarity(geojsonName, wardName);
      if (score > best.score) best = { ward, score };
    });

    // Threshold; tuneable. 0.6 is permissive, 0.7 more strict.
    if (best.score >= 0.68) return best.ward;

    return undefined;
  };

  // Create a safe fallback WardData when there is no matching ward entry
  const createFallbackWard = (feature: any): WardData => {
    const name =
      feature.properties?.KGISWardName ||
      feature.properties?.KGISWardNo ||
      "Unknown Ward";
    const id = String(
      feature.properties?.KGISWardNo || feature.properties?.KGISWardID || name
    ).toLowerCase();
    return {
      id,
      name,
      before: {
        pressure: 0,
        demand: 0,
        supply: 0,
        shortage: 0,
        shortage_pct: 0,
        leakage: 0,
      },
      after: {
        pressure: 0,
        demand: 0,
        supply: 0,
        shortage: 0,
        shortage_pct: 0,
        leakage: 0,
      },
      explanation: "No metrics available",
    };
  };

  // Get color based on metric
  const getWardColor = (ward: WardData) => {
    const shortageImprovement =
      ward.before.shortage_pct - ward.after.shortage_pct;
    const pressureImprovement = ward.after.pressure - ward.before.pressure;

    switch (metricView) {
      case "shortage":
        if (ward.after.shortage_pct < 2)
          return { fill: "#10b981", stroke: "#059669" };
        if (ward.after.shortage_pct < 5)
          return { fill: "#22c55e", stroke: "#16a34a" };
        if (ward.after.shortage_pct < 10)
          return { fill: "#f59e0b", stroke: "#d97706" };
        return { fill: "#ef4444", stroke: "#dc2626" };
      case "pressure":
        if (pressureImprovement > 2)
          return { fill: "#10b981", stroke: "#059669" };
        if (pressureImprovement > 0)
          return { fill: "#22c55e", stroke: "#16a34a" };
        if (pressureImprovement > -1)
          return { fill: "#f59e0b", stroke: "#d97706" };
        return { fill: "#ef4444", stroke: "#dc2626" };
      case "efficiency":
        if (shortageImprovement > 5)
          return { fill: "#10b981", stroke: "#059669" };
        if (shortageImprovement > 2)
          return { fill: "#22c55e", stroke: "#16a34a" };
        if (shortageImprovement > 0)
          return { fill: "#f59e0b", stroke: "#d97706" };
        return { fill: "#ef4444", stroke: "#dc2626" };
      case "leakage":
        if (ward.after.leakage < 0.9)
          return { fill: "#10b981", stroke: "#059669" };
        if (ward.after.leakage < 0.95)
          return { fill: "#22c55e", stroke: "#16a34a" };
        if (ward.after.leakage < 1)
          return { fill: "#f59e0b", stroke: "#d97706" };
        return { fill: "#ef4444", stroke: "#dc2626" };
      case "supplyDemand":
        const supplyDemandRatio = (ward.after.supply / ward.after.demand) * 100;
        if (supplyDemandRatio >= 98)
          return { fill: "#10b981", stroke: "#059669" };
        if (supplyDemandRatio >= 95)
          return { fill: "#22c55e", stroke: "#16a34a" };
        if (supplyDemandRatio >= 90)
          return { fill: "#f59e0b", stroke: "#d97706" };
        if (supplyDemandRatio >= 85)
          return { fill: "#fb923c", stroke: "#ea580c" };
        return { fill: "#ef4444", stroke: "#dc2626" };
      default:
        return { fill: "#3b82f6", stroke: "#1e40af" };
    }
  };

  // Initialize and handle canvas setup
  useEffect(() => {
    const setupCanvas = () => {
      if (!canvasRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set up main canvas
      const mainCanvas = canvasRef.current;
      mainCanvas.width = rect.width * dpr;
      mainCanvas.height = rect.height * dpr;
      mainCanvas.style.width = `${rect.width}px`;
      mainCanvas.style.height = `${rect.height}px`;

      // Set up offscreen canvas
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = mainCanvas.width;
      offscreenCanvas.height = mainCanvas.height;
      offscreenCanvasRef.current = offscreenCanvas;

      // Clear any existing cache and state
      layerCacheRef.current = {};
      lastPreviewKeyRef.current = "";
      lastRenderRef.current = { zoom: 1, pan: { x: 0, y: 0 } };

      // Force initial clear
      const ctx = mainCanvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, rect.width, rect.height);
      }

      setIsLoading(true);
    };

    // Initial setup
    setupCanvas();

    // Handle window resize
    const handleResize = () => {
      if (renderTimeoutRef.current) {
        cancelAnimationFrame(renderTimeoutRef.current);
        renderTimeoutRef.current = null;
      }
      setupCanvas();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (renderTimeoutRef.current) {
        cancelAnimationFrame(renderTimeoutRef.current);
        renderTimeoutRef.current = null;
      }
      offscreenCanvasRef.current = null;
      layerCacheRef.current = {};
    };
  }, []);

  // Safely convert hex colors to rgba() for canvas fill with alpha
  const hexToRgba = (hex: string, alpha: number) => {
    const value = hex.replace("#", "").trim();
    const r = parseInt(value.substring(0, 2), 16);
    const g = parseInt(value.substring(2, 4), 16);
    const b = parseInt(value.substring(4, 6), 16);
    const a = Math.max(0, Math.min(1, alpha));
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return hex;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  // Memoize expensive transform calculations
  const getTransformParams = (width: number, height: number) => {
    if (!bounds) return null;
    const padding = 0.02;
    const minLng = bounds.minLng - padding;
    const maxLng = bounds.maxLng + padding;
    const minLat = bounds.minLat - padding;
    const maxLat = bounds.maxLat + padding;

    const lngRange = maxLng - minLng;
    const latRange = maxLat - minLat;
    const baseScale = Math.min(width / lngRange, height / latRange) * 0.98;
    const scale = baseScale * zoom;

    return { minLng, maxLng, minLat, maxLat, scale };
  };

  // Draw all wards with zoom and pan
  useEffect(() => {
    if (!canvasRef.current || !geojsonData || !bounds) {
      setIsLoading(true);
      return;
    }

    // Cancel any pending renders
    if (renderTimeoutRef.current) {
      cancelAnimationFrame(renderTimeoutRef.current);
    }

    // Ensure canvas is properly sized on mount/refresh
    const mainCanvas = canvasRef.current;
    const container = containerRef.current;
    if (mainCanvas && container) {
      const rect = container.getBoundingClientRect();
      const newWidth = rect.width * window.devicePixelRatio;
      const newHeight = rect.height * window.devicePixelRatio;
      if (mainCanvas.width !== newWidth || mainCanvas.height !== newHeight) {
        mainCanvas.width = newWidth;
        mainCanvas.height = newHeight;
        if (offscreenCanvasRef.current) {
          offscreenCanvasRef.current.width = newWidth;
          offscreenCanvasRef.current.height = newHeight;
        }
        // Clear cache as dimensions changed
        layerCacheRef.current = {};
      }
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    // Fallback: if offscreen buffer not ready, draw directly to visible canvas
    const offscreenCanvas = offscreenCanvasRef.current || canvas;
    const offscreenCtx = offscreenCanvas.getContext("2d", { alpha: false });
    if (!offscreenCtx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Build cache key (but do not early-return; still redraw to avoid blank state)
    const cacheKey = `${zoom.toFixed(2)}_${pan.x.toFixed(0)}_${pan.y.toFixed(0)}_${metricView}`;
    const cachedLayer = layerCacheRef.current[cacheKey];
    if (cachedLayer) {
      try {
        ctx.putImageData(cachedLayer, 0, 0);
      } catch {}
    }

    // Get transform parameters
    const transformParams = getTransformParams(width, height);
    if (!transformParams) return;
    const { minLng, maxLng, minLat, maxLat, scale } = transformParams;

    const lngRange = maxLng - minLng;
    const latRange = maxLat - minLat;
    const offsetX = (width - lngRange * scale) / 2 + pan.x;
    const offsetY = (height - latRange * scale) / 2 + pan.y;

    // Always ensure a render pass on mount/refresh; throttle with requestAnimationFrame for perf
    const viewChanged =
      Math.abs(lastRenderRef.current.zoom - zoom) > 0.01 ||
      Math.abs(lastRenderRef.current.pan.x - pan.x) > 1 ||
      Math.abs(lastRenderRef.current.pan.y - pan.y) > 1;

    const transform = (lng: number, lat: number): [number, number] => {
      const x = (lng - minLng) * scale + offsetX;
      // Correct Y transform: invert latitude then apply offset
      const y = height - (lat - minLat) * scale - offsetY;
      return [x, y];
    };

    // Clear offscreen canvas
    offscreenCtx.clearRect(0, 0, width, height);

    // Instant preview: draw ultra-simplified polygons with neutral color, no strokes
    // Only if not already previewed for this view key (zoom/pan/metric)
    const previewKey = `${zoom.toFixed(2)}_${pan.x.toFixed(0)}_${pan.y.toFixed(0)}_${metricView}_preview`;
    if (lastPreviewKeyRef.current !== previewKey) {
      const previewFill = hexToRgba("#94a3b8", 0.8); // slate-400 with alpha
      offscreenCtx.fillStyle = previewFill;
      offscreenCtx.strokeStyle = "#cbd5e1";
      offscreenCtx.lineWidth = 0; // no stroke for speed

      const drawPreviewPolygon = (coords: any) => {
        if (typeof coords[0][0] === "number") {
          offscreenCtx.beginPath();
          coords.forEach((coord: any, i: number) => {
            const [x, y] = transform(coord[0], coord[1]);
            if (i === 0) offscreenCtx.moveTo(x, y);
            else offscreenCtx.lineTo(x, y);
          });
          offscreenCtx.closePath();
          offscreenCtx.fill();
        } else {
          coords.forEach((ring: any) => drawPreviewPolygon(ring));
        }
      };

      try {
        for (let i = 0; i < geojsonData.features.length; i++) {
          const feature = geojsonData.features[i];
          const pcoords =
            feature.__previewCoordinates || feature.geometry.coordinates;
          if (pcoords) {
            if (Array.isArray(pcoords[0]) && Array.isArray(pcoords[0][0])) {
              pcoords.forEach((poly: any) => drawPreviewPolygon(poly));
            } else {
              drawPreviewPolygon(pcoords);
            }
          }
        }
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(offscreenCanvas, 0, 0);
        lastPreviewKeyRef.current = previewKey;
      } catch {}

      // Prepare for detailed pass
      offscreenCtx.clearRect(0, 0, width, height);
      const bgGradient = offscreenCtx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, "#f8fafc");
      bgGradient.addColorStop(1, "#e2e8f0");
      offscreenCtx.fillStyle = bgGradient;
      offscreenCtx.fillRect(0, 0, width, height);
    }

    // Draw gradient background (already prepared after preview; redo to be safe)
    const bgGradient = offscreenCtx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#f8fafc");
    bgGradient.addColorStop(1, "#e2e8f0");
    offscreenCtx.fillStyle = bgGradient;
    offscreenCtx.fillRect(0, 0, width, height);

    // Use precomputed feature->ward mapping if available
    const featureToWardIndex: Array<number | undefined> =
      geojsonData.__featureToWardIndex || [];

    // Immediate outline preview to verify bounds and prevent blank screen
    try {
      offscreenCtx.save();
      offscreenCtx.strokeStyle = "#64748b";
      offscreenCtx.lineWidth = 0.6;
      const drawOutline = (coords: any) => {
        if (typeof coords[0][0] === "number") {
          offscreenCtx.beginPath();
          coords.forEach((coord: any, i: number) => {
            const lng = coord[0];
            const lat = coord[1];
            if (Number.isFinite(lng) && Number.isFinite(lat)) {
              const [x, y] = transform(lng, lat);
              if (i === 0) offscreenCtx.moveTo(x, y);
              else offscreenCtx.lineTo(x, y);
            }
          });
          offscreenCtx.closePath();
          offscreenCtx.stroke();
        } else {
          coords.forEach((ring: any) => drawOutline(ring));
        }
      };
      for (let i = 0; i < Math.min(geojsonData.features.length, 40); i++) {
        const feature = geojsonData.features[i];
        const pcoords =
          feature.__previewCoordinates || feature.geometry.coordinates;
        if (Array.isArray(pcoords[0]) && Array.isArray(pcoords[0][0])) {
          pcoords.forEach((poly: any) => drawOutline(poly));
        } else {
          drawOutline(pcoords);
        }
      }
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(offscreenCanvas, 0, 0);
      offscreenCtx.restore();
    } catch {}

    // Draw wards in chunks to prevent UI blocking
    let renderedCount = 0;
    let chunkIndex = 0;
    const CHUNK_SIZE = 120;

    const renderNextChunk = () => {
      const startIndex = chunkIndex * CHUNK_SIZE;
      const endIndex = Math.min(
        startIndex + CHUNK_SIZE,
        geojsonData.features.length
      );

      for (let fi = startIndex; fi < endIndex; fi++) {
        const feature = geojsonData.features[fi];
        const wardIndex =
          typeof featureToWardIndex[fi] === "number"
            ? (featureToWardIndex[fi] as number)
            : undefined;
        const wardData =
          typeof wardIndex === "number" ? wards[wardIndex] : undefined;
        const wardInfo = wardData || createFallbackWard(feature);

        if (wardData) renderedCount++;
        const colors = wardData
          ? getWardColor(wardInfo)
          : { fill: "#94a3b8", stroke: "#64748b" };
        const coordinates = feature.geometry.coordinates;

        const drawPolygon = (coords: any, isHovered: boolean) => {
          if (typeof coords[0][0] === "number") {
            offscreenCtx.beginPath();
            let lastX: number | null = null;
            let lastY: number | null = null;

            coords.forEach((coord: any, i: number) => {
              const [x, y] = transform(coord[0], coord[1]);
              // Skip points that are too close to the last drawn point
              if (
                i === 0 ||
                !lastX ||
                !lastY ||
                Math.abs(x - lastX) > 1 ||
                Math.abs(y - lastY) > 1
              ) {
                if (i === 0) offscreenCtx.moveTo(x, y);
                else offscreenCtx.lineTo(x, y);
                lastX = x;
                lastY = y;
              }
            });
            offscreenCtx.closePath();

            // Fill with color; use opaque fill for strong visibility
            offscreenCtx.fillStyle = colors.fill;
            offscreenCtx.fill();

            // Stroke (thin to reduce draw cost). Heavier stroke only when hovered
            offscreenCtx.strokeStyle = colors.stroke;
            offscreenCtx.lineWidth = isHovered ? 3 : 1.2;
            offscreenCtx.stroke();

            // Add hover highlight
            if (isHovered) {
              offscreenCtx.strokeStyle = "rgba(255, 255, 255, 0.6)";
              offscreenCtx.lineWidth = 1;
              offscreenCtx.stroke();
            }
          } else {
            coords.forEach((ring: any) => drawPolygon(ring, isHovered));
          }
        };

        // Use feature identity for hover comparison (more robust than name equality)
        const isHovered = hoveredWard && hoveredWard.feature === feature;

        coordinates.forEach((polygon: any) => drawPolygon(polygon, isHovered));

        // Draw ward label for hovered ward
        if (isHovered) {
          const centerCoords = coordinates[0][0];
          let sumX = 0,
            sumY = 0,
            count = 0;
          centerCoords.forEach((coord: any) => {
            if (typeof coord[0] === "number") {
              sumX += coord[0];
              sumY += coord[1];
              count++;
            }
          });
          const [labelX, labelY] = transform(sumX / count, sumY / count);

          offscreenCtx.save();
          offscreenCtx.font = "bold 11px Inter, system-ui, sans-serif";
          offscreenCtx.textAlign = "center";
          offscreenCtx.textBaseline = "middle";
          offscreenCtx.fillStyle = "rgba(255, 255, 255, 0.95)";
          offscreenCtx.strokeStyle = colors.stroke;
          offscreenCtx.lineWidth = 3;
          offscreenCtx.strokeText(wardInfo.name, labelX, labelY);
          offscreenCtx.fillText(wardInfo.name, labelX, labelY);
          offscreenCtx.restore();
        }
      }

      // Flush progressively every chunk so shapes appear immediately
      ctx.clearRect(0, 0, width, height);
      // Ensure non-transparent background even if nothing drawn yet
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(offscreenCanvas, 0, 0);

      if (endIndex >= geojsonData.features.length) {
        // All chunks rendered
        // Final flush already done above

        // Cache the final result
        layerCacheRef.current[cacheKey] = ctx.getImageData(0, 0, width, height);
        lastRenderRef.current = { zoom, pan: { ...pan } };

        // Update stats
        if (!geojsonData.__wardToFeatureIndices) {
          setRenderedWardsCount(renderedCount);
        }
        setIsLoading(false);
      } else {
        // Schedule next chunk
        chunkIndex++;
        renderTimeoutRef.current = requestAnimationFrame(renderNextChunk);
      }
    };

    // Start rendering chunks
    setIsLoading(true);
    renderNextChunk();

    return () => {
      if (renderTimeoutRef.current) {
        cancelAnimationFrame(renderTimeoutRef.current);
      }
    };
  }, [geojsonData, bounds, wards, metricView, hoveredWard, zoom, pan]);

  // Handle mouse move for hover detection
  const handleMouseMoveHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !geojsonData || !bounds) {
      console.warn("Missing required data for rendering:", {
        hasCanvas: !!canvasRef.current,
        hasGeojsonData: !!geojsonData,
        hasBounds: !!bounds,
      });
      setIsLoading(true);
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
    const y = ((e.clientY - rect.top) * canvas.height) / rect.height;

    const width = canvas.width;
    const height = canvas.height;

    const padding = 0.02; // Match the drawing padding
    const minLng = bounds.minLng - padding;
    const maxLng = bounds.maxLng + padding;
    const minLat = bounds.minLat - padding;
    const maxLat = bounds.maxLat + padding;

    const lngRange = maxLng - minLng;
    const latRange = maxLat - minLat;
    const baseScale = Math.min(width / lngRange, height / latRange) * 0.98; // Match the drawing scale
    const scale = baseScale * zoom;

    const offsetX = (width - lngRange * scale) / 2 + pan.x;
    const offsetY = (height - latRange * scale) / 2 + pan.y;

    // Convert mouse position to lat/lng
    const lng = (x - offsetX) / scale + minLng;
    const lat = (height - y - offsetY) / scale + minLat;

    // Check which ward contains this point
    let foundWard: any = null;

    const featureToWardIndex: Array<number | undefined> =
      geojsonData.__featureToWardIndex || [];

    const pointInPolygon = (point: [number, number], polygon: any): boolean => {
      if (typeof polygon[0][0] === "number") {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const xi = polygon[i][0],
            yi = polygon[i][1];
          const xj = polygon[j][0],
            yj = polygon[j][1];
          const intersect =
            yi > point[1] !== yj > point[1] &&
            point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
          if (intersect) inside = !inside;
        }
        return inside;
      } else {
        return polygon.some((ring: any) => pointInPolygon(point, ring));
      }
    };

    for (let fi = 0; fi < geojsonData.features.length; fi++) {
      const feature = geojsonData.features[fi];
      const coordinates = feature.geometry.coordinates;

      if (coordinates.some((poly: any) => pointInPolygon([lng, lat], poly))) {
        // Use precomputed mapping if available, otherwise fall back to fuzzy matching
        const wardIndex =
          typeof featureToWardIndex[fi] === "number"
            ? (featureToWardIndex[fi] as number)
            : undefined;
        const wardData =
          typeof wardIndex === "number"
            ? wards[wardIndex]
            : getWardDataByFeature(feature);

        // Always return the feature and either real ward data or fallback so tooltip works for all wards
        foundWard = { feature, ward: wardData || createFallbackWard(feature) };
        break;
      }
    }

    setHoveredWard(foundWard);
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => {
    setHoveredWard(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else {
      handleMouseMoveHover(e);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.3, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.3, 0.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 5));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-linear-to-br from-white via-slate-50 to-blue-50 border-slate-200 shadow-xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  All Wards Interactive Map
                </h3>
                <p className="text-sm text-slate-600">
                  Hover over any ward to see detailed metrics •{" "}
                  {renderedWardsCount} of{" "}
                  {geojsonData?.features?.length ?? wards.length} wards rendered
                  • Zoom: {zoom.toFixed(1)}x
                </p>
                {geojsonData &&
                  renderedWardsCount < (geojsonData?.features?.length ?? 0) && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠{" "}
                      {(geojsonData?.features?.length ?? 0) -
                        renderedWardsCount}{" "}
                      wards not rendered correctly
                    </p>
                  )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomIn}
                className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                title="Zoom In"
              >
                <svg
                  className="w-5 h-5 text-slate-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                  />
                </svg>
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                title="Zoom Out"
              >
                <svg
                  className="w-5 h-5 text-slate-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                  />
                </svg>
              </button>
              <button
                onClick={handleResetView}
                className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                title="Reset View"
              >
                <svg
                  className="w-5 h-5 text-slate-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Map Canvas with Tooltip */}
          <div
            ref={containerRef}
            className="relative bg-linear-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden border-2 border-slate-300 shadow-inner"
          >
            {geojsonData && bounds ? (
              <>
                <canvas
                  ref={canvasRef}
                  width={1600}
                  height={1000}
                  className="w-full h-auto max-w-full"
                  style={{
                    display: "block",
                    maxHeight: "85vh",
                    cursor: isPanning ? "grabbing" : "grab",
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={e => {
                    handleMouseLeave();
                    handleMouseUp();
                  }}
                  onWheel={handleWheel}
                />

                {/* Hover Tooltip */}
                {hoveredWard && (
                  <div
                    className="absolute pointer-events-none z-50"
                    style={{
                      left:
                        mousePos.x >
                        (containerRef.current?.clientWidth || 0) / 2
                          ? `${mousePos.x - 295}px`
                          : `${mousePos.x + 15}px`,
                      top:
                        mousePos.y >
                        (containerRef.current?.clientHeight || 0) - 250
                          ? `${mousePos.y - 290}px`
                          : `${mousePos.y + 15}px`,
                    }}
                  >
                    <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl border border-slate-700 min-w-[280px] max-w-xs">
                      <div className="text-sm font-bold text-slate-100 mb-3 border-b border-slate-700 pb-2">
                        {hoveredWard.ward.name}
                      </div>

                      <div className="space-y-3 text-xs">
                        {/* Shortage Comparison */}
                        <div className="bg-slate-800 rounded p-2">
                          <div className="flex items-center gap-1 text-slate-400 mb-1.5">
                            <Droplet className="w-3 h-3" />
                            <span className="font-semibold">Shortage</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-slate-500 text-[10px]">
                                Before
                              </div>
                              <div className="font-semibold text-red-400">
                                {hoveredWard.ward.before.shortage_pct.toFixed(
                                  2
                                )}
                                %
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 text-[10px]">
                                After
                              </div>
                              <div className="font-semibold text-green-400">
                                {hoveredWard.ward.after.shortage_pct.toFixed(2)}
                                %
                              </div>
                            </div>
                          </div>
                          <div className="text-emerald-300 font-bold text-[11px] mt-1">
                            ↓{" "}
                            {(
                              hoveredWard.ward.before.shortage_pct -
                              hoveredWard.ward.after.shortage_pct
                            ).toFixed(2)}
                            pp
                          </div>
                        </div>

                        {/* Pressure Comparison */}
                        <div className="bg-slate-800 rounded p-2">
                          <div className="flex items-center gap-1 text-slate-400 mb-1.5">
                            <Gauge className="w-3 h-3" />
                            <span className="font-semibold">Pressure</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-slate-500 text-[10px]">
                                Before
                              </div>
                              <div className="font-semibold text-slate-300">
                                {hoveredWard.ward.before.pressure.toFixed(2)}m
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 text-[10px]">
                                After
                              </div>
                              <div className="font-semibold text-blue-300">
                                {hoveredWard.ward.after.pressure.toFixed(2)}m
                              </div>
                            </div>
                          </div>
                          <div className="text-blue-300 font-bold text-[11px] mt-1">
                            {hoveredWard.ward.after.pressure -
                              hoveredWard.ward.before.pressure >=
                            0
                              ? "↑"
                              : "↓"}{" "}
                            {Math.abs(
                              hoveredWard.ward.after.pressure -
                                hoveredWard.ward.before.pressure
                            ).toFixed(2)}
                            m
                          </div>
                        </div>

                        {/* Demand vs Supply */}
                        <div className="bg-slate-800 rounded p-2">
                          <div className="flex items-center gap-1 text-slate-400 mb-1.5">
                            <Droplet className="w-3 h-3" />
                            <span className="font-semibold">
                              Demand vs Supply
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-slate-500 text-[10px]">
                                Demand
                              </span>
                              <span className="font-semibold text-cyan-300 text-xs">
                                {hoveredWard.ward.after.demand.toFixed(2)} LPS
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 text-[10px]">
                                Supply
                              </span>
                              <span className="font-semibold text-green-300 text-xs">
                                {hoveredWard.ward.after.supply.toFixed(2)} LPS
                              </span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-slate-700">
                              <span className="text-slate-500 text-[10px]">
                                Ratio
                              </span>
                              <span className="font-semibold text-blue-300 text-xs">
                                {(
                                  (hoveredWard.ward.after.supply /
                                    hoveredWard.ward.after.demand) *
                                  100
                                ).toFixed(2)}
                                %
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Supply & Leakage in one row */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-800 rounded p-2">
                            <div className="text-slate-400 text-[10px] mb-1">
                              Supply Change
                            </div>
                            <div className="font-semibold text-green-300 text-xs">
                              +
                              {(
                                hoveredWard.ward.after.supply -
                                hoveredWard.ward.before.supply
                              ).toFixed(2)}
                            </div>
                            <div className="text-slate-500 text-[9px]">LPS</div>
                          </div>
                          <div className="bg-slate-800 rounded p-2">
                            <div className="text-slate-400 text-[10px] mb-1">
                              Leakage
                            </div>
                            <div className="font-semibold text-yellow-300 text-xs">
                              {hoveredWard.ward.after.leakage.toFixed(2)}
                            </div>
                            <div className="text-slate-500 text-[9px]">
                              {hoveredWard.ward.before.leakage -
                                hoveredWard.ward.after.leakage >=
                              0
                                ? "↓"
                                : "↑"}
                              {Math.abs(
                                hoveredWard.ward.before.leakage -
                                  hoveredWard.ward.after.leakage
                              ).toFixed(2)}
                            </div>
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
                    Loading ward boundaries...
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Please wait while we load {wards.length} wards
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Usage Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">How to Use</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • <strong>Zoom:</strong> Use zoom buttons, scroll wheel, or
                    pinch gesture
                  </li>
                  <li>
                    • <strong>Pan:</strong> Click and drag to move around the
                    map
                  </li>
                  <li>
                    • <strong>Hover:</strong> Move cursor over wards to see
                    detailed metrics
                  </li>
                  <li>
                    • <strong>Reset:</strong> Click reset button to restore
                    default view
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metricView === "supplyDemand" ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-green-500 border-2 border-green-600"></div>
                  <span className="text-sm text-slate-700">≥98% Supply</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-green-400 border-2 border-green-500"></div>
                  <span className="text-sm text-slate-700">95-98%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-orange-400 border-2 border-orange-500"></div>
                  <span className="text-sm text-slate-700">90-95%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-red-500 border-2 border-red-600"></div>
                  <span className="text-sm text-slate-700">&lt;90%</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-green-500 border-2 border-green-600"></div>
                  <span className="text-sm text-slate-700">Excellent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-green-400 border-2 border-green-500"></div>
                  <span className="text-sm text-slate-700">Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-orange-400 border-2 border-orange-500"></div>
                  <span className="text-sm text-slate-700">Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-red-500 border-2 border-red-600"></div>
                  <span className="text-sm text-slate-700">Critical</span>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
