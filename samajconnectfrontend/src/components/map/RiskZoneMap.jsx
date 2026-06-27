import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Circle, Popup, Marker, Polyline, useMap } from "react-leaflet";
import { ShieldAlert, Navigation } from "lucide-react";
import L from "leaflet";

// Create custom blue GPS dot icon
const blueDotIcon = L.divIcon({
  className: "custom-gps-dot",
  html: `
    <div class="relative flex items-center justify-center h-4 w-4">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-600 border-2 border-white shadow-md"></span>
    </div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Create custom destination icon
const redPinIcon = L.divIcon({
  className: "custom-destination-pin",
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute -top-7 bg-indigo-950 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-white/20 whitespace-nowrap">
        Destination 📍
      </div>
      <span class="relative inline-flex rounded-full h-4.5 w-4.5 bg-indigo-600 border-2 border-white shadow-md"></span>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Controller to dynamically adjust zoom/center to fit route
function MapController({ center, toCoords }) {
  const map = useMap();
  useEffect(() => {
    if (center && toCoords) {
      const bounds = L.latLngBounds([center, [toCoords.lat, toCoords.lng]]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (center) {
      map.setView(center, 14);
    }
  }, [center, toCoords, map]);
  return null;
}

export default function RiskZoneMap({ riskZones = [], disasters = [], center = [18.4088, 76.5604], toCoords = null, zoom = 12 }) {
  const [mapType, setMapType] = useState("streets"); // "streets" | "satellite"

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/40 shadow-sm relative">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapController center={center} toCoords={toCoords} />

        <TileLayer
          attribution={mapType === "streets" ? '&copy; CARTO' : '&copy; ESRI'}
          url={mapType === "streets" 
            ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Google Maps-like detailed streets
            : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" // Satellite
          }
        />
        
        {/* User Current Location Dot */}
        {center && (
          <Marker position={center} icon={blueDotIcon}>
            <Popup>
              <div className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                <Navigation size={12} className="text-indigo-600 rotate-45" />
                <span>You are here</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {toCoords && (
          <Marker position={[toCoords.lat, toCoords.lng]} icon={redPinIcon}>
            <Popup>
              <div className="text-xs font-semibold text-primary">
                <span>Selected Destination</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Polyline */}
        {center && toCoords && (
          <Polyline 
            positions={[center, [toCoords.lat, toCoords.lng]]}
            pathOptions={{
              color: "#6366F1",
              weight: 4,
              opacity: 0.8,
              dashArray: "1, 8"
            }}
          />
        )}

        {riskZones
          .filter(zone => zone.lat && zone.lng)
          .map((zone) => (
            <Circle
              key={zone.id}
              center={[parseFloat(zone.lat), parseFloat(zone.lng)]}
              radius={zone.radius || 200}
              pathOptions={{
                fillColor: "#EF4444",
                color: "#EF4444",
                weight: 1.5,
                fillOpacity: 0.15
              }}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[130px]">
                  <div className="flex items-center gap-1.5 font-bold text-red-700">
                    <ShieldAlert size={14} />
                    <span>Risk Zone: {zone.name}</span>
                  </div>
                  <p className="text-muted">Incidents: {zone.incidentCount || 3} reported</p>
                  <p className="text-[10px] text-muted font-medium bg-red-50 p-1 border border-red-200/50 rounded mt-1">
                    ⚠️ Caution: {zone.cautionHours || "8 PM - 11 PM"}
                  </p>
                </div>
              </Popup>
            </Circle>
          ))}

        {disasters
          .filter(d => d.lat && d.lng)
          .map((d) => (
            <Circle
              key={d.id}
              center={[parseFloat(d.lat), parseFloat(d.lng)]}
              radius={500}
              pathOptions={{
                fillColor: "#DC2626",
                color: "#DC2626",
                weight: 2,
                fillOpacity: 0.25,
                dashArray: "6, 8"
              }}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[150px]">
                  <div className="flex items-center gap-1 text-red-600 font-bold">
                    <span>🚨 DISASTER: {d.type.toUpperCase()}</span>
                  </div>
                  <p className="text-primary font-medium">{d.description}</p>
                  <p className="text-[10px] text-muted mt-1">📍 {d.address || "Nearby"}</p>
                  <span className="text-[9px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded inline-block mt-1 animate-pulse">
                    ACTIVE ALERT
                  </span>
                </div>
              </Popup>
            </Circle>
          ))}
      </MapContainer>

      {/* Map Type Switcher Control (just like Google Maps) */}
      <div className="absolute bottom-4 left-4 z-[1000] flex gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-white/60">
        <button
          type="button"
          onClick={() => setMapType("streets")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border-none outline-none ${
            mapType === "streets" 
              ? "bg-indigo-600 text-white shadow-sm" 
              : "text-primary hover:bg-gray-100 bg-transparent"
          }`}
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => setMapType("satellite")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border-none outline-none ${
            mapType === "satellite" 
              ? "bg-indigo-600 text-white shadow-sm" 
              : "text-primary hover:bg-gray-100 bg-transparent"
          }`}
        >
          Satellite
        </button>
      </div>
    </div>
  );
}
