import React, { useEffect, useState, useContext } from "react";
import { Lightbulb, Search, Plus, Sparkles, MessageSquare, ShieldAlert, Bot } from "lucide-react";
import QuestionCard from "../components/hub/QuestionCard";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import { Input, Textarea, Select } from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import Avatar from "../components/ui/Avatar";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import { useAuth } from "../hooks/useAuth";
import { useDebounce } from "../hooks/useDebounce";
import { categorizeQuestion } from "../services/gemini";
import api from "../services/api";
import toast from "react-hot-toast";

const CATEGORIES = ["all", "agriculture", "legal", "medical", "plumbing", "electrical", "education", "financial"];
const STATUSES = ["all", "open", "answered", "solved"];

export default function ExpertiseHub() {
  const { user, profile, refreshProfile } = useAuth();

  // Search & Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [expertCategoryFilter, setExpertCategoryFilter] = useState("all");

  // Data states
  const [questions, setQuestions] = useState([]);
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingExperts, setLoadingExperts] = useState(true);

  // Modal triggers
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [expertModalOpen, setExpertModalOpen] = useState(false);

  // Form: Ask Question
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [language, setLanguage] = useState("English");
  const [posting, setPosting] = useState(false);

  // AI debounced results
  const debouncedTitle = useDebounce(title, 600);
  const [aiRouting, setAiRouting] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [similarQuestions, setSimilarQuestions] = useState([]);

  // Form: Become Expert
  const [expertCats, setExpertCats] = useState([]);
  const [registeringExpert, setRegisteringExpert] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = {
        city: profile?.city || "Latur"
      };
      if (category !== "all") params.category = category;
      if (status !== "all") params.status = status;
      if (search.trim()) params.search = search;

      const res = await api.get("/hub/questions", { params });
      setQuestions(res.data.questions || res.data || []);
    } catch (err) {
      console.warn("Failed to fetch questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExperts = async () => {
    setLoadingExperts(true);
    try {
      const res = await api.get("/hub/experts");
      setExperts(res.data.experts || res.data || []);
    } catch (err) {
      console.warn("Failed to fetch experts:", err);
    } finally {
      setLoadingExperts(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [category, status, search, profile]);

  useEffect(() => {
    fetchExperts();
  }, []);

  // AI categorization hook
  useEffect(() => {
    const runAiCategorization = async () => {
      if (!debouncedTitle.trim()) {
        setAiRouting(null);
        setSimilarQuestions([]);
        return;
      }
      
      setAiLoading(true);
      try {
        const route = await categorizeQuestion(debouncedTitle, body);
        setAiRouting(route);

        // Fetch similar questions to prevent duplicates
        const simRes = await api.get("/hub/questions/search", { params: { q: debouncedTitle } });
        setSimilarQuestions(simRes.data.questions?.slice(0, 2) || []);
      } catch (err) {
        console.warn("Failed Q&A AI categorization:", err);
      } finally {
        setAiLoading(false);
      }
    };
    runAiCategorization();
  }, [debouncedTitle]);

  const handlePostQuestion = async (e) => {
    e.preventDefault();
    if (!title || !body) return toast.error("Please enter a title and description");

    setPosting(true);
    try {
      const payload = {
        title,
        body,
        category: aiRouting?.category || "other",
        tags: aiRouting?.tags || [],
        language,
        city: profile?.city || "Latur",
        ward: profile?.ward || "Ward 12"
      };

      await api.post("/hub/questions", payload);
      toast.success("Question posted successfully! Experts alerted 🚀");
      
      // Reset & Refresh
      setTitle("");
      setBody("");
      setAskModalOpen(false);
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to post question");
    } finally {
      setPosting(false);
    }
  };

  const handleBecomeExpert = async (e) => {
    e.preventDefault();
    if (expertCats.length === 0) return toast.error("Please select at least one category");

    setRegisteringExpert(true);
    try {
      await api.post("/auth/expert-register", { expertCategories: expertCats });
      toast.success("Congratulations! You are now a community expert ⭐");
      setExpertModalOpen(false);
      refreshProfile();
      fetchExperts();
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setRegisteringExpert(false);
    }
  };

  const toggleExpertCatSelection = (cat) => {
    if (expertCats.includes(cat)) {
      setExpertCats(expertCats.filter(c => c !== cat));
    } else {
      setExpertCats([...expertCats, cat]);
    }
  };

  // Filter experts list
  const filteredExperts = experts.filter((exp) => {
    if (expertCategoryFilter === "all") return true;
    return exp.expertCategories?.includes(expertCategoryFilter);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      
      {/* ── LEFT PANEL: QUESTIONS FEED ── */}
      <div className="space-y-5">
        
        {/* Top Controls: Search + Categories */}
        <GlassCard className="p-4 bg-white/60 border-white/40 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Categories select */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  category === cat
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "bg-white/40 border-white/60 text-primary hover:bg-white/65"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="glass-input py-1.5 px-3 text-xs w-32 bg-white/40 border-white/60"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="answered">Answered</option>
              <option value="solved">Solved</option>
            </select>

            <Button
              onClick={() => setAskModalOpen(true)}
              variant="primary"
              size="sm"
              className="flex items-center gap-1 text-white"
            >
              <Plus size={15} /> Ask Question
            </Button>
          </div>
        </GlassCard>

        {/* Search input */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search discussion topics by keywords..."
            className="w-full pl-9 py-2 glass-input text-xs"
          />
        </div>

        {/* Questions Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton height="140px" />
              <Skeleton height="140px" />
            </div>
          ) : questions.length === 0 ? (
            <EmptyState 
              icon={<Lightbulb size={32} />} 
              title="No questions yet" 
              description="Be the first to ask a question to local experts in Latur!"
              actionLabel="Ask a Question"
              onAction={() => setAskModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {questions.map((q) => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: EXPERTS ── */}
      <div className="space-y-4 lg:w-[320px] flex-shrink-0">
        <h4 className="text-xs font-bold text-muted uppercase tracking-wider px-1">Registered Experts</h4>
        
        <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm flex flex-col gap-4">
          <Select
            label="Filter Experts by Category"
            value={expertCategoryFilter}
            onChange={(e) => setExpertCategoryFilter(e.target.value)}
            className="text-xs py-1.5"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.filter(c => c !== "all").map(c => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </Select>

          {/* Expert List */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {loadingExperts ? (
              <Skeleton height="64px" />
            ) : filteredExperts.length === 0 ? (
              <span className="text-xs text-muted block text-center py-4">No experts in this category.</span>
            ) : (
              filteredExperts.map((exp) => (
                <div key={exp.id || exp.uid} className="flex items-center gap-3 p-2 bg-white/40 border border-white/20 rounded-xl">
                  <Avatar name={exp.name} tier={exp.tier || "Bronze"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-primary truncate leading-tight">{exp.name}</h4>
                    <span className="text-[9px] font-bold text-indigo-700 uppercase block mt-0.5">
                      {exp.expertCategories?.join(", ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Become expert link */}
          {!profile?.isExpert && (
            <button
              onClick={() => setExpertModalOpen(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 text-center w-full block pt-2 border-t border-white/20 cursor-pointer"
            >
              Become an expert in your community →
            </button>
          )}
        </GlassCard>
      </div>

      {/* ── ASK QUESTION MODAL ── */}
      <Modal
        isOpen={askModalOpen}
        onClose={() => setAskModalOpen(false)}
        title="Ask the Community"
      >
        <form onSubmit={handlePostQuestion} className="space-y-4">
          <Input
            type="text"
            label="Question Topic/Title"
            placeholder="e.g. Tomato crop leaves turning brown - what disease is this?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={posting}
          />

          <Textarea
            label="Detailed Description"
            placeholder="Provide context, symptoms, or legal issue background to receive specific expert routing..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            required
            disabled={posting}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Select language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={posting}
            >
              <option value="English">English</option>
              <option value="Marathi">Marathi</option>
              <option value="Hindi">Hindi</option>
            </Select>
          </div>

          {/* AI routing chip */}
          {(aiLoading || aiRouting) && (
            <div className="p-3 border-l-4 border-l-indigo-500 bg-indigo-50/50 border-white/30 rounded-xl text-xs flex items-center gap-2">
              <Bot size={15} className="text-indigo-600" />
              {aiLoading ? (
                <span>🤖 AI is analysis routing category...</span>
              ) : (
                <span className="font-bold text-indigo-900">
                  AI Route Target: {aiRouting.category?.toUpperCase()} expert · Tags: {aiRouting.tags?.join(", ")}
                </span>
              )}
            </div>
          )}

          {/* Similar questions display */}
          {similarQuestions.length > 0 && (
            <div className="p-3.5 border border-amber-300 bg-amber-50/40 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <ShieldAlert size={14} />
                <span>Wait! Are these similar questions helpful?</span>
              </div>
              <div className="space-y-1">
                {similarQuestions.map(q => (
                  <Link 
                    key={q.id} 
                    to={`/hub/${q.id}`} 
                    target="_blank"
                    className="block text-indigo-700 hover:underline font-semibold"
                  >
                    • {q.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            loading={posting}
            variant="primary"
            className="w-full text-white mt-2"
          >
            Post Question 🚀
          </Button>
        </form>
      </Modal>

      {/* ── BECOME EXPERT MODAL ── */}
      <Modal
        isOpen={expertModalOpen}
        onClose={() => setExpertModalOpen(false)}
        title="Become a Community Expert"
      >
        <form onSubmit={handleBecomeExpert} className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            By registering as an expert, you help route neighborhood questions, earn badges, and gain trust points. Please select categories where you hold qualifications or verified skills.
          </p>

          <div className="space-y-2">
            <span className="text-xs font-bold text-muted uppercase tracking-wider block">Specializations</span>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.filter(c => c !== "all").map((cat) => {
                const isSelected = expertCats.includes(cat);
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleExpertCatSelection(cat)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      isSelected 
                        ? "bg-indigo-600 border-indigo-600 text-white" 
                        : "bg-white/50 border-white/40 text-primary hover:bg-white/70"
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            loading={registeringExpert}
            variant="primary"
            className="w-full text-white mt-2"
          >
            Register Specializations
          </Button>
        </form>
      </Modal>

    </div>
  );
}
