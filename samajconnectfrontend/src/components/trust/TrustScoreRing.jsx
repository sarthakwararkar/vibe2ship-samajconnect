import React, { useEffect, useState } from "react";
import { getTierColor, getTierRange } from "../../utils/formatters";

export default function TrustScoreRing({ score = 0, tier = "Bronze", size = "md" }) {
  const { min, max } = getTierRange(tier);
  const color = getTierColor(tier);

  // Size dimensions
  const dims = {
    sm: { box: 60, radius: 24, stroke: 4, fontVal: "text-xs", fontTier: "text-[8px]" },
    md: { box: 100, radius: 40, stroke: 6, fontVal: "text-lg", fontTier: "text-[10px]" },
    lg: { box: 140, radius: 56, stroke: 8, fontVal: "text-2xl", fontTier: "text-xs" }
  }[size] || { box: 100, radius: 40, stroke: 6, fontVal: "text-lg", fontTier: "text-[10px]" };

  const circumference = 2 * Math.PI * dims.radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const range = max - min;
    const progress = range > 0 ? (score - min) / range : 1;
    const boundedProgress = Math.min(1, Math.max(0, progress));
    const strokeOffset = circumference - boundedProgress * circumference;
    // Animate stroke dash
    const timer = setTimeout(() => setOffset(strokeOffset), 150);
    return () => clearTimeout(timer);
  }, [score, tier, circumference, min, max]);

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: dims.box, height: dims.box }}>
      <svg className="transform -rotate-90" width={dims.box} height={dims.box}>
        {/* Background Circle */}
        <circle
          cx={dims.box / 2}
          cy={dims.box / 2}
          r={dims.radius}
          fill="transparent"
          stroke="rgba(0, 0, 0, 0.05)"
          strokeWidth={dims.stroke}
        />
        {/* Progress Circle */}
        <circle
          cx={dims.box / 2}
          cy={dims.box / 2}
          r={dims.radius}
          fill="transparent"
          stroke={color}
          strokeWidth={dims.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>

      {/* Center Label */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={`font-bold font-data text-primary ${dims.fontVal}`}>
          {score}
        </span>
        <span 
          className={`font-semibold tracking-wider uppercase font-body mt-0.5 ${dims.fontTier}`}
          style={{ color }}
        >
          {tier}
        </span>
      </div>
    </div>
  );
}
