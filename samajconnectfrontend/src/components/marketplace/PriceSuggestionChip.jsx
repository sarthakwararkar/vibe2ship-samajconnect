import React from "react";
import { Sparkles } from "lucide-react";

export default function PriceSuggestionChip({ minPrice, maxPrice, onClick }) {
  if (!minPrice || !maxPrice) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-sm select-none cursor-pointer"
    >
      <Sparkles size={13} className="text-amber-500 animate-pulse" />
      <span>Suggested price range: ₹{minPrice}–₹{maxPrice} (Tap to autofill)</span>
    </button>
  );
}
