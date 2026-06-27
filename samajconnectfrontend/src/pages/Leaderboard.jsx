import React, { useEffect, useState } from "react";
import { Trophy, Award, Medal, Loader, AlertCircle } from "lucide-react";
import LeaderboardRow from "../components/trust/LeaderboardRow";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import Skeleton from "../components/ui/Skeleton";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { formatScore, getTierColor } from "../utils/formatters";

export default function Leaderboard() {
  const { user, profile } = useAuth();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("all-time"); // week, all-time

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.get("/trust/leaderboard");
      // Backend returns users sorted by trustScore
      setLeaderboard(res.data.leaderboard || res.data || []);
    } catch (err) {
      console.warn("Failed to fetch leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Split podium and list
  const first = leaderboard[0] || null;
  const second = leaderboard[1] || null;
  const third = leaderboard[2] || null;
  
  const listRows = leaderboard.slice(3, 10);

  // Find current user rank
  const myIndex = leaderboard.findIndex(u => u.uid === user?.uid);
  const myRank = myIndex !== -1 ? myIndex + 1 : 14;
  const myScore = myIndex !== -1 ? leaderboard[myIndex].trustScore : (user ? 75 : 0);
  const tier = profile?.tier || "Bronze";

  return (
    <div className="max-w-[900px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 border border-white/40 p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-display text-primary flex items-center gap-2">
            <Trophy size={20} className="text-amber-500" />
            <span>Community Champions</span>
          </h2>
          <p className="text-xs text-muted">Latur, Ward 12 · Leaderboard updates daily</p>
        </div>

        {/* Timeframe pill toggle */}
        <div className="flex p-0.5 bg-white/40 border border-white/20 rounded-xl">
          {["week", "all-time"].map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 text-xs font-bold rounded-lg uppercase transition-all cursor-pointer ${
                timeframe === t
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-muted hover:text-primary"
              }`}
            >
              {t === "week" ? "Weekly" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="flex justify-center items-end gap-4 h-48">
            <Skeleton width="120px" height="120px" />
            <Skeleton width="120px" height="150px" />
            <Skeleton width="120px" height="100px" />
          </div>
          <Skeleton height="60px" />
          <Skeleton height="60px" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="p-8 text-center bg-white/40 border border-white/20 rounded-2xl">
          <AlertCircle className="text-muted mx-auto mb-2" size={32} />
          <span className="text-xs text-muted block">No leaderboard entries found.</span>
        </div>
      ) : (
        <div className="space-y-6 pb-16">
          
          {/* 🥇 🥈 🥉 PODIUM */}
          <div className="flex flex-col sm:flex-row justify-center items-end gap-6 sm:gap-4 py-4 px-2">
            
            {/* 🥈 Second Place (Left on desktop) */}
            {second && (
              <div className="w-full sm:w-[160px] flex flex-col items-center order-2 sm:order-1">
                <GlassCard className="p-4 bg-white/60 border-white/40 shadow-sm w-full flex flex-col items-center gap-2 border-b-[4px] border-b-slate-400">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-0.5">
                    <Award size={13} /> 2nd
                  </span>
                  <Avatar name={second.name} tier={second.tier} size="md" style={{ borderColor: getTierColor(second.tier) }} />
                  <div className="text-center min-w-0 w-full mt-1">
                    <h4 className="text-xs font-bold text-primary truncate leading-tight">{second.name}</h4>
                    <span className="text-[10px] text-muted">{second.ward || "Ward 12"}</span>
                  </div>
                  <span className="text-xs font-bold font-data text-indigo-700 mt-1">
                    {formatScore(second.trustScore)}
                  </span>
                </GlassCard>
              </div>
            )}

            {/* 🥇 First Place (Center on desktop) */}
            {first && (
              <div className="w-full sm:w-[180px] flex flex-col items-center order-1 sm:order-2 scale-105 sm:scale-105 z-10">
                <GlassCard className="p-5 bg-white/70 border-white/50 shadow-md w-full flex flex-col items-center gap-2.5 border-b-[4px] border-b-amber-500 shadow-amber-200/20">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-0.5">
                    <Trophy size={13} className="text-amber-500" /> 1st
                  </span>
                  <Avatar name={first.name} tier={first.tier} size="lg" style={{ borderColor: getTierColor(first.tier) }} />
                  <div className="text-center min-w-0 w-full mt-1">
                    <h4 className="text-sm font-bold text-primary truncate leading-tight">{first.name}</h4>
                    <span className="text-[10px] text-muted">{first.ward || "Ward 12"}</span>
                  </div>
                  <span className="text-sm font-bold font-data text-indigo-700 mt-1">
                    {formatScore(first.trustScore)}
                  </span>
                </GlassCard>
              </div>
            )}

            {/* 🥉 Third Place (Right on desktop) */}
            {third && (
              <div className="w-full sm:w-[150px] flex flex-col items-center order-3 sm:order-3">
                <GlassCard className="p-4 bg-white/60 border-white/40 shadow-sm w-full flex flex-col items-center gap-2 border-b-[4px] border-b-amber-700">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-0.5">
                    <Medal size={13} /> 3rd
                  </span>
                  <Avatar name={third.name} tier={third.tier} size="md" style={{ borderColor: getTierColor(third.tier) }} />
                  <div className="text-center min-w-0 w-full mt-1">
                    <h4 className="text-xs font-bold text-primary truncate leading-tight">{third.name}</h4>
                    <span className="text-[10px] text-muted">{third.ward || "Ward 12"}</span>
                  </div>
                  <span className="text-xs font-bold font-data text-indigo-700 mt-1">
                    {formatScore(third.trustScore)}
                  </span>
                </GlassCard>
              </div>
            )}

          </div>

          {/* Ranks 4-10 */}
          {listRows.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block px-1">Top Standings</span>
              {listRows.map((u, i) => (
                <LeaderboardRow 
                  key={u.uid} 
                  rank={i + 4} 
                  user={u} 
                  isCurrentUser={u.uid === user?.uid} 
                />
              ))}
            </div>
          )}

          {/* Sticky My Rank widget */}
          {user && (
            <div className="fixed bottom-0 left-[240px] right-0 px-6 py-4 glass-elevated border-t border-white/20 bg-white/95 z-20 shadow-xl flex justify-between items-center max-w-[900px] mx-auto rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  #{myRank}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary">Your Standings Rank</h4>
                  <span className="text-[10px] text-muted">Tier: {tier}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-muted block text-right">Score</span>
                  <span className="font-bold text-indigo-700 font-data">{formatScore(myScore)}</span>
                </div>
                
                {myRank > 1 && (
                  <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold px-2 py-1 rounded-xl">
                    Rank up soon!
                  </span>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
