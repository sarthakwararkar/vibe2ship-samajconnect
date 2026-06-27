import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import clsx from "clsx";

export default function SosButton({ onActivate, onReset, isActivated = false }) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [countdown, setCountdown] = useState(3);
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const radius = 54;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const startHolding = (e) => {
    e.preventDefault();
    if (isActivated) return;
    
    setHolding(true);
    setProgress(0);
    setCountdown(3);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const percent = Math.min(100, (elapsed / 3000) * 100);
      setProgress(percent);

      const remain = Math.ceil((3000 - elapsed) / 1000);
      setCountdown(remain > 0 ? remain : 0);

      if (elapsed >= 3000) {
        triggerActivation();
      }
    }, 50);
  };

  const stopHolding = () => {
    if (!isActivated) {
      resetTimer();
    }
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setHolding(false);
    setProgress(0);
    setCountdown(3);
  };

  const triggerActivation = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setHolding(false);
    setProgress(100);
    if (onActivate) onActivate();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center select-none py-6">
      <div 
        className="relative flex items-center justify-center cursor-pointer"
        style={{ width: 140, height: 140 }}
        onPointerDown={startHolding}
        onPointerUp={stopHolding}
        onPointerLeave={stopHolding}
      >
        {/* Progress SVG Ring wrapper */}
        <svg className="absolute transform -rotate-90" width={140} height={140}>
          <circle
            cx={70}
            cy={70}
            r={radius}
            fill="transparent"
            stroke="rgba(239, 68, 68, 0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx={70}
            cy={70}
            r={radius}
            fill="transparent"
            stroke={isActivated ? "#10B981" : "#EF4444"}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: holding ? "none" : "stroke-dashoffset 0.2s" }}
          />
        </svg>

        {/* Circular Button center */}
        <div 
          className={clsx(
            "w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300",
            isActivated
              ? "bg-emerald-50 border-4 border-emerald-500 text-emerald-600 shadow-emerald-500/20"
              : holding
                ? "bg-red-100 border-4 border-red-500 text-red-600 scale-95 shadow-red-500/30"
                : "bg-red-50/75 border-2 border-red-400/50 text-red-500 hover:bg-red-100/50 shadow-md sos-pulse"
          )}
        >
          {isActivated ? (
            <ShieldCheck size={40} className="animate-bounce" />
          ) : holding ? (
            <span className="text-3xl font-extrabold font-data">{countdown}</span>
          ) : (
            <AlertTriangle size={36} />
          )}
        </div>
      </div>

      <span className={clsx(
        "text-xs font-bold font-body uppercase mt-3 tracking-wider",
        isActivated ? "text-emerald-700 font-extrabold" : "text-red-700"
      )}>
        {isActivated 
          ? "SOS ACTIVE · Circle Alerted" 
          : holding 
            ? "Hold down to trigger..." 
            : "HOLD 3s for Emergency SOS"
        }
      </span>

      {isActivated && onReset && (
        <button
          onClick={onReset}
          className="mt-4 px-4 py-1.5 rounded-xl border border-emerald-400 text-emerald-800 text-xs font-bold hover:bg-emerald-50 cursor-pointer transition-colors"
        >
          Deactivate Alert ✓
        </button>
      )}
    </div>
  );
}
