import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare, ThumbsUp, CheckCircle } from "lucide-react";
import GlassCard from "../ui/GlassCard";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import { timeAgo } from "../../utils/formatters";

export default function QuestionCard({ question }) {
  const isSolved = question?.isSolved === true || question?.status === "solved";

  return (
    <Link to={`/hub/${question.id}`}>
      <GlassCard 
        hover
        className={`p-5 flex flex-col gap-3.5 bg-white/60 border-white/40 shadow-sm relative border-l-4 ${
          isSolved ? "border-l-emerald-500" : "border-l-amber-400"
        }`}
      >
        {/* Top: Category + AI Tags + solved banner */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={question.category} />
            {question.tags && question.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200/50 text-[10px] font-bold text-indigo-700">
                #{tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted font-medium">{timeAgo(question.createdAt)}</span>
            {isSolved && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
                <CheckCircle size={10} /> Solved
              </span>
            )}
          </div>
        </div>

        {/* Question Title & Body */}
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-primary line-clamp-2 leading-tight">
            {question.title}
          </h3>
          <p className="text-xs text-muted line-clamp-2 leading-relaxed">
            {question.body}
          </p>
        </div>

        {/* Bottom Metadata */}
        <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/20">
          <div className="flex items-center gap-2">
            <Avatar name={question.askerName} tier={question.askerTier || "Bronze"} size="sm" className="w-6 h-6" />
            <span className="text-[11px] font-bold text-primary truncate max-w-[100px]">{question.askerName}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted font-semibold">
            <span className="flex items-center gap-1 font-data">
              <MessageSquare size={13} /> {question.answersCount || question.answerCount || 0}
            </span>
            <span className="flex items-center gap-1 font-data text-indigo-700">
              <ThumbsUp size={13} /> {question.upvotes || 0}
            </span>
          </div>
        </div>

      </GlassCard>
    </Link>
  );
}
