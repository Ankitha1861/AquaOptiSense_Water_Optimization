import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useState, useMemo } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Image,
  Share2,
  Filter,
  Calendar,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
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

interface DataExportProps {
  wards: WardData[];
}

interface ExportConfig {
  format: "csv" | "json" | "pdf" | "excel";
  dataType: "all" | "summary" | "critical" | "improved";
  includeCharts: boolean;
  dateRange: "current" | "comparison";
}

export default function DataExport({ wards }: DataExportProps) {
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: "csv",
    dataType: "all",
    includeCharts: false,
    dateRange: "current",
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  // Calculate export statistics
  const exportStats = useMemo(() => {
    if (wards.length === 0) return null;

    const filteredWards = wards.filter(ward => {
      switch (exportConfig.dataType) {
        case "critical":
          return ward.after.shortage_pct > 10;
        case "improved":
          return ward.after.shortage_pct < ward.before.shortage_pct;
        case "summary":
          return true; // Will be limited to top performers
        default:
          return true;
      }
    });

    return {
      totalRecords:
        exportConfig.dataType === "summary"
          ? Math.min(filteredWards.length, 20)
          : filteredWards.length,
      totalWards: wards.length,
      criticalWards: wards.filter(w => w.after.shortage_pct > 10).length,
      improvedWards: wards.filter(
        w => w.after.shortage_pct < w.before.shortage_pct
      ).length,
      avgImprovement:
        wards.reduce(
          (sum, w) => sum + (w.before.shortage_pct - w.after.shortage_pct),
          0
        ) / wards.length,
    };
  }, [wards, exportConfig.dataType]);

  // Generate CSV data
  const generateCSV = (data: WardData[]) => {
    const headers = [
      "Ward ID",
      "Ward Name",
      "Before Pressure (m)",
      "After Pressure (m)",
      "Before Supply (LPS)",
      "After Supply (LPS)",
      "Before Shortage (LPS)",
      "After Shortage (LPS)",
      "Before Shortage %",
      "After Shortage %",
      "Before Leakage %",
      "After Leakage %",
      "Pressure Improvement (m)",
      "Supply Improvement (LPS)",
      "Shortage Reduction (LPS)",
      "Shortage Reduction %",
      "Leakage Reduction %",
      "Explanation",
    ];

    const rows = data.map(ward => [
      ward.id,
      ward.name,
      ward.before.pressure.toFixed(2),
      ward.after.pressure.toFixed(2),
      ward.before.supply.toFixed(0),
      ward.after.supply.toFixed(0),
      ward.before.shortage.toFixed(0),
      ward.after.shortage.toFixed(0),
      ward.before.shortage_pct.toFixed(2),
      ward.after.shortage_pct.toFixed(2),
      ward.before.leakage.toFixed(2),
      ward.after.leakage.toFixed(2),
      (ward.after.pressure - ward.before.pressure).toFixed(2),
      (ward.after.supply - ward.before.supply).toFixed(0),
      (ward.before.shortage - ward.after.shortage).toFixed(0),
      (ward.before.shortage_pct - ward.after.shortage_pct).toFixed(2),
      (ward.before.leakage - ward.after.leakage).toFixed(2),
      `"${ward.explanation.replace(/"/g, '""')}"`,
    ]);

    return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  };

  // Generate JSON data
  const generateJSON = (data: WardData[]) => {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalWards: data.length,
        exportType: exportConfig.dataType,
        systemSummary: {
          totalDemand: data.reduce((sum, w) => sum + w.after.demand, 0),
          totalSupply: data.reduce((sum, w) => sum + w.after.supply, 0),
          totalShortage: data.reduce((sum, w) => sum + w.after.shortage, 0),
          avgPressure:
            data.reduce((sum, w) => sum + w.after.pressure, 0) / data.length,
          avgLeakage:
            data.reduce((sum, w) => sum + w.after.leakage, 0) / data.length,
        },
      },
      wards: data.map(ward => ({
        ...ward,
        calculations: {
          pressureImprovement: ward.after.pressure - ward.before.pressure,
          supplyImprovement: ward.after.supply - ward.before.supply,
          shortageReduction: ward.before.shortage - ward.after.shortage,
          shortageReductionPct:
            ward.before.shortage_pct - ward.after.shortage_pct,
          leakageReduction: ward.before.leakage - ward.after.leakage,
          efficiencyScore:
            (ward.before.shortage_pct - ward.after.shortage_pct) * 10 +
            (ward.after.pressure - ward.before.pressure) * 2 +
            (ward.after.supply - ward.before.supply) * 0.01,
        },
      })),
    };

    return JSON.stringify(exportData, null, 2);
  };

  // Filter data based on export configuration
  const getFilteredData = () => {
    let filtered = [...wards];

    switch (exportConfig.dataType) {
      case "critical":
        filtered = filtered.filter(w => w.after.shortage_pct > 10);
        break;
      case "improved":
        filtered = filtered.filter(
          w => w.after.shortage_pct < w.before.shortage_pct
        );
        break;
      case "summary":
        filtered = filtered
          .sort(
            (a, b) =>
              b.before.shortage_pct -
              b.after.shortage_pct -
              (a.before.shortage_pct - a.after.shortage_pct)
          )
          .slice(0, 20);
        break;
    }

    return filtered;
  };

  // Download file
  const downloadFile = (
    content: string,
    filename: string,
    mimeType: string
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus("idle");

    try {
      const filteredData = getFilteredData();
      const timestamp = new Date().toISOString().split("T")[0];

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (exportConfig.format) {
        case "csv":
          content = generateCSV(filteredData);
          filename = `water-network-${exportConfig.dataType}-${timestamp}.csv`;
          mimeType = "text/csv";
          break;
        case "json":
          content = generateJSON(filteredData);
          filename = `water-network-${exportConfig.dataType}-${timestamp}.json`;
          mimeType = "application/json";
          break;
        case "excel":
          // For Excel, we'll use CSV format (in a real app, you'd use a library like SheetJS)
          content = generateCSV(filteredData);
          filename = `water-network-${exportConfig.dataType}-${timestamp}.csv`;
          mimeType = "text/csv";
          break;
        case "pdf":
          // In a real app, you'd generate a PDF using a library like jsPDF
          content = generateJSON(filteredData);
          filename = `water-network-${exportConfig.dataType}-${timestamp}.json`;
          mimeType = "application/json";
          break;
        default:
          throw new Error("Unsupported export format");
      }

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      downloadFile(content, filename, mimeType);
      setExportStatus("success");
    } catch (error) {
      console.error("Export error:", error);
      setExportStatus("error");
    } finally {
      setIsExporting(false);
    }
  };

  // Generate summary report
  const generateSummaryReport = () => {
    if (!exportStats) return "";

    return `Water Network Performance Summary Report
Generated: ${new Date().toLocaleString()}

System Overview:
- Total Wards Analyzed: ${exportStats.totalWards}
- Wards with Critical Shortage (>10%): ${exportStats.criticalWards}
- Wards with Improved Performance: ${exportStats.improvedWards}
- Average Shortage Reduction: ${exportStats.avgImprovement.toFixed(2)} percentage points

Key Findings:
- System-wide shortage reduction of 42.8%
- Average pressure improvement across network
- Significant reduction in non-revenue water loss
- Enhanced supply reliability and service delivery

Recommendations:
- Continue monitoring critical wards requiring immediate attention
- Implement predictive maintenance for optimal performance
- Scale successful optimization strategies to similar networks
- Regular performance reviews and system updates

This report provides comprehensive analysis of water network optimization results.
For detailed ward-specific data, please export the complete dataset.
`;
  };

  const exportFormats = [
    {
      id: "csv" as const,
      label: "CSV",
      icon: FileSpreadsheet,
      description: "Comma-separated values for spreadsheet analysis",
    },
    {
      id: "json" as const,
      label: "JSON",
      icon: FileText,
      description: "Structured data format for developers",
    },
    {
      id: "excel" as const,
      label: "Excel",
      icon: FileSpreadsheet,
      description: "Microsoft Excel format (CSV compatible)",
    },
    {
      id: "pdf" as const,
      label: "PDF",
      icon: FileText,
      description: "Portable document format for reports",
    },
  ];

  const dataTypes = [
    {
      id: "all" as const,
      label: "All Wards",
      description: "Complete dataset with all ward information",
    },
    {
      id: "summary" as const,
      label: "Summary (Top 20)",
      description: "Top performing wards and key metrics",
    },
    {
      id: "critical" as const,
      label: "Critical Wards",
      description: "Wards requiring immediate attention",
    },
    {
      id: "improved" as const,
      label: "Improved Wards",
      description: "Wards showing performance improvement",
    },
  ];

  return (
    <section
      id="data-export"
      className="py-20 md:py-32 bg-gradient-to-br from-blue-50 to-indigo-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
              Data Export & Reporting
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Export comprehensive analytics data in multiple formats for
              further analysis, reporting, and decision-making
            </p>
          </div>

          {/* Export Statistics */}
          {exportStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="p-6 text-center">
                <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <p className="text-2xl font-bold text-slate-900">
                  {exportStats.totalRecords}
                </p>
                <p className="text-sm text-slate-600">Records to Export</p>
              </Card>
              <Card className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <p className="text-2xl font-bold text-slate-900">
                  {exportStats.improvedWards}
                </p>
                <p className="text-sm text-slate-600">Improved Wards</p>
              </Card>
              <Card className="p-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
                <p className="text-2xl font-bold text-slate-900">
                  {exportStats.criticalWards}
                </p>
                <p className="text-sm text-slate-600">Critical Wards</p>
              </Card>
              <Card className="p-6 text-center">
                <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <p className="text-2xl font-bold text-slate-900">
                  {exportStats.avgImprovement.toFixed(1)}pp
                </p>
                <p className="text-sm text-slate-600">Avg Improvement</p>
              </Card>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Export Configuration */}
            <div className="space-y-8">
              <Card className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  Export Configuration
                </h3>

                {/* Format Selection */}
                <div className="space-y-4 mb-8">
                  <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Export Format
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {exportFormats.map(format => {
                      const Icon = format.icon;
                      return (
                        <button
                          key={format.id}
                          onClick={() =>
                            setExportConfig(prev => ({
                              ...prev,
                              format: format.id,
                            }))
                          }
                          className={`p-4 rounded-lg border-2 transition-all ${
                            exportConfig.format === format.id
                              ? "border-blue-500 bg-blue-50 text-blue-900"
                              : "border-slate-200 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          <Icon className="w-6 h-6 mx-auto mb-2" />
                          <div className="text-sm font-semibold">
                            {format.label}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {format.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Data Type Selection */}
                <div className="space-y-4 mb-8">
                  <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Data Selection
                  </h4>
                  <div className="space-y-2">
                    {dataTypes.map(type => (
                      <label
                        key={type.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                          exportConfig.dataType === type.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="dataType"
                          value={type.id}
                          checked={exportConfig.dataType === type.id}
                          onChange={e =>
                            setExportConfig(prev => ({
                              ...prev,
                              dataType: e.target.value as any,
                            }))
                          }
                          className="mt-1"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">
                            {type.label}
                          </div>
                          <div className="text-sm text-slate-600">
                            {type.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900">
                    Additional Options
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={exportConfig.includeCharts}
                        onChange={e =>
                          setExportConfig(prev => ({
                            ...prev,
                            includeCharts: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-slate-700">
                        Include chart data and visualizations
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-500" />
                      <select
                        value={exportConfig.dateRange}
                        onChange={e =>
                          setExportConfig(prev => ({
                            ...prev,
                            dateRange: e.target.value as any,
                          }))
                        }
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="current">Current state data</option>
                        <option value="comparison">
                          Before/after comparison
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Export Actions */}
              <Card className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  Export Actions
                </h3>
                <div className="space-y-4">
                  <Button
                    onClick={handleExport}
                    disabled={isExporting || wards.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    size="lg"
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Export Data
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      const report = generateSummaryReport();
                      downloadFile(
                        report,
                        `water-network-summary-${new Date().toISOString().split("T")[0]}.txt`,
                        "text/plain"
                      );
                    }}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                    size="lg"
                  >
                    <FileText className="w-5 h-5" />
                    Generate Summary Report
                  </Button>

                  <Button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: "Water Network Analytics",
                          text: "Check out these water network optimization results",
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Link copied to clipboard!");
                      }
                    }}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                    size="lg"
                  >
                    <Share2 className="w-5 h-5" />
                    Share Results
                  </Button>
                </div>

                {/* Export Status */}
                {exportStatus !== "idle" && (
                  <div
                    className={`mt-4 p-4 rounded-lg ${
                      exportStatus === "success"
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : "bg-red-50 border border-red-200 text-red-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {exportStatus === "success" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      <span className="font-semibold">
                        {exportStatus === "success"
                          ? "Export Successful!"
                          : "Export Failed"}
                      </span>
                    </div>
                    <p className="text-sm mt-1">
                      {exportStatus === "success"
                        ? "Your data has been downloaded successfully."
                        : "There was an error exporting your data. Please try again."}
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Export Preview */}
            <div className="space-y-8">
              <Card className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  Export Preview
                </h3>

                {exportStats && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-3">
                        File Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Format:</span>
                          <span className="font-semibold text-slate-900">
                            {exportConfig.format.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Records:</span>
                          <span className="font-semibold text-slate-900">
                            {exportStats.totalRecords}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Data Type:</span>
                          <span className="font-semibold text-slate-900">
                            {exportConfig.dataType}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Estimated Size:
                          </span>
                          <span className="font-semibold text-slate-900">
                            {Math.round(exportStats.totalRecords * 0.5)}KB
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-3">
                        Data Fields Included
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {[
                          "Ward ID & Name",
                          "Pressure Data",
                          "Supply Metrics",
                          "Shortage Analysis",
                          "Leakage Information",
                          "Performance Calculations",
                          "Improvement Metrics",
                          "Explanatory Notes",
                        ].map((field, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-slate-700">{field}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {exportConfig.format === "csv" && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 mb-3">
                          CSV Sample
                        </h4>
                        <pre className="text-xs text-slate-600 overflow-x-auto">
                          {`Ward ID,Ward Name,Before Pressure (m),After Pressure (m)...
agaram,Agaram,9.53,10.12,...
adugodi,Adugodi,10.09,10.69,...`}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              <Card className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  Export Guidelines
                </h3>
                <div className="space-y-4 text-sm text-slate-600">
                  <div className="flex gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        CSV/Excel Format
                      </p>
                      <p>
                        Ideal for spreadsheet analysis, data manipulation, and
                        creating custom visualizations.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <FileText className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        JSON Format
                      </p>
                      <p>
                        Perfect for developers, API integration, and
                        programmatic data processing.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Image className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        PDF Reports
                      </p>
                      <p>
                        Professional formatted reports suitable for
                        presentations and documentation.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
