import React from "react";
import clsx from "clsx";

export default function Badge({ label, variant, className, ...props }) {
  const getStyles = () => {
    switch (variant?.toLowerCase() || label?.toLowerCase()) {
      // Issue status
      case "open":
        return "bg-amber-100 text-amber-800 border-amber-300/60";
      case "verified":
        return "bg-blue-100 text-blue-800 border-blue-300/60";
      case "in_progress":
      case "in_progress_status":
        return "bg-indigo-100 text-indigo-800 border-indigo-300/60";
      case "resolved":
        return "bg-emerald-100 text-emerald-800 border-emerald-300/60";

      // Issue severities
      case "critical":
        return "bg-red-100 text-red-700 border-red-300/60 font-semibold";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-300/60";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300/60";
      case "low":
        return "bg-green-100 text-green-700 border-green-300/60";

      // Categories
      case "pothole":
        return "bg-teal-50 text-teal-800 border-teal-300/50";
      case "water_leak":
        return "bg-blue-50 text-blue-800 border-blue-300/50";
      case "streetlight":
        return "bg-yellow-50 text-yellow-800 border-yellow-300/50";
      case "waste":
        return "bg-red-50 text-red-800 border-red-200/50";
      case "road_damage":
        return "bg-slate-100 text-slate-800 border-slate-300/50";

      // Gamification Tiers
      case "bronze":
        return "bg-[#CD7F32]/10 text-[#CD7F32] border-[#CD7F32]/30 font-semibold";
      case "silver":
        return "bg-slate-200/70 text-slate-700 border-slate-300 font-semibold";
      case "gold":
        return "bg-amber-100 text-amber-800 border-amber-300 font-semibold";
      case "platinum":
        return "bg-indigo-100 text-indigo-700 border-indigo-300 font-semibold shadow-sm shadow-indigo-300/30";

      // Listing types
      case "sell":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "donate":
      case "free":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "borrow":
        return "bg-sky-100 text-sky-800 border-sky-300";

      default:
        return "bg-white/80 text-primary border-gray-200";
    }
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        getStyles(),
        className
      )}
      {...props}
    >
      {label || variant}
    </span>
  );
}
