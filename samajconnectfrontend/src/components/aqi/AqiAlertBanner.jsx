import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import Button from "../ui/Button";

export default function AqiAlertBanner({ aqi = 0, onCheckSymptoms, onFindDoctor }) {
  if (aqi <= 150) return null;

  return (
    <GlassCard className="sos-pulse bg-red-50/60 border border-red-300 p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-red-500 text-white flex-shrink-0">
          <AlertTriangle size={20} className="animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-red-900">Severe Air Pollution Alert!</h3>
          <p className="text-xs text-red-700 mt-0.5">
            The current Air Quality Index is {aqi}, which is unhealthy. Please take health precautions.
          </p>
        </div>
      </div>
      
      <div className="flex gap-3">
        {onCheckSymptoms && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCheckSymptoms}
            className="border-red-300 text-red-800 hover:bg-red-100/50 hover:text-red-900 bg-white/40"
          >
            Symptom Checker
          </Button>
        )}
        {onFindDoctor && (
          <Button 
            variant="primary" 
            size="sm" 
            onClick={onFindDoctor}
            className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 text-white border-none"
          >
            Find a Doctor <ArrowRight size={14} />
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
