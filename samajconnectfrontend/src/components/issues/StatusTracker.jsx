import React from "react";
import { Check } from "lucide-react";
import clsx from "clsx";

export default function StatusTracker({ status = "open" }) {
  const steps = [
    { label: "Reported", key: "open" },
    { label: "Verified", key: "verified" },
    { label: "Assigned", key: "assigned" },
    { label: "In Progress", key: "in_progress" },
    { label: "Resolved", key: "resolved" }
  ];

  const getStatusIndex = (currentStatus) => {
    const key = currentStatus?.toLowerCase();
    if (key === "open") return 0;
    if (key === "verified") return 1;
    if (key === "assigned") return 2;
    if (key === "in_progress") return 3;
    if (key === "resolved") return 4;
    return 0;
  };

  const currentIndex = getStatusIndex(status);

  return (
    <div className="w-full py-4 px-2 select-none">
      <div className="flex items-center">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={step.key}>
              {/* Circle */}
              <div className="relative flex flex-col items-center flex-1">
                <div 
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all duration-300 z-10",
                    isCompleted && "bg-emerald-500 border-emerald-500 text-white",
                    isActive && "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105",
                    !isCompleted && !isActive && "bg-white border-gray-300 text-muted"
                  )}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                </div>
                
                {/* Label */}
                <span 
                  className={clsx(
                    "absolute top-10 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                    isActive ? "text-indigo-700 font-extrabold" : "text-muted"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className="flex-1 h-0.5 bg-gray-200 -translate-y-4">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: isCompleted ? "100%" : isActive ? "50%" : "0%" }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="h-6" /> {/* Spacer for floating labels */}
    </div>
  );
}
