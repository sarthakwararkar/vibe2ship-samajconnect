import React, { useEffect, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import { User, Award, Shield, FileText, CheckCircle2, MessageSquare, HeartHandshake, Settings, Edit, Lock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { AppContext } from "../context/AppContext";
import GlassCard from "../components/ui/GlassCard";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";
import StatCard from "../components/ui/StatCard";
import { Input, Select } from "../components/ui/Input";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Skeleton from "../components/ui/Skeleton";
import api from "../services/api";
import { formatScore, getTierColor, getTierRange, timeAgo } from "../utils/formatters";
import toast from "react-hot-toast";

const BADGES_LIST = [
  { id: "b1", name: "First Responder", emoji: "🚨", description: "Reported your first civic issue", requirement: 1 },
  { id: "b2", name: "Eagle Eye", emoji: "👁️", description: "Verified 5 community reports", requirement: 5 },
  { id: "b3", name: "Green Citizen", emoji: "🌱", description: "Shared 3 items on marketplace", requirement: 3 },
  { id: "b4", name: "Local Sage", emoji: "🎓", description: "Solved 3 community expert questions", requirement: 3 },
  { id: "b5", name: "Guardian", emoji: "🛡️", description: "Added 3 contacts to safety circle", requirement: 3 }
];

export default function Profile() {
  const location = useLocation();
  const { profile, refreshProfile } = useAuth();
  const { detectedCity } = useContext(AppContext);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [ward, setWard] = useState("");
  const [updating, setUpdating] = useState(false);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setWard(profile.ward || "Ward 12");
    }
  }, [profile]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!profile?.uid) return;
      
      // 1. Fetch trust ledger
      setLoadingHistory(true);
      try {
        const ledgerRes = await api.get(`/trust/history/${profile.uid}`);
        setHistory(ledgerRes.data.history || []);
      } catch (err) {
        console.warn("Failed to fetch profile history:", err);
      } finally {
        setLoadingHistory(false);
      }

      // 2. Fetch badges
      try {
        const badgesRes = await api.get(`/trust/badges/${profile.uid}`);
        setBadges(badgesRes.data.badges || []);
      } catch (err) {
        console.warn("Failed to fetch badges:", err);
      }
    };
    fetchUserData();
  }, [profile]);

  // Open settings if URL query has settings=true
  useEffect(() => {
    if (location.search.includes("settings=true")) {
      setModalOpen(true);
    }
  }, [location]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name || !ward) return toast.error("Name and Ward are required");

    setUpdating(true);
    try {
      await api.post("/auth/profile", { name, ward });
      toast.success("Profile updated successfully!");
      setModalOpen(false);
      refreshProfile();
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const score = profile?.trustScore || 0;
  const tier = profile?.tier || "Bronze";
  const { min, max } = getTierRange(tier);
  const tierProgress = score - min;
  const tierTotal = max - min;

  // Mocked counts matching user's activities
  const reportedCount = history.filter(h => h.eventKey === "issue_reported").length || 1;
  const verifiedCount = history.filter(h => h.eventKey === "issue_verified").length || 3;
  const answeredCount = profile?.isExpert ? 2 : 0;
  const sharedCount = history.filter(h => h.eventKey === "item_shared").length || 1;

  return (
    <div className="space-y-6">
      
      {/* ── TOP HERO PROFILE SECTION ── */}
      <GlassCard className="glass-elevated p-6 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/70 border-white/50 shadow-md">
        <div className="flex items-center gap-5 flex-col md:flex-row text-center md:text-left w-full">
          <Avatar src={profile?.photoURL} name={profile?.name} tier={tier} size="lg" />
          
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl font-bold font-display text-primary">{profile?.name}</h2>
              <Badge variant={tier} />
            </div>
            
            <p className="text-xs text-muted font-medium">
              📍 {detectedCity || profile?.city || "Latur"}, Maharashtra · {profile?.ward} · Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN") : "Recently"}
            </p>

            {/* Score progress */}
            {max && (
              <div className="w-full max-w-md space-y-1 mt-3">
                <div className="flex justify-between text-xs font-semibold text-muted">
                  <span className="font-data text-indigo-700">{formatScore(score)}</span>
                  <span>{max - score} pts to {tier === "Bronze" ? "Silver" : tier === "Silver" ? "Gold" : "Platinum"}</span>
                </div>
                <ProgressBar value={tierProgress} max={tierTotal} color="bg-indigo-600" height="6px" />
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 bg-white/40 border-white/60 text-primary hover:bg-white/80 self-center"
        >
          <Edit size={14} /> Edit Profile
        </Button>
      </GlassCard>

      {/* ── 3 COLUMN DETAILS SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Column 1: Stats */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted uppercase tracking-wider px-1">Performance Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Issues Filed" value={reportedCount} icon={<FileText size={18} />} color="var(--teal)" />
            <StatCard title="Verifications" value={verifiedCount} icon={<CheckCircle2 size={18} />} color="var(--blue)" />
            <StatCard title="Answers Given" value={answeredCount} icon={<MessageSquare size={18} />} color="var(--amber)" />
            <StatCard title="Shared Items" value={sharedCount} icon={<HeartHandshake size={18} />} color="var(--emerald)" />
          </div>
        </div>

        {/* Column 2: Badges */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted uppercase tracking-wider px-1">Unlocked Badges</h3>
          
          <div className="grid grid-cols-2 gap-3.5">
            {BADGES_LIST.map((b) => {
              // Check if user has this badge
              const isUnlocked = badges.includes(b.name) || score > (b.requirement * 30);
              return (
                <GlassCard 
                  key={b.id} 
                  className={`p-4 border text-center flex flex-col items-center gap-2 bg-white/60 border-white/40 transition-all ${
                    !isUnlocked ? "opacity-50 select-none bg-white/20" : "shadow-sm shadow-indigo-100"
                  }`}
                >
                  <div className="relative">
                    <span className="text-3xl block">{b.emoji}</span>
                    {!isUnlocked && (
                      <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-200 border border-white text-muted">
                        <Lock size={9} />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-primary block leading-tight">{b.name}</span>
                    <span className="text-[9px] text-muted block mt-1 leading-tight">{b.description}</span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Column 3: Activity feed */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted uppercase tracking-wider px-1">Recent Activities</h3>
          
          <GlassCard className="p-4 bg-white/60 border-white/40 shadow-sm space-y-4 max-h-[350px] overflow-y-auto">
            {loadingHistory ? (
              <span className="text-xs text-muted block">Loading activity ledger...</span>
            ) : history.length === 0 ? (
              <span className="text-xs text-muted block text-center py-4">No recent points transactions.</span>
            ) : (
              <div className="space-y-3">
                {history.map((evt, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-2 text-xs border-b border-white/20 pb-2 last:border-none">
                    <div className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                      <div>
                        <p className="font-semibold text-primary">{evt.description}</p>
                        <span className="text-[9px] text-muted">{timeAgo(evt.createdAt)}</span>
                      </div>
                    </div>
                    <span className="font-bold font-data text-emerald-600 flex-shrink-0">+{evt.points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

      </div>

      {/* ── SETTINGS MODAL ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Account Profile Settings"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <Input
            type="text"
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={updating}
          />

          <Select
            label="Ward Office"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            disabled={updating}
          >
            <option value="Ward 12">Ward 12</option>
            <option value="Ward 11">Ward 11</option>
            <option value="Ward 10">Ward 10</option>
          </Select>

          <Button
            type="submit"
            loading={updating}
            variant="primary"
            className="w-full text-white mt-2"
          >
            Save Updates
          </Button>
        </form>
      </Modal>

    </div>
  );
}
