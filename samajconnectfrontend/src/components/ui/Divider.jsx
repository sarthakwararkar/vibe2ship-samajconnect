import React from "react";
import clsx from "clsx";

export default function Divider({ label, className }) {
  if (label) {
    return (
      <div className={clsx("flex items-center gap-3 w-full my-3", className)}>
        <div className="flex-1 h-px bg-white/30" />
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</span>
        <div className="flex-1 h-px bg-white/30" />
      </div>
    );
  }
  return <div className={clsx("h-px bg-white/30 w-full my-3", className)} />;
}
