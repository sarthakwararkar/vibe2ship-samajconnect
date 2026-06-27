import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import Badge from "../ui/Badge";
import Skeleton from "../ui/Skeleton";
import { getAqiHealthAdvice } from "../../services/gemini";
import { useDebounce } from "../../hooks/useDebounce";

const SYMPTOMS_LIST = [
  "Breathlessness",
  "Chest tightness",
  "Eye irritation",
  "Headache",
  "Runny nose",
  "Fatigue",
  "Dry cough",
  "Sore throat"
];

export default function SymptomSelector({ aqi = 142, pollutant = "PM2.5" }) {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);

  // Debounce the selected symptoms array to avoid hitting Gemini on every single click
  const debouncedSymptoms = useDebounce(selectedSymptoms, 600);

  const toggleSymptom = (symptom) => {
    if (symptom === "No symptoms") {
      setSelectedSymptoms([]);
      return;
    }

    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleClear = () => {
    setSelectedSymptoms([]);
    setAdvice(null);
  };

  // Fetch advice when symptoms change
  useEffect(() => {
    const fetchAdvice = async () => {
      setLoading(true);
      try {
        const res = await getAqiHealthAdvice(aqi, pollutant, debouncedSymptoms);
        setAdvice(res);
      } catch (err) {
        console.warn("Failed to get health advice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvice();
  }, [debouncedSymptoms, aqi, pollutant]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-sm font-bold text-primary">Symptom Checker</h4>
          <p className="text-xs text-muted">Select symptoms you are currently feeling to receive custom AI health advice.</p>
        </div>
        {selectedSymptoms.length > 0 && (
          <button 
            type="button"
            onClick={handleClear}
            className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
          >
            Clear Selected
          </button>
        )}
      </div>

      {/* Grid of Chips */}
      <div className="flex flex-wrap gap-2 py-1">
        {SYMPTOMS_LIST.map((sym) => {
          const isSelected = selectedSymptoms.includes(sym);
          return (
            <button
              type="button"
              key={sym}
              onClick={() => toggleSymptom(sym)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isSelected 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-white/40 border-white/60 text-primary hover:bg-white/60"
              }`}
            >
              {sym}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => toggleSymptom("No symptoms")}
          className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            selectedSymptoms.length === 0 
              ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
              : "bg-white/40 border-white/60 text-primary hover:bg-white/60"
          }`}
        >
          ✓ No symptoms
        </button>
      </div>

      {/* Advice Result Panel */}
      <div className="mt-2.5">
        {loading ? (
          <GlassCard className="p-5 border border-white/30 bg-white/30 flex flex-col gap-3">
            <div className="flex gap-2 items-center">
              <Skeleton width="18px" height="18px" rounded="full" />
              <Skeleton width="120px" height="16px" />
            </div>
            <Skeleton width="100%" height="40px" />
            <div className="space-y-1">
              <Skeleton width="80%" height="12px" />
              <Skeleton width="60%" height="12px" />
            </div>
          </GlassCard>
        ) : advice ? (
          <GlassCard className="p-5 border border-white/30 bg-white/40 space-y-4 shadow-sm">
            {/* Header: Risk Level */}
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-indigo-600" size={18} />
                <span className="text-xs font-bold text-primary">AI Health Assessment</span>
              </div>
              <Badge variant={advice.riskLevel === "severe" || advice.riskLevel === "high" ? "critical" : advice.riskLevel === "moderate" ? "medium" : "low"} />
            </div>

            {/* Advice */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Immediate Advice</span>
              <p className="text-sm font-semibold text-primary leading-relaxed">{advice.immediateAdvice}</p>
            </div>

            {/* Specialist Tip */}
            {advice.specialistType && advice.specialistType !== "none" && (
              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200/50 text-xs text-indigo-900 flex justify-between items-center">
                <span className="font-semibold">Recommended consultations:</span>
                <Badge variant={advice.urgency} label={advice.specialistType} />
              </div>
            )}

            {/* General Tips */}
            {advice.tips && advice.tips.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Prevention Tips</span>
                <ul className="text-xs text-muted list-disc list-inside space-y-1">
                  {advice.tips.map((tip, idx) => (
                    <li key={idx} className="leading-normal">{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </GlassCard>
        ) : (
          <div className="p-5 text-center text-xs text-muted border border-dashed border-white/40 rounded-2xl bg-white/20">
            Select symptoms or "No symptoms" to analyze air quality risk.
          </div>
        )}
      </div>

    </div>
  );
}
