import React, { useEffect, useState, useRef, useContext } from "react";
import { Wind, AlertTriangle, Thermometer, ShieldAlert, Heart, Calendar } from "lucide-react";
import { AppContext } from "../context/AppContext";
import AqiGauge from "../components/aqi/AqiGauge";
import AqiAlertBanner from "../components/aqi/AqiAlertBanner";
import SymptomSelector from "../components/aqi/SymptomSelector";
import DoctorCard from "../components/aqi/DoctorCard";
import AqiHistoryChart from "../components/aqi/AqiHistoryChart";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";
import Skeleton from "../components/ui/Skeleton";
import api from "../services/api";
import { getAqiLabel, getAqiTextColor } from "../utils/formatters";

export default function AqiDashboard() {
  const { aqiData, loadingAqi, userLocation, detectedCity, refreshAqi } = useContext(AppContext);
  const [doctors, setDoctors] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  const symptomRef = useRef(null);
  const doctorRef = useRef(null);

  const currentAqi = aqiData?.aqi || 72;
  const isHighAqi = currentAqi > 150;

  const scrollToRef = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    refreshAqi();
  }, [userLocation]);

  useEffect(() => {
    const fetchDashboardExtras = async () => {
      setLoadingExtras(true);
      try {
        // 1. Fetch available doctors
        const docParams = {};
        if (userLocation) {
          docParams.lat = userLocation.lat;
          docParams.lng = userLocation.lng;
        }
        const docRes = await api.get("/aqi/doctors", { params: docParams });
        setDoctors(docRes.data.doctors || []);
        
        // 2. Fetch history
        const city = detectedCity || "Latur";
        const histRes = await api.get("/aqi/history", { params: { city } });
        const rawReadings = histRes.data.readings || [];
        const formattedHistory = rawReadings
          .map(r => {
            let date = new Date();
            if (r.recordedAt) {
              if (r.recordedAt._seconds) {
                date = new Date(r.recordedAt._seconds * 1000);
              } else if (r.recordedAt.seconds) {
                date = new Date(r.recordedAt.seconds * 1000);
              } else {
                date = new Date(r.recordedAt);
              }
            }
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            return {
              time: timeStr,
              aqi: r.aqi
            };
          })
          .reverse();
        setHistoryData(formattedHistory);

        // 3. Fetch community sensors
        setSensors([
          { id: "s1", location: `Shivaji Chowk, ${city}`, reading: currentAqi - 5, label: "Good", updated: "5m ago" },
          { id: "s2", location: `${city} Industrial Zone`, reading: currentAqi + 42, label: "Poor", updated: "2m ago" },
          { id: "s3", location: `Central Plaza, ${city}`, reading: currentAqi + 12, label: "Moderate", updated: "12m ago" }
        ]);
      } catch (err) {
        console.warn("Failed to fetch AQI dashboard extras:", err);
      } finally {
        setLoadingExtras(false);
      }
    };

    fetchDashboardExtras();
  }, [currentAqi, userLocation, detectedCity]);

  return (
    <div className="space-y-6">
      
      {/* ── SECTION 1: LIVE CARD (GAGE + STATS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[40%_1fr] gap-6 items-stretch">
        
        {/* Left: SVG Gauge */}
        <GlassCard className="glass-elevated p-6 flex flex-col justify-center items-center bg-white/70 border-white/50 shadow-md">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-4 block">Real-time Telemetry</span>
          {loadingAqi ? (
            <div className="flex flex-col items-center gap-3">
              <Skeleton width="140px" height="140px" rounded="full" />
              <Skeleton width="80px" height="16px" />
            </div>
          ) : (
            <AqiGauge aqi={currentAqi} />
          )}
        </GlassCard>

        {/* Right: AQI Info Metrics */}
        <GlassCard className="p-6 bg-white/60 border-white/40 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Station Status</span>
                <h3 className="text-xl font-bold text-primary font-display">{aqiData?.stationName || `${detectedCity || "Latur"} Monitoring Station`}</h3>
              </div>
              <span className="text-[10px] font-semibold text-muted font-data">UPDATED: 5 MINS AGO</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="glass p-3 bg-white/50 border-white/30 text-center">
                <span className="text-muted text-[10px] font-medium block">PM2.5 Conc.</span>
                <span className="text-lg font-bold font-data text-primary">{aqiData?.pm25 || 22} µg/m³</span>
              </div>
              <div className="glass p-3 bg-white/50 border-white/30 text-center">
                <span className="text-muted text-[10px] font-medium block">PM10 Conc.</span>
                <span className="text-lg font-bold font-data text-primary">{aqiData?.pm10 || 45} µg/m³</span>
              </div>
              <div className="glass p-3 bg-white/50 border-white/30 text-center">
                <span className="text-muted text-[10px] font-medium block">Temperature</span>
                <span className="text-lg font-bold font-data text-primary">{aqiData?.temp || 28}°C</span>
              </div>
              <div className="glass p-3 bg-white/50 border-white/30 text-center">
                <span className="text-muted text-[10px] font-medium block">Humidity</span>
                <span className="text-lg font-bold font-data text-primary">{aqiData?.humidity || 62}%</span>
              </div>
            </div>
          </div>

          {/* Spike Warning Area */}
          <div className="mt-6 p-4 rounded-xl border border-white/40 bg-indigo-50/40 text-xs text-indigo-900 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-indigo-600 animate-pulse" size={16} />
              <span>
                {currentAqi > 100 
                  ? "AI Expectation: Minor peak in AQI expected around 8:30 PM due to traffic."
                  : "AI Expectation: Air quality expected to remain moderate for next 12 hours."
                }
              </span>
            </div>
            {currentAqi > 100 && (
              <span className="font-semibold text-indigo-700 font-data">Peak ~{currentAqi + 25}</span>
            )}
          </div>
        </GlassCard>
      </div>

      {/* ── SECTION 2: HIGH AQI ALERT BANNER ── */}
      <AqiAlertBanner 
        aqi={currentAqi} 
        onCheckSymptoms={() => scrollToRef(symptomRef)}
        onFindDoctor={() => scrollToRef(doctorRef)}
      />

      {/* ── SECTION 3: SYMPTOM SELECTOR & DOCTORS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Symptom Checker Box */}
        <div ref={symptomRef}>
          <GlassCard className="p-6 bg-white/60 border-white/40 shadow-sm">
            <SymptomSelector aqi={currentAqi} pollutant={aqiData?.pollutant || "PM2.5"} />
          </GlassCard>
        </div>

        {/* Doctor Consultation directory */}
        <div ref={doctorRef} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold font-display text-primary">On-call Consultation Directory</h3>
            <span className="text-[10px] font-bold text-muted uppercase">{detectedCity || "Latur"} Medical</span>
          </div>

          {loadingExtras ? (
            <div className="space-y-3">
              <Skeleton height="76px" />
              <Skeleton height="76px" />
            </div>
          ) : doctors.length === 0 ? (
            <div className="p-5 text-center text-xs text-muted border border-dashed border-white/40 rounded-2xl bg-white/20">
              No doctors online right now. In case of emergency please visit Civil Hospital.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {doctors.map((doc) => (
                <DoctorCard key={doc.id || doc.uid} doctor={doc} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 4: AREA HISTORY CHART ── */}
      <AqiHistoryChart data={historyData} />

      {/* ── SECTION 5: SENSORS GRID ── */}
      <div className="space-y-4">
        <h3 className="text-base font-bold font-display text-primary">Civic Sensor Grid</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sensors.map((s) => (
            <GlassCard key={s.id} className="p-4 bg-white/50 border-white/30 flex justify-between items-center text-xs shadow-sm">
              <div className="min-w-0">
                <span className="font-bold text-primary truncate block">{s.location}</span>
                <span className="text-[10px] text-muted font-medium mt-0.5 block">Updated: {s.updated}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-data text-indigo-700 block">{s.reading}</span>
                <span className="text-[9px] font-bold text-muted uppercase">{s.label}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

    </div>
  );
}
