import React from "react";
import clsx from "clsx";
import { getTierColor } from "../../utils/formatters";

export default function Avatar({ src, name = "", tier = "Bronze", size = "md", className, ...props }) {
  const initials = name
    ? name
        .split(" ")
        .map(n => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const sizeClasses = {
    sm: "w-8 h-8 text-xs border-2",
    md: "w-12 h-12 text-sm border-[3px]",
    lg: "w-20 h-20 text-xl border-[4px]"
  };

  const ringColor = getTierColor(tier);

  return (
    <div
      className={clsx(
        "relative rounded-full flex items-center justify-center overflow-hidden font-semibold flex-shrink-0 bg-white/70 select-none shadow-sm",
        sizeClasses[size],
        className
      )}
      style={{ borderColor: ringColor }}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = "none";
          }}
        />
      ) : (
        <span className="text-secondary" style={{ color: ringColor }}>{initials}</span>
      )}
    </div>
  );
}
