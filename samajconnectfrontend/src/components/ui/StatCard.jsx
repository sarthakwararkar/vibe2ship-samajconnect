import React from "react";
import GlassCard from "./GlassCard";

export default function StatCard({ title, value, icon, color = "var(--purple-500)", trend, ...props }) {
  // Try to parse color to hex or raw style
  const indicatorColor = color.startsWith("var") || color.startsWith("#") || color.startsWith("rgb") 
    ? color 
    : "var(--purple-500)";

  return (
    <GlassCard className="p-5 flex flex-col gap-2 relative overflow-hidden border-b-[4px]" style={{ borderBottomColor: indicatorColor }} {...props}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">{title}</span>
        {icon && (
          <div className="p-2 rounded-lg bg-white/50 text-indigo-800" style={{ color: indicatorColor }}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-3xl font-bold font-data text-primary">{value}</span>
        {trend && <span className="text-xs font-semibold text-emerald-600 ml-1">{trend}</span>}
      </div>
    </GlassCard>
  );
}
