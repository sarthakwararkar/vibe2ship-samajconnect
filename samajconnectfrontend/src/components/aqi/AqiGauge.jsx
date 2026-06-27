import React from "react";
import { getAqiLabel, getAqiColor } from "../../utils/formatters";

export default function AqiGauge({ aqi = 0 }) {
  const numericAqi = Math.min(500, Math.max(0, Number(aqi || 0)));
  const angle = (numericAqi / 500) * 180; // 0 to 180 degrees
  const color = getAqiColor(numericAqi);
  const label = getAqiLabel(numericAqi);

  // SVG dimensions
  const center = { x: 100, y: 100 };
  const radius = 70;

  // Arc path generator helper
  const getArcPath = (startAngle, endAngle) => {
    const rad = Math.PI / 180;
    const startRad = startAngle * rad;
    const endRad = endAngle * rad;
    
    // Convert polar to cartesian (centered at 100, 100, y increases downwards, so subtract for upward arc)
    const sx = center.x - radius * Math.cos(startRad);
    const sy = center.y - radius * Math.sin(startRad);
    const ex = center.x - radius * Math.cos(endRad);
    const ey = center.y - radius * Math.sin(endRad);
    
    return `M ${sx} ${sy} A ${radius} ${radius} 0 0 1 ${ex} ${ey}`;
  };

  // Color segment zones: Good, Moderate, Unhealthy for Sensitive, Unhealthy, Very Unhealthy, Hazardous
  const zones = [
    { start: 0, end: 18, color: "#10B981" },    // 0-50 AQI
    { start: 18, end: 36, color: "#EAB308" },   // 51-100 AQI
    { start: 36, end: 54, color: "#F59E0B" },   // 101-150 AQI
    { start: 54, end: 72, color: "#EF4444" },   // 151-200 AQI
    { start: 72, end: 108, color: "#9333EA" },  // 201-300 AQI
    { start: 108, end: 180, color: "#7F1D1D" }  // 301-500 AQI
  ];

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[220px] mx-auto">
      <div className="relative w-full aspect-[200/120]">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* Arc segments */}
          {zones.map((zone, idx) => (
            <path
              key={idx}
              d={getArcPath(zone.start, zone.end)}
              fill="none"
              stroke={zone.color}
              strokeWidth="12"
              strokeLinecap="butt"
            />
          ))}

          {/* Needle Pin */}
          <circle cx={center.x} cy={center.y} r="8" fill="#1E1B4B" />
          <circle cx={center.x} cy={center.y} r="4" fill="#6366F1" />

          {/* Needle Line (initially pointing left, so 0deg is flat left) */}
          <line
            x1={center.x}
            y1={center.y}
            x2={center.x - radius + 8}
            y2={center.y}
            stroke="#1E1B4B"
            strokeWidth="3.5"
            strokeLinecap="round"
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: "100px 100px",
              transition: "transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}
          />
        </svg>

        {/* Floating text values in center-bottom of arc */}
        <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center">
          <span className="text-3xl font-extrabold font-data text-primary leading-none">
            {aqi}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted mt-1 leading-none">
            AQI
          </span>
        </div>
      </div>
      
      {/* Label under gauge */}
      <span 
        className="text-xs font-bold text-center mt-2 px-3 py-1 rounded-full bg-white/60 shadow-sm border border-white/40"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}
