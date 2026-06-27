import React, { useState } from "react";
import { ThumbsUp, CheckCircle, Check } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { timeAgo } from "../../utils/formatters";

export default function AnswerCard({ answer, isQuestionAsker = false, isQuestionSolved = false, onAccept, onUpvote }) {
  const [loading, setLoading] = useState(false);

  const handleAcceptClick = async () => {
    if (!onAccept) return;
    setLoading(true);
    try {
      await onAccept(answer.id);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvoteClick = async () => {
    if (!onUpvote) return;
    setLoading(true);
    try {
      await onUpvote(answer.id);
    } finally {
      setLoading(false);
    }
  };

  const isAccepted = answer.isAccepted === true;

  return (
    <GlassCard 
      className={`p-5 flex flex-col gap-3 bg-white/60 border-white/40 shadow-sm relative ${
        isAccepted ? "border-l-4 border-l-emerald-500 shadow-sm shadow-emerald-100" : ""
      }`}
    >
      {/* Accepted Banner */}
      {isAccepted && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 pb-2 border-b border-white/20 select-none">
          <CheckCircle size={14} className="text-emerald-600 animate-pulse" />
          <span>✓ Accepted Expert Answer</span>
        </div>
      )}

      {/* Expert Profile Details */}
      <div className="flex items-center gap-3">
        <Avatar name={answer.authorName} tier={answer.authorTier || "Bronze"} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-primary truncate leading-tight">{answer.authorName}</h4>
            {answer.isExpert && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[8px] font-bold text-indigo-700 uppercase">
                Expert
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted block mt-0.5 font-medium">
            Answered {timeAgo(answer.createdAt)}
          </span>
        </div>
        <Badge variant={answer.authorTier || "Bronze"} />
      </div>

      {/* Answer Body text */}
      <p className="text-xs text-primary leading-relaxed whitespace-pre-wrap mt-1">
        {answer.body}
      </p>

      {/* Footer controls: upvotes, accept */}
      <div className="flex justify-between items-center mt-2 pt-3 border-t border-white/20">
        <div className="flex items-center gap-4">
          <button
            onClick={handleUpvoteClick}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer disabled:opacity-50 select-none"
          >
            <ThumbsUp size={13} />
            <span className="font-data">{answer.upvotes || 0} votes</span>
          </button>
        </div>

        {isQuestionAsker && !isQuestionSolved && !isAccepted && (
          <Button
            onClick={handleAcceptClick}
            loading={loading}
            variant="ghost"
            size="sm"
            className="py-1 px-3 text-xs bg-emerald-50/50 border-emerald-300 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-950 font-bold"
          >
            <Check size={12} /> Accept Answer
          </Button>
        )}
      </div>

    </GlassCard>
  );
}
