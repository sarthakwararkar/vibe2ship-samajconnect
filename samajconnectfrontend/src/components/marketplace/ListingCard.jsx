import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Sparkles } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import { formatPrice, formatDistance } from "../../utils/formatters";

export default function ListingCard({ listing }) {
  const isFree = listing.type === "donate" || !listing.price || listing.price === "0" || listing.price === 0;

  // Placeholder category icons
  const getCategoryIcon = (cat) => {
    switch (cat?.toLowerCase()) {
      case "books": return "📚";
      case "electronics": return "💻";
      case "furniture": return "🪑";
      case "clothing": return "👕";
      case "appliances": return "🔌";
      case "tools": return "🔧";
      default: return "📦";
    }
  };

  return (
    <Link to={`/marketplace/${listing.id}`}>
      <GlassCard hover className="overflow-hidden flex flex-col h-full bg-white/60 border-white/40 shadow-sm relative">
        {/* Photo Container */}
        <div className="relative aspect-[4/3] w-full bg-slate-100 flex items-center justify-center overflow-hidden">
          {listing.photoUrl ? (
            <img 
              src={listing.photoUrl} 
              alt={listing.title} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 select-none text-muted">
              <span className="text-4xl">{getCategoryIcon(listing.category)}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">No Image</span>
            </div>
          )}

          {/* Type Badge Overlay (Top Left) */}
          <div className="absolute top-2.5 left-2.5">
            <Badge variant={listing.type} />
          </div>

          {/* Condition Overlay (Top Right) */}
          {listing.condition && (
            <div className="absolute top-2.5 right-2.5">
              <span className="px-2 py-0.5 rounded-lg bg-white/85 text-primary text-[10px] font-bold border border-gray-200 shadow-sm">
                {listing.condition.replace("_", " ")}
              </span>
            </div>
          )}
        </div>

        {/* Card Details */}
        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-sm font-bold text-primary truncate leading-tight flex-1">
                {listing.title}
              </h3>
              <span className="text-xs font-bold font-data text-indigo-700 whitespace-nowrap">
                {isFree ? "Free" : formatPrice(listing.price)}
              </span>
            </div>
            
            <p className="text-xs text-muted line-clamp-2 leading-relaxed">
              {listing.description}
            </p>
          </div>

          <div className="space-y-2">
            {/* Price overlay / AI suggest indicator */}
            {listing.type === "sell" && listing.aiMinPrice && (
              <div className="flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 p-1.5 border border-amber-200/50 rounded-lg max-w-max select-none">
                <Sparkles size={10} className="text-amber-500" />
                <span>AI fair price range: ₹{listing.aiMinPrice}–{listing.aiMaxPrice}</span>
              </div>
            )}

            {/* Bottom info */}
            <div className="flex justify-between items-center pt-2.5 border-t border-white/20">
              <div className="flex items-center gap-2">
                <Avatar name={listing.sellerName} tier={listing.sellerTier || "Bronze"} size="sm" className="w-6 h-6" />
                <span className="text-[10px] font-bold text-primary truncate max-w-[90px]">{listing.sellerName}</span>
              </div>

              {/* Distance */}
              {listing.distance !== undefined && (
                <span className="text-[10px] text-muted font-semibold flex items-center gap-0.5">
                  <MapPin size={10} className="text-indigo-600" />
                  <span className="font-data">{formatDistance(listing.distance)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

      </GlassCard>
    </Link>
  );
}
