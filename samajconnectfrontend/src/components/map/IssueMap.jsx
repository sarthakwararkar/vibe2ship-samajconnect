import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { MapPin, AlertCircle } from "lucide-react";
import { getCategoryEmoji, timeAgo } from "../../utils/formatters";

export default function IssueMap({ issues = [], height = "400px", center = [18.4088, 76.5604], zoom = 14 }) {
  // Severity pin colors
  const getSeverityColor = (sev) => {
    switch (sev?.toLowerCase()) {
      case "critical": return "#EF4444";
      case "high":     return "#F59E0B";
      case "medium":   return "#EAB308";
      case "low":      return "#10B981";
      default:         return "#6366F1";
    }
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/40 shadow-sm relative" style={{ height }}>
      {issues.length === 0 ? (
        <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-center p-4 z-10 gap-2">
          <AlertCircle size={28} className="text-muted" />
          <h4 className="text-sm font-bold text-primary">No issues found on map</h4>
          <p className="text-xs text-muted">No active reports match the selected filters.</p>
        </div>
      ) : null}

      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {issues
          .filter(issue => issue.lat && issue.lng)
          .map((issue) => {
            const color = getSeverityColor(issue.severity);
            return (
              <CircleMarker
                key={issue.id}
                center={[parseFloat(issue.lat), parseFloat(issue.lng)]}
                radius={8}
                pathOptions={{
                  fillColor: color,
                  color: "#FFFFFF",
                  weight: 1.5,
                  fillOpacity: 0.85
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1.5 min-w-[140px]">
                    <div className="flex items-center gap-1.5 font-bold text-primary">
                      <span>{getCategoryEmoji(issue.category)}</span>
                      <span>{issue.category?.replace("_", " ").toUpperCase() || "CIVIC ISSUE"}</span>
                    </div>
                    <p className="text-muted truncate">{issue.description}</p>
                    <div className="flex justify-between items-center pt-1 border-t border-gray-100 mt-1">
                      <span className="text-[10px] text-muted">{timeAgo(issue.createdAt)}</span>
                      <Link 
                        to={`/issues/${issue.id}`} 
                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>
    </div>
  );
}
