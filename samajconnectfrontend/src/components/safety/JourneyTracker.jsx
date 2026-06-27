import React, { useState, useEffect } from "react";
import { Navigation, ShieldAlert, CheckCircle2, ShieldCheck, MapPin } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import ProgressBar from "../ui/ProgressBar";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function JourneyTracker({ journey, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  // Calculate duration using expectedArrival and startedAt
  const startedAt = journey?.createdAt?.seconds
    ? journey.createdAt.seconds * 1000
    : journey?.startedAt?.seconds
      ? journey.startedAt.seconds * 1000
      : new Date(journey?.createdAt || journey?.startedAt || Date.now()).getTime();

  const expectedArrival = journey?.expectedArrival?.seconds
    ? journey.expectedArrival.seconds * 1000
    : new Date(journey?.expectedArrival || (Date.now() + 15 * 60 * 1000)).getTime();

  const durationSec = Math.max(60, Math.floor((expectedArrival - startedAt) / 1000));

  useEffect(() => {
    const tick = () => {
      const elapsedMs = Date.now() - startedAt;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const remainSec = Math.max(0, durationSec - elapsedSec);
      
      setTimeLeft(remainSec);
      
      const pct = Math.min(100, (elapsedSec / durationSec) * 100);
      setProgress(pct);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [journey, startedAt, durationSec]);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await api.patch(`/safety/journey/${journey.id}/checkin`);
      toast.success("Safe arrival reported! Circle notified. +30 pts earned ⭐");
      if (onComplete) onComplete();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to complete journey");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <GlassCard className="glass-elevated border-t-4 border-t-emerald-500 bg-white/70 border-white/50 p-6 flex flex-col gap-4 shadow-md animate-fade-in">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500 text-white animate-pulse">
            <Navigation size={18} className="transform rotate-45" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">Active Transit Tracking</h4>
            <span className="text-[10px] text-muted font-medium block">Circle notified on start</span>
          </div>
        </div>
        
        <div className="text-right">
          <span className="text-2xl font-bold font-data text-emerald-700 block">{formatTime(timeLeft)}</span>
          <span className="text-[9px] font-bold text-muted uppercase">remaining</span>
        </div>
      </div>

      {/* Route Info */}
      <div className="p-3.5 bg-white/40 border border-white/20 rounded-xl text-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="font-semibold text-primary">From: {journey?.fromAddress || journey?.from || "Current Location"}</span>
        </div>
        <div className="h-4 border-l border-indigo-400 border-dashed ml-1" />
        <div className="flex items-center gap-2">
          <MapPin size={12} className="text-red-500" />
          <span className="font-semibold text-primary">To: {journey?.toAddress || journey?.to || "Destination"}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-bold text-muted uppercase">
          <span>Transit Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <ProgressBar value={progress} color="bg-emerald-500" height="5px" />
      </div>

      {/* Verification footer */}
      {journey?.notifyCircleNames && journey.notifyCircleNames.length > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted">
          <span>Tracked by:</span>
          <div className="flex -space-x-1.5 ml-1">
            {journey.notifyCircleNames.slice(0, 3).map((name, i) => (
              <Avatar key={i} name={name} size="sm" className="w-5 h-5 border border-white" />
            ))}
          </div>
          <span className="font-semibold text-primary ml-1">{journey.notifyCircleNames.join(", ")}</span>
        </div>
      )}

      {/* Big green Safe Button */}
      <Button
        onClick={handleCheckIn}
        loading={loading}
        variant="primary"
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/10 text-white border-none flex items-center justify-center gap-1.5"
      >
        <ShieldCheck size={18} /> I'm Safe (Arrived) ✅
      </Button>
    </GlassCard>
  );
}
