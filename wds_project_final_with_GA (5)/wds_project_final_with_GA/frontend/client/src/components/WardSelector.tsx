import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, MapPin } from "lucide-react";
import { Card } from "./ui/card";

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

interface WardSelectorProps {
  wards: WardData[];
  selectedWard: WardData | null;
  onWardSelect: (ward: WardData) => void;
}

export default function WardSelector({
  wards,
  selectedWard,
  onWardSelect,
}: WardSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredWards = wards.filter((ward) =>
    ward.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWardClick = (ward: WardData) => {
    onWardSelect(ward);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-lg text-slate-900 flex justify-between items-center hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <span className="font-medium">
            {selectedWard?.name || "Select a Ward"}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search wards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {filteredWards.length > 0 ? (
              filteredWards.map((ward) => {
                const shortageImprovement = (
                  ward.before.shortage_pct - ward.after.shortage_pct
                ).toFixed(2);
                const isSelected = selectedWard?.id === ward.id;

                return (
                  <button
                    key={ward.id}
                    onClick={() => handleWardClick(ward)}
                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-slate-100 ${
                      isSelected ? "bg-blue-100" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-slate-900">
                          {ward.name}
                        </div>
                        <div className="text-sm text-slate-600">
                          Shortage: {ward.after.shortage_pct.toFixed(2)}% (
                          {shortageImprovement > "0.00" ? "↓" : "↑"}{" "}
                          {Math.abs(Number(shortageImprovement)).toFixed(2)}pp)
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          Number(shortageImprovement) > 5
                            ? "bg-green-100 text-green-700"
                            : Number(shortageImprovement) > 0
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {Number(shortageImprovement) > 5
                          ? "High"
                          : Number(shortageImprovement) > 0
                            ? "Moderate"
                            : "Low"}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-slate-500">
                No wards found matching "{searchTerm}"
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
