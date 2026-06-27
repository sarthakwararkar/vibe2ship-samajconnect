import React from "react";
import { Search, RotateCcw } from "lucide-react";
import { Input, Switch } from "../ui/Input";
import GlassCard from "../ui/GlassCard";

const CATEGORIES = [
  { value: "all", label: "📁 All Categories" },
  { value: "pothole", label: "🕳️ Pothole" },
  { value: "water_leak", label: "💧 Water Leak" },
  { value: "streetlight", label: "💡 Streetlight" },
  { value: "waste", label: "🗑️ Waste Overflow" },
  { value: "road_damage", label: "🛣️ Road Damage" }
];

const STATUSES = ["all", "open", "verified", "assigned", "in_progress", "resolved"];
const SEVERITIES = ["all", "critical", "high", "medium", "low"];

export default function IssueFilters({
  search,
  setSearch,
  status,
  setStatus,
  category,
  setCategory,
  severity,
  setSeverity,
  myReports,
  setMyReports,
  onClear
}) {
  return (
    <GlassCard className="p-5 flex flex-col gap-5 bg-white/60 border-white/40 shadow-sm">
      <div className="flex justify-between items-center pb-2 border-b border-white/30">
        <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Search Filters</h3>
        <button 
          onClick={onClear}
          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {/* Text Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by keywords..."
          className="w-full pl-9 py-2 glass-input text-xs"
        />
      </div>

      {/* Status Filters */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Status</span>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((st) => (
            <button
              type="button"
              key={st}
              onClick={() => setStatus(st)}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold uppercase transition-all cursor-pointer ${
                status === st
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-white/40 border-white/60 text-primary hover:bg-white/60"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Category</span>
        <div className="flex flex-col gap-1">
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                category === cat.value
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-white/40 border-white/60 text-primary hover:bg-white/60"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Severity Filters */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Severity</span>
        <div className="flex flex-wrap gap-1.5">
          {SEVERITIES.map((sev) => (
            <button
              type="button"
              key={sev}
              onClick={() => setSeverity(sev)}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold uppercase transition-all cursor-pointer ${
                severity === sev
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-white/40 border-white/60 text-primary hover:bg-white/60"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* My Reports Switch */}
      <div className="pt-2 border-t border-white/20">
        <Switch
          label="Show my reports only"
          checked={myReports}
          onChange={(e) => setMyReports(e.target.checked)}
        />
      </div>

    </GlassCard>
  );
}
