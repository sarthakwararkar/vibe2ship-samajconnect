import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AqiHistoryChart({ data }) {
  // Generate dummy data if none is passed
  const chartData = data && data.length > 0 ? data : [
    { time: "00:00", aqi: 62 },
    { time: "02:00", aqi: 65 },
    { time: "04:00", aqi: 70 },
    { time: "06:00", aqi: 75 },
    { time: "08:00", aqi: 110 },
    { time: "10:00", aqi: 135 },
    { time: "12:00", aqi: 142 },
    { time: "14:00", aqi: 120 },
    { time: "16:00", aqi: 105 },
    { time: "18:00", aqi: 130 },
    { time: "20:00", aqi: 165 }, // Spike!
    { time: "22:00", aqi: 120 }
  ];

  return (
    <div className="w-full h-72 glass p-5 bg-white/60 border-white/40 shadow-sm">
      <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-4">24-Hour Pollution Cycle</h4>
      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="aqiColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="time" 
              tickLine={false} 
              axisLine={false} 
              style={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "Space Mono" }} 
            />
            <YAxis 
              domain={[0, 300]} 
              tickLine={false} 
              axisLine={false} 
              style={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "Space Mono" }} 
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(31, 38, 135, 0.05)",
                color: "#1E1B4B",
                fontFamily: "Space Grotesk",
                fontSize: 12
              }}
            />
            <Area 
              type="monotone" 
              dataKey="aqi" 
              stroke="#6366F1" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#aqiColor)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
