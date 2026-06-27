import React, { useState } from "react";

export default function Tooltip({ text, children, position = "top" }) {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div className={`absolute z-[100] px-2 py-1 text-xs font-semibold text-primary bg-indigo-900/90 border border-white/30 rounded-md shadow-md whitespace-nowrap pointer-events-none transition-opacity duration-150 ${positionClasses[position]}`}>
          {text}
        </div>
      )}
    </div>
  );
}
