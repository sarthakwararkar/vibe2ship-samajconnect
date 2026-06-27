import React from "react";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import GlassCard from "../ui/GlassCard";
import { formatScore } from "../../utils/formatters";
import clsx from "clsx";

export default function LeaderboardRow({ rank, user, isCurrentUser = false }) {
  return (
    <GlassCard 
      className={clsx(
        "p-4.5 flex items-center justify-between border bg-white/60 border-white/40 shadow-sm select-none",
        isCurrentUser && "border-indigo-500 bg-indigo-50/40 font-bold"
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Rank */}
        <span className="w-8 font-data font-bold text-muted text-sm text-center">
          #{rank}
        </span>
        
        {/* Profile */}
        <Avatar name={user.name} tier={user.tier || "Bronze"} size="sm" />
        
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-primary truncate leading-tight flex items-center gap-1.5">
            <span>{user.name}</span>
            {isCurrentUser && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[8px] font-bold uppercase">
                You
              </span>
            )}
          </h4>
          <span className="text-[10px] text-muted block mt-0.5">
            {user.ward || "Ward 12"} · {user.city || "Latur"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant={user.tier || "Bronze"} />
        <span className="font-data font-bold text-indigo-700 text-sm whitespace-nowrap">
          {formatScore(user.trustScore)}
        </span>
      </div>
    </GlassCard>
  );
}
