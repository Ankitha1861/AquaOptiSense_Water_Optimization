import { Card } from "./ui/card";
import { useState, useEffect } from "react";
import { MapPin, ZoomIn, ZoomOut, RotateCcw, Info } from "lucide-react";

export default function WardMap() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Check if the map file exists and is accessible
    const checkMapAvailability = async () => {
      try {
        const response = await fetch("/ward_map.html");
        if (response.ok) {
          setMapLoaded(true);
        } else {
          setMapError(true);
          setShowFallback(true);
        }
      } catch (error) {
        console.warn("Ward map not available:", error);
        setMapError(true);
        setShowFallback(true);
      }
    };

    checkMapAvailability();

    // Set a timeout to show fallback if map doesn't load within 5 seconds
    const fallbackTimer = setTimeout(() => {
      if (!mapLoaded) {
        setShowFallback(true);
      }
    }, 5000);

    return () => clearTimeout(fallbackTimer);
  }, [mapLoaded]);

  return (
    <section
      id="ward-map"
      className="py-20 md:py-32 bg-gradient-to-br from-blue-50 to-indigo-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
              Ward-wise Performance Map
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Interactive geographic visualization of water network performance
              improvements across all wards. Color intensity indicates the
              percentage reduction in water shortage after optimization.
            </p>
          </div>

          <Card className="p-0 border-slate-200 overflow-hidden shadow-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Geographic Distribution
                    </h3>
                    <p className="text-sm text-slate-600">
                      198 wards with performance metrics
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Info className="w-4 h-4" />
                    <span>Interactive map with hover details</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative bg-white" style={{ height: "650px" }}>
              {mapError || showFallback ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                  <div className="text-center space-y-6 p-8 max-w-md">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <MapPin className="w-10 h-10 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">
                        Interactive Map Loading
                      </h3>
                      <p className="text-slate-600 mb-4">
                        The geographic ward map is being prepared. You can
                        explore the comprehensive ward visualization below with
                        interactive features and detailed analytics.
                      </p>
                      <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-blue-800 mb-3">
                          <strong>Available Now:</strong>
                        </p>
                        <ul className="text-xs text-blue-700 text-left space-y-1">
                          <li>• Ward Performance Visualization (below)</li>
                          <li>• Interactive grid with hover details</li>
                          <li>• Advanced analytics dashboard</li>
                          <li>• Predictive modeling tools</li>
                        </ul>
                      </div>
                      <button
                        onClick={() => {
                          const element =
                            document.getElementById("visible-ward-map");
                          element?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View Ward Visualization
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <iframe
                    src="/ward_map.html"
                    title="Interactive Ward Performance Map"
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                    onLoad={() => {
                      setMapLoaded(true);
                      setShowFallback(false);
                    }}
                    onError={() => {
                      setMapError(true);
                      setShowFallback(true);
                    }}
                  />
                  {!mapLoaded && !mapError && !showFallback && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                      <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <div>
                          <p className="text-lg font-semibold text-slate-900">
                            Loading Interactive Map
                          </p>
                          <p className="text-slate-600">
                            Preparing ward boundaries and performance data...
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            If this takes too long, we'll show you an
                            alternative visualization
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Map Legend */}
            <div className="p-6 bg-slate-50 border-t">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    Color Scale
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm text-slate-600">
                        High Improvement (&gt;5% reduction)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-sm text-slate-600">
                        Moderate Improvement (1-5% reduction)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm text-slate-600">
                        Needs Attention (&lt;1% or no improvement)
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    Key Metrics
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Water shortage percentage</li>
                    <li>• Supply vs demand ratio</li>
                    <li>• Pressure improvements</li>
                    <li>• Leakage reduction</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    Interaction
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Hover for ward details</li>
                    <li>• Click for full analysis</li>
                    <li>• Zoom and pan supported</li>
                    <li>• Real-time data updates</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Performance Summary */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="text-3xl font-bold text-green-700 mb-2">
                42.8%
              </div>
              <div className="text-sm text-green-600">
                Average Shortage Reduction
              </div>
            </Card>
            <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="text-3xl font-bold text-blue-700 mb-2">85</div>
              <div className="text-sm text-blue-600">High-Performing Wards</div>
            </Card>
            <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="text-3xl font-bold text-purple-700 mb-2">
                5.9%
              </div>
              <div className="text-sm text-purple-600">
                Pressure Improvement
              </div>
            </Card>
            <Card className="p-6 text-center bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="text-3xl font-bold text-orange-700 mb-2">198</div>
              <div className="text-sm text-orange-600">
                Total Wards Analyzed
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
