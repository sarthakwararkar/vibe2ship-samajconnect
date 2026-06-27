import React from "react";
import clsx from "clsx";

export default function Skeleton({ width = "100%", height = "16px", rounded = "md", className }) {
  const roundedClass = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-2xl",
    full: "rounded-full"
  }[rounded] || "rounded-md";

  return (
    <div 
      className={clsx("shimmer-block", roundedClass, className)} 
      style={{ width, height }}
    />
  );
}
