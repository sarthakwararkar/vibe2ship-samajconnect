import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MessageSquare, ThumbsUp, CheckCircle, ArrowLeft, Bot, Sparkles, Send } from "lucide-react";
import GlassCard from "../components/ui/GlassCard";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { Textarea } from "../components/ui/Input";
import AnswerCard from "../components/hub/AnswerCard";
import Skeleton from "../components/ui/Skeleton";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { timeAgo } from "../utils/formatters";
import toast from "react-hot-toast";

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [answerBody, setAnswerBody] = useState("");
  const [postingAnswer, setPostingAnswer] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  const fetchQuestionDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/hub/questions/${id}`);
      setQuestion(res.data.question || res.data);
      setAnswers(res.data.answers || []);
    } catch (err) {
      console.warn("Failed to fetch question:", err);
      toast.error("Discussion not found");
      navigate("/hub");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionDetail();
  }, [id]);

  const handleUpvoteQuestion = async () => {
    if (!user) return toast.error("Please log in first");
    setUpvoting(true);
    try {
      const res = await api.patch(`/hub/questions/${id}/upvote`);
      toast.success("Question upvoted!");
      setQuestion(prev => ({ ...prev, upvotes: res.data.upvotes }));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to upvote");
    } finally {
      setUpvoting(false);
    }
  };

  const handlePostAnswer = async (e) => {
    e.preventDefault();
    if (!answerBody.trim()) return toast.error("Please enter answer text");

    setPostingAnswer(true);
    try {
      const res = await api.post(`/hub/questions/${id}/answers`, { body: answerBody });
      toast.success("Answer posted successfully! +15 pts earned ⭐");
      setAnswerBody("");
      // Append new answer to list
      setAnswers(prev => [...prev, res.data.answer]);
      setQuestion(prev => ({ ...prev, answersCount: (prev.answersCount || 0) + 1 }));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to post answer");
    } finally {
      setPostingAnswer(false);
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      await api.patch(`/hub/questions/${id}/answers/${answerId}/accept`);
      toast.success("Answer accepted! Question resolved.");
      // Set accepted flag on local state
      setAnswers(prev => prev.map(ans => ans.id === answerId ? { ...ans, isAccepted: true } : ans));
      setQuestion(prev => ({ ...prev, isSolved: true, status: "solved" }));
    } catch (err) {
      toast.error("Failed to accept answer");
    }
  };

  const handleUpvoteAnswer = async (answerId) => {
    if (!user) return toast.error("Please log in first");
    try {
      const res = await api.patch(`/hub/answers/${answerId}/upvote`);
      toast.success("Answer upvoted!");
      setAnswers(prev => prev.map(ans => ans.id === answerId ? { ...ans, upvotes: res.data.upvotes } : ans));
    } catch (err) {
      toast.error("Failed to upvote answer");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton height="140px" />
        <Skeleton height="80px" />
        <Skeleton height="180px" />
      </div>
    );
  }

  if (!question) return null;

  const isQuestionAsker = question.askerId === user?.uid;
  const isSolved = question.isSolved === true || question.status === "solved";

  return (
    <div className="space-y-5">
      <Link to="/hub" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
        <ArrowLeft size={14} /> Back to Expertise Hub
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[65%_1fr] gap-6 items-start">
        
        {/* Left Col: Question & Answers list */}
        <div className="space-y-5">
          
          {/* Main Question Card */}
          <GlassCard className="p-6 bg-white/60 border-white/40 shadow-sm space-y-4">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={question.category} />
                {question.tags && question.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200/50 text-[10px] font-bold text-indigo-700">
                    #{t}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-muted font-medium">{timeAgo(question.createdAt)}</span>
            </div>

            <h2 className="text-xl font-bold text-primary font-display leading-snug">
              {question.title}
            </h2>
            
            <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
              {question.body}
            </p>

            {/* Asker Details Info */}
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div className="flex items-center gap-3">
                <Avatar name={question.askerName} tier={question.askerTier || "Bronze"} size="sm" />
                <div>
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Question Asker</span>
                  <span className="text-xs font-bold text-primary">{question.askerName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleUpvoteQuestion}
                  disabled={upvoting}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 border border-white/40 bg-white/50 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <ThumbsUp size={13} />
                  <span className="font-data">{question.upvotes || 0} votes</span>
                </button>
              </div>
            </div>
          </GlassCard>

          {/* AI Routing target indicator */}
          <GlassCard className="p-4 border-l-4 border-l-indigo-500 bg-indigo-50/50 border-white/30 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="text-xs">
              <span className="font-bold text-indigo-900">
                Routed to: {question.category?.toUpperCase()} Expert
              </span>
              <p className="text-indigo-700 mt-0.5">
                Automated NLP categorizer mapped discussion topic to community advisors with {question.category} credentials.
              </p>
            </div>
          </GlassCard>

          {/* Answers Lists */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider px-1">
              Answers ({answers.length})
            </h3>
            
            {answers.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted border border-dashed border-white/40 rounded-2xl bg-white/20">
                No answers posted yet. Registered experts have been notified.
              </div>
            ) : (
              <div className="space-y-4">
                {answers.map((ans) => (
                  <AnswerCard 
                    key={ans.id} 
                    answer={ans}
                    isQuestionAsker={isQuestionAsker}
                    isQuestionSolved={isSolved}
                    onAccept={handleAcceptAnswer}
                    onUpvote={handleUpvoteAnswer}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Write an Answer form */}
          {!isSolved && (
            <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm space-y-3">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block">Write an Answer</span>
              <form onSubmit={handlePostAnswer} className="space-y-3">
                <Textarea
                  value={answerBody}
                  onChange={(e) => setAnswerBody(e.target.value)}
                  placeholder="Provide your advice, citations, or instructions..."
                  rows={4}
                  required
                  disabled={postingAnswer}
                />
                <Button
                  type="submit"
                  loading={postingAnswer}
                  variant="primary"
                  className="w-full text-white py-2.5 flex items-center justify-center gap-1.5"
                >
                  <Send size={14} /> Submit Answer
                </Button>
              </form>
            </GlassCard>
          )}

        </div>

        {/* Right Col: Expert information summary */}
        <div className="space-y-5 lg:w-[320px] flex-shrink-0">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider px-1">Specialized Advisors</h4>
          
          <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm text-xs space-y-4">
            <div className="flex items-center gap-1.5 font-bold text-primary border-b border-white/20 pb-2 mb-2">
              <Sparkles size={14} className="text-indigo-600" />
              <span>Category Routing</span>
            </div>

            <p className="text-muted leading-relaxed">
              This discussion is routed to specialists of the <strong className="text-primary">{question.category}</strong> category. Verified experts in this field have been notified.
            </p>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
