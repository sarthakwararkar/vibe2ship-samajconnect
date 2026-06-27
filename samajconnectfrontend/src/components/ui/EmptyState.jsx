import React from "react";
import Button from "./Button";

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center glass rounded-2xl border border-white/20 my-4 space-y-3">
      {icon && <div className="text-secondary opacity-80 mb-2">{icon}</div>}
      <h3 className="text-lg font-bold text-primary font-display">{title || "No items found"}</h3>
      {description && <p className="text-sm text-muted max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="sm" className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
