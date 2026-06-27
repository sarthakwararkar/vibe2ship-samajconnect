import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ThumbsUp, MapPin, Clock, CheckCircle2 } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import Badge from "../ui/Badge";
import ProgressBar from "../ui/ProgressBar";
import Button from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { getCategoryEmoji, timeAgo } from "../../utils/formatters";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function IssueCard({ issue, onUpdate, compact = false }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Check if current user already upvoted
  const hasUpvoted = issue?.upvotedBy?.includes(user?.uid);
  const isCritical = issue?.severity === "critical";
  const isResolved = issue?.status === "resolved";

  const handleUpvote = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      return toast.error("Please log in to verify issues");
    }
    if (hasUpvoted) return;

    setLoading(true);
    try {
      const res = await api.patch(`/issues/${issue.id}/upvote`);
      toast.success("Issue verified! +10 pts earned ⭐");
      if (onUpdate) {
        onUpdate({
          ...issue,
          upvotes: res.data.upvotes,
          verificationCount: res.data.verificationCount,
          status: res.data.status,
          upvotedBy: [...(issue.upvotedBy || []), user.uid]
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to verify issue");
    } finally {
      setLoading(false);
    }
  };

  // Get status progress
  const getStatusProgress = () => {
    switch (issue?.status?.toLowerCase()) {
      case "open": return 20;
      case "verified": return 40;
      case "assigned": return 60;
      case "in_progress": return 80;
      case "resolved": return 100;
      default: return 20;
    }
  };

  const getStatusColor = () => {
    switch (issue?.status?.toLowerCase()) {
      case "open": return "bg-amber-500";
      case "verified": return "bg-blue-500";
      case "assigned": return "bg-purple-500";
      case "in_progress": return "bg-indigo-500";
      case "resolved": return "bg-emerald-500";
      default: return "bg-gray-400";
    }
  };

  return (
    <Link to={`/issues/${issue.id}`}>
      <GlassCard 
        hover 
        className={`p-5 flex flex-col gap-3.5 border-l-4 h-full bg-white/60 border-white/40 ${
          isCritical ? "border-l-red-500" : "border-l-indigo-400"
        } ${isResolved ? "border-t-[3px] border-t-emerald-500" : ""}`}
      >
        {/* Top Row: Emoji + Title + Severity */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-lg shadow-sm flex-shrink-0">
              {getCategoryEmoji(issue?.category)}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-primary truncate">
                {issue?.category ? issue.category.replace("_", " ").toUpperCase() : "CIVIC ISSUE"}
              </h3>
              <p className="text-xs text-muted truncate max-w-[220px]">{issue?.description}</p>
            </div>
          </div>
          <Badge variant={issue?.severity} />
        </div>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1">
            <MapPin size={13} className="text-indigo-600" />
            <span className="truncate max-w-[120px]">{issue?.address || "Latur"}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} />
            <span>{timeAgo(issue?.createdAt)}</span>
          </span>
          <span className="flex items-center gap-1 font-semibold text-indigo-700">
            <ThumbsUp size={13} />
            <span className="font-data">{issue?.upvotes || 0} votes</span>
          </span>
        </div>

        {/* Thin status progress bar */}
        {!compact && (
          <div className="space-y-1 mt-1">
            <div className="flex justify-between text-[10px] font-bold text-muted uppercase">
              <span>Status: {issue?.status || "Open"}</span>
              <span>{getStatusProgress()}%</span>
            </div>
            <ProgressBar 
              value={getStatusProgress()} 
              color={getStatusColor()} 
              height="4px" 
            />
          </div>
        )}

        {/* Bottom row (compact version omits actions) */}
        {!compact && (
          <div className="flex items-center justify-between mt-1.5 pt-3 border-t border-white/20">
            <Badge variant={issue?.status} />
            
            {issue?.status === "open" || issue?.status === "verified" ? (
              <Button
                size="sm"
                variant={hasUpvoted ? "ghost" : "primary"}
                onClick={handleUpvote}
                loading={loading}
                disabled={hasUpvoted}
                className="py-1 px-3 text-xs"
              >
                {hasUpvoted ? (
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 size={13} /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <ThumbsUp size={12} /> Verify ✓
                  </span>
                )}
              </Button>
            ) : (
              <span className="text-[11px] font-bold text-muted flex items-center gap-1">
                {isResolved ? "Resolved ✓" : "Assigned"}
              </span>
            )}
          </div>
        )}
      </GlassCard>
    </Link>
  );
}
