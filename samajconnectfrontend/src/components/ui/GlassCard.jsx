import React from "react";
import clsx from "clsx";

export default function GlassCard({ children, className, glow = false, hover = false, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "transition-all duration-300",
        glow ? "glass-glow" : "glass",
        hover && "cursor-pointer hover:border-indigo-400 hover:shadow-purple-glow hover:-translate-y-1",
        onClick && "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
