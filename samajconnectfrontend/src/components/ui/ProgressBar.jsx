import React from "react";
import clsx from "clsx";

export default function ProgressBar({ value, max = 100, color = "bg-indigo-500", height = "8px", className }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div 
      className={clsx("w-full bg-black/10 rounded-full overflow-hidden border border-white/25", className)}
      style={{ height }}
    >
      <div 
        className={clsx("h-full rounded-full transition-all duration-500 ease-out", color)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
