import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapPin, Clock, ThumbsUp, Share2, Eye, Flag, Shield, User, Bot, AlertTriangle } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Avatar from "../components/ui/Avatar";
import StatusTracker from "../components/issues/StatusTracker";
import Skeleton from "../components/ui/Skeleton";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { getCategoryEmoji, timeAgo } from "../utils/formatters";
import toast from "react-hot-toast";

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upvoteLoading, setUpvoteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchIssueDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/issues/${id}`);
      setIssue(res.data);
    } catch (err) {
      console.warn("Failed to fetch issue details:", err);
      toast.error("Issue not found");
      navigate("/issues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueDetail();
  }, [id]);

  const handleUpvote = async () => {
    if (!user) return toast.error("Please log in first");
    setUpvoteLoading(true);
    try {
      const res = await api.patch(`/issues/${id}/upvote`);
      toast.success("Verified and upvoted! +10 pts earned ⭐");
      setIssue(prev => ({
        ...prev,
        upvotes: res.data.upvotes,
        verificationCount: res.data.verificationCount,
        status: res.data.status,
        upvotedBy: [...(prev.upvotedBy || []), user.uid]
      }));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to upvote");
    } finally {
      setUpvoteLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      const res = await api.patch(`/issues/${id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      setIssue(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[60%_1fr] gap-6">
        <div className="space-y-4">
          <Skeleton height="280px" />
          <Skeleton width="40%" height="24px" />
          <Skeleton width="100%" height="100px" />
        </div>
        <div className="space-y-4">
          <Skeleton height="300px" />
          <Skeleton height="120px" />
        </div>
      </div>
    );
  }

  if (!issue) return null;

  const isReporter = issue.reporterId === user?.uid;
  const isGoldOrPlus = ["Gold", "Platinum"].includes(profile?.tier || "Bronze");
  const canUpdateStatus = isReporter || isGoldOrPlus;
  const hasUpvoted = issue.upvotedBy?.includes(user?.uid);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[60%_1fr] gap-6 items-start">
      
      {/* ── LEFT COLUMN: DETAILS & TRACKER ── */}
      <div className="space-y-5">
        
        {/* Issue Photo */}
        <GlassCard className="overflow-hidden bg-white/60 border-white/40 shadow-sm relative">
          {issue.photoUrl ? (
            <img 
              src={issue.photoUrl} 
              alt={issue.category} 
              className="w-full h-72 object-cover" 
            />
          ) : (
            <div className="w-full h-64 bg-slate-100 flex flex-col items-center justify-center text-muted gap-2">
              <span className="text-4xl">{getCategoryEmoji(issue.category)}</span>
              <span className="text-xs font-bold uppercase tracking-wider">No photo uploaded</span>
            </div>
          )}
          
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge variant={issue.category} />
            <Badge variant={issue.severity} />
          </div>
        </GlassCard>

        {/* Content details */}
        <GlassCard className="p-6 bg-white/60 border-white/40 shadow-sm space-y-4">
          <h2 className="text-2xl font-extrabold font-display text-primary leading-tight">
            {issue.category?.replace("_", " ").toUpperCase() || "CIVIC ISSUE"}
          </h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted pb-3 border-b border-white/20">
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-indigo-600" />
              <span className="font-semibold text-primary">{issue.address}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              <span>Reported {timeAgo(issue.createdAt)}</span>
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Description</span>
            <p className="text-sm text-primary leading-relaxed">{issue.description}</p>
          </div>

          {/* Reporter details */}
          <div className="flex items-center gap-3 p-3 bg-white/40 border border-white/30 rounded-2xl">
            <Avatar name={issue.reporterName} tier={issue.reporterTier || "Bronze"} size="sm" />
            <div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Reporter</span>
              <span className="text-xs font-bold text-primary">{issue.reporterName || "Anonymous Citizen"}</span>
            </div>
            <Badge variant={issue.reporterTier || "Bronze"} className="ml-auto" />
          </div>
        </GlassCard>

        {/* Status Stepper Tracker */}
        <GlassCard className="p-6 bg-white/60 border-white/40 shadow-sm space-y-2">
          <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Resolution Lifecycle</span>
          <StatusTracker status={issue.status} />
        </GlassCard>

        {/* Verification and Upvote Widget */}
        <GlassCard className="p-5 bg-white/65 border-indigo-200/50 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h4 className="text-sm font-bold text-primary flex items-center gap-1.5">
              <ThumbsUp size={16} className="text-indigo-600" />
              <span>Community Verification</span>
            </h4>
            <p className="text-xs text-muted mt-0.5">
              Verifications alert the local municipal ward to allocate repair resources.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-center font-data">
              <span className="text-lg font-bold text-indigo-700 block">{issue.upvotes || 0}</span>
              <span className="text-[9px] font-bold text-muted uppercase">Votes</span>
            </div>

            {hasUpvoted ? (
              <span className="px-4 py-2 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 select-none">
                ✓ Verified
              </span>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpvote}
                loading={upvoteLoading}
                disabled={issue.status === "resolved" || issue.status === "rejected"}
                className="text-white"
              >
                Verify Issue
              </Button>
            )}
          </div>
        </GlassCard>
      </div>

      {/* ── RIGHT COLUMN: MAP & ACTIONS ── */}
      <div className="space-y-6">
        
        {/* Leaflet minimap */}
        {issue.lat && issue.lng && (
          <GlassCard className="overflow-hidden bg-white/70 border-white/50 p-2 shadow-md">
            <div className="h-64 rounded-xl overflow-hidden">
              <MapContainer 
                center={[parseFloat(issue.lat), parseFloat(issue.lng)]} 
                zoom={15} 
                zoomControl={false}
                attributionControl={false}
                scrollWheelZoom={false}
                className="w-full h-full"
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <CircleMarker 
                  center={[parseFloat(issue.lat), parseFloat(issue.lng)]} 
                  radius={10}
                  pathOptions={{ fillColor: "#6366F1", color: "#FFFFFF", weight: 2 }}
                />
              </MapContainer>
            </div>
            <div className="p-2 text-center text-[10px] font-semibold text-muted">
              📍 Coord: {parseFloat(issue.lat).toFixed(4)}, {parseFloat(issue.lng).toFixed(4)}
            </div>
          </GlassCard>
        )}

        {/* AI Analysis details */}
        <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-800">
            <Bot size={18} />
            <span>AI Automated Assessment</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-muted block">Categorization Confidence</span>
              <span className="font-bold text-primary font-data">
                {issue.aiConfidence ? `${Math.round(issue.aiConfidence * 100)}%` : "90%"}
              </span>
            </div>

            <div>
              <span className="text-muted block">Routed Department</span>
              <Badge variant="pothole" label={issue.assignedDepartment || "Municipal Ward Office"} />
            </div>

            <div>
              <span className="text-muted block">AI Resolution Routing Logic</span>
              <p className="text-[11px] text-muted italic mt-0.5">
                Image visual cues indicate urban road potholing. Ticket routed automatically to Municipal road repair team.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Status updates for Gold Tiers / Reporter */}
        {canUpdateStatus && (
          <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
              <Shield size={16} />
              <span>Privileged Admin Actions</span>
            </div>
            <p className="text-[11px] text-muted">
              As the reporter or a Gold+ community champion, you can override the ticket status.
            </p>

            <select
              value={issue.status}
              disabled={statusLoading}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="glass-input py-2 text-xs bg-white/40 border-white/60"
            >
              <option value="open">Re-open (Open)</option>
              <option value="verified">Verify (Verified)</option>
              <option value="assigned">Assign (Assigned)</option>
              <option value="in_progress">Work In Progress</option>
              <option value="resolved">Mark Resolved</option>
              <option value="rejected">Reject / Invalid</option>
            </select>
          </GlassCard>
        )}

        {/* Action button rows */}
        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleShare}
            variant="ghost" 
            className="w-full bg-white/40 border-white/60 hover:bg-white/80 text-primary justify-start px-4"
          >
            <Share2 size={15} /> Share Report
          </Button>
          <Button 
            onClick={() => toast.success("You are now following this issue for status notifications.")}
            variant="ghost" 
            className="w-full bg-white/40 border-white/60 hover:bg-white/80 text-primary justify-start px-4"
          >
            <Eye size={15} /> Follow Status
          </Button>
          {!isReporter && (
            <Button 
              onClick={() => {
                handleStatusChange("rejected");
                toast.success("Flagged as invalid. Flag recorded.");
              }}
              variant="danger" 
              className="w-full justify-start px-4"
            >
              <Flag size={15} /> Flag as Invalid
            </Button>
          )}
        </div>

      </div>

    </div>
  );
}
