import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  AlertTriangle, 
  Wind, 
  Shield, 
  Lightbulb, 
  Package, 
  BarChart3, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { AppContext } from "../context/AppContext";
import TrustScoreRing from "../components/trust/TrustScoreRing";
import IssueCard from "../components/issues/IssueCard";
import ProgressBar from "../components/ui/ProgressBar";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import api from "../services/api";
import { timeAgo, formatScore, getTierRange, getAqiColor } from "../utils/formatters";
import toast from "react-hot-toast";

export default function Home() {
  const navigate = useNavigate();
  const { profile, loading: loadingProfile } = useAuth();
  const { aqiData, loadingAqi, detectedCity, activeDisasters = [] } = useContext(AppContext);

  const [trustEvents, setTrustEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [recentIssues, setRecentIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  const [activeJourney, setActiveJourney] = useState(null);
  const [openIssuesCount, setOpenIssuesCount] = useState(0);

  // Time-based greeting
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  };

  // Fetch initial home content
  useEffect(() => {
    const fetchHomeData = async () => {
      if (!profile?.uid) return;

      // 1. Fetch Trust Score history
      setLoadingEvents(true);
      try {
        const eventsRes = await api.get(`/trust/history/${profile.uid}`);
        setTrustEvents(eventsRes.data.history?.slice(0, 5) || []);
      } catch (err) {
        console.warn("Failed to fetch trust events:", err);
        // Fallback dummy events
        setTrustEvents([
          { id: "e1", description: "Verified streetlight repair report", points: 10, createdAt: new Date(Date.now() - 3600000) },
          { id: "e2", description: "Reported missing waste bin on Main St", points: 50, createdAt: new Date(Date.now() - 86400000) }
        ]);
      } finally {
        setLoadingEvents(false);
      }

      // 2. Fetch issues near user
      setLoadingIssues(true);
      try {
        const issuesRes = await api.get("/issues", { params: { city: detectedCity || profile.city || "Latur", limit: 3 } });
        setRecentIssues(issuesRes.data.issues || []);
        
        // Count open issues
        const openRes = await api.get("/issues/stats");
        setOpenIssuesCount(openRes.data.openCount || openRes.data.statusCounts?.open || 3);
      } catch (err) {
        console.warn("Failed to fetch recent issues:", err);
        setRecentIssues([]);
      } finally {
        setLoadingIssues(false);
      }

      // 3. Check active journey status
      try {
        const activeJourneyRes = await api.get("/safety/journey/active");
        setActiveJourney(activeJourneyRes.data.journey || null);
      } catch (err) {
        console.warn("Failed to fetch active journey:", err);
      }
    };

    fetchHomeData();
  }, [profile, detectedCity]);

  // Calculate progress within current tier
  const score = profile?.trustScore || 0;
  const tier = profile?.tier || "Bronze";
  const { min, max } = getTierRange(tier);
  const tierProgress = score - min;
  const tierTotal = max - min;

  // AQI color & messages
  const currentAqi = aqiData?.aqi || 72;
  const isHighAqi = currentAqi > 150;

  const modules = [
    { to: "/issues", title: "Issues", icon: AlertTriangle, color: "var(--teal)", bg: "text-teal-600", desc: `${openIssuesCount} open issues near you` },
    { to: "/aqi", title: "AQI + Weather", icon: Wind, color: "var(--blue)", bg: "text-blue-600", desc: `AQI ${currentAqi} · ${isHighAqi ? "Unhealthy" : "Moderate"}` },
    { to: "/safety", title: "Safety Network", icon: Shield, color: "var(--pink)", bg: "text-pink-600", desc: activeJourney ? "⚠️ Active journey tracking" : "Trusted circle is online" },
    { to: "/hub", title: "Expertise Hub", icon: Lightbulb, color: "var(--amber)", bg: "text-amber-600", desc: "Consult community experts" },
    { to: "/marketplace", title: "Marketplace", icon: Package, color: "var(--emerald)", bg: "text-emerald-600", desc: "Sell, donate or borrow items" },
    { to: "/impact", title: "Impact Dashboard", icon: BarChart3, color: "var(--purple-500)", bg: "text-indigo-600", desc: "View community changes" }
  ];

  return (
    <div className="space-y-6">
      {/* Dynamic disaster banner */}
      {activeDisasters.length > 0 && (
        <div className="p-4 border border-red-500 bg-red-500/10 text-red-900 rounded-2xl flex items-center justify-between gap-4 animate-pulse border-l-8 border-l-red-600 glass shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white text-lg">
              🚨
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-950 uppercase tracking-wider leading-tight">
                CRITICAL DISASTER ALERT NEARBY: {activeDisasters[0].type.toUpperCase().replace("_", " ")}
              </h4>
              <p className="text-xs text-red-800 font-medium mt-0.5">
                {activeDisasters[0].description} at {activeDisasters[0].address}. Please check on neighbors and stay safe!
              </p>
            </div>
          </div>
          <Link 
            to="/safety"
            className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-red-600/10 border-none cursor-pointer select-none"
          >
            Open Map & Details
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr_320px] gap-6 items-start">
      
      {/* ── LEFT COLUMN: TRUST SCORE & ALERTS ── */}
      <div className="space-y-6">
        
        {/* Trust Score Card */}
        <GlassCard className="glass-elevated p-6 flex flex-col items-center text-center bg-white/70 border-white/50 shadow-md">
          <TrustScoreRing score={score} tier={tier} size="lg" />
          
          <h3 className="text-xl font-bold font-display text-primary mt-4">
            {loadingProfile ? <Skeleton width="120px" height="24px" className="mx-auto" /> : profile?.name}
          </h3>
          <p className="text-xs text-muted font-medium mt-1">
            {detectedCity || profile?.city || "Latur"}, Maharashtra · {profile?.ward}
          </p>

          {max && (
            <div className="w-full space-y-1.5 mt-5">
              <div className="flex justify-between text-xs font-semibold text-muted">
                <span>{score} pts</span>
                <span>{max - score} pts to {tier === "Bronze" ? "Silver" : tier === "Silver" ? "Gold" : "Platinum"}</span>
              </div>
              <ProgressBar value={tierProgress} max={tierTotal} color="bg-indigo-600" height="6px" />
            </div>
          )}
        </GlassCard>

        {/* Recent Trust Events */}
        <GlassCard className="p-5 flex flex-col gap-3.5 bg-white/60 border-white/40 shadow-sm">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Points Ledger</h4>
          
          {loadingEvents ? (
            <div className="space-y-3">
              <Skeleton height="32px" />
              <Skeleton height="32px" />
            </div>
          ) : trustEvents.length === 0 ? (
            <span className="text-xs text-muted">No point transactions yet.</span>
          ) : (
            <div className="space-y-2.5">
              {trustEvents.map((evt) => (
                <div key={evt.id} className="flex justify-between items-start gap-2 text-xs">
                  <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                    <div>
                      <p className="font-semibold text-primary">{evt.description}</p>
                      <span className="text-[10px] text-muted">{timeAgo(evt.createdAt)}</span>
                    </div>
                  </div>
                  <span className="font-data font-bold text-emerald-600">+{evt.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── CENTER COLUMN: GRID & FEED ── */}
      <div className="space-y-6">
        
        {/* Welcome Header */}
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold font-display text-primary tracking-tight">
            {getGreeting()}, {profile?.name ? profile.name.split(" ")[0] : "Citizen"}
          </h2>
          <p className="text-sm text-muted">
            📍 {detectedCity || profile?.city || "Latur"} · {profile?.ward || "Ward 12"}
          </p>
        </div>

        {/* Active Journey Banner if user has one */}
        {activeJourney && (
          <GlassCard 
            onClick={() => navigate("/safety")}
            className="p-4 border-l-4 border-l-pink-500 bg-pink-50/50 border-pink-200 shadow-sm cursor-pointer hover:bg-pink-50 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-pink-500 text-white animate-pulse">
                <Shield size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-pink-900">Active Journey Tracking</h4>
                <p className="text-xs text-pink-700">Your trusted circle is receiving updates. Heading to {activeJourney.to}.</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-pink-600" />
          </GlassCard>
        )}

        {/* Modules Grid */}
        <div className="grid grid-cols-2 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <GlassCard
                key={mod.title}
                onClick={() => navigate(mod.to)}
                hover
                className="p-6 flex flex-col justify-between min-h-[140px] bg-white/60 border-white/40 shadow-sm relative group"
              >
                <div>
                  <div 
                    className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm"
                    style={{ color: mod.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold font-display text-primary mt-4 group-hover:text-indigo-700 transition-colors">
                    {mod.title}
                  </h3>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted font-medium">
                  <span>{mod.desc}</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {/* Accent stripe */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl" 
                  style={{ backgroundColor: mod.color }} 
                />
              </GlassCard>
            );
          })}
        </div>

        {/* Issues Feed */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-1">
            <h3 className="text-lg font-bold font-display text-primary">Issues near you</h3>
            <Link to="/issues" className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
              <span>View all</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loadingIssues ? (
            <div className="space-y-4">
              <Skeleton height="100px" />
              <Skeleton height="100px" />
            </div>
          ) : recentIssues.length === 0 ? (
            <EmptyState 
              icon={<AlertCircle size={32} />} 
              title="No issues nearby" 
              description="No active infrastructure reports in your ward right now."
              actionLabel="Report an Issue"
              onAction={() => navigate("/issues/report")}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {recentIssues.map((issue) => (
                <IssueCard 
                  key={issue.id} 
                  issue={issue} 
                  compact 
                  onUpdate={(updated) => {
                    setRecentIssues(prev => prev.map(iss => iss.id === updated.id ? updated : iss));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT COLUMN: AQI TELEMETRY & ALERTS ── */}
      <div className="space-y-6">
        
        {/* Live AQI Panel */}
        <GlassCard className="glass-elevated p-5 flex flex-col gap-4 bg-white/70 border-white/50 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Live AQI</span>
              <h4 className="text-sm font-bold text-primary">{aqiData?.city || "Latur Station"}</h4>
            </div>
            <Link to="/aqi" className="text-[10px] font-bold text-indigo-600 hover:underline uppercase">
              Details
            </Link>
          </div>

          {loadingAqi ? (
            <div className="flex items-center gap-4 py-2">
              <Skeleton width="48px" height="48px" rounded="full" />
              <div className="space-y-1">
                <Skeleton width="60px" height="20px" />
                <Skeleton width="40px" height="10px" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-5 my-1">
              <div 
                className="text-4xl font-extrabold font-data p-3 rounded-2xl bg-white shadow-sm flex items-center justify-center min-w-[76px]"
                style={{ color: getAqiColor(currentAqi) }}
              >
                {currentAqi}
              </div>
              <div>
                <span className="text-xs font-semibold block text-primary">
                  {isHighAqi ? "⚠️ Poor Quality" : "Moderate Quality"}
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200/50 text-[10px] font-semibold text-indigo-800">
                  Dominant: {aqiData?.pollutant || "PM2.5"}
                </span>
              </div>
            </div>
          )}

          {/* Temperature & Humidity */}
          <div className="grid grid-cols-2 gap-3.5 text-xs border-t border-white/30 pt-3.5">
            <div>
              <span className="text-muted font-medium block">Temperature</span>
              <span className="font-bold text-primary font-data">{aqiData?.temp || 28}°C</span>
            </div>
            <div>
              <span className="text-muted font-medium block">Humidity</span>
              <span className="font-bold text-primary font-data">{aqiData?.humidity || 62}%</span>
            </div>
          </div>
          
          {/* AQI Warning */}
          {isHighAqi && (
            <div className="p-3 rounded-xl bg-red-100/70 border border-red-200 text-xs text-red-700 flex gap-2 animate-pulse">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>High pollution levels. Sensitive residents should stay indoors.</span>
            </div>
          )}
        </GlassCard>

        {/* Active Alerts Feed */}
        <GlassCard className="p-5 flex flex-col gap-4 bg-white/60 border-white/40 shadow-sm">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Local Alert Board</h4>
            <span className="text-[10px] text-muted font-semibold font-data">Live</span>
          </div>

          <div className="space-y-3">
            {/* Warning 1: Static placeholder matching screenshot details */}
            <div className="p-3 border-l-4 border-l-red-500 bg-red-50/40 border-white/30 rounded-xl text-xs space-y-1">
              <div className="flex justify-between items-start">
                <span className="font-bold text-red-800">High Winds Warning</span>
                <span className="text-[9px] font-data text-muted">2 hrs ago</span>
              </div>
              <p className="text-muted">Route 9 closed due to severe debris and winds.</p>
            </div>

            <div className="p-3 border-l-4 border-l-pink-500 bg-pink-50/40 border-white/30 rounded-xl text-xs space-y-1">
              <div className="flex justify-between items-start">
                <span className="font-bold text-pink-800">Safety Alert</span>
                <span className="text-[9px] font-data text-muted">12 hrs ago</span>
              </div>
              <p className="text-muted">Avoid poorly lit routes near Park St after 9 PM.</p>
            </div>

            <div className="p-3 border-l-4 border-l-emerald-500 bg-emerald-50/40 border-white/30 rounded-xl text-xs space-y-1">
              <div className="flex justify-between items-start">
                <span className="font-bold text-emerald-800">Issue Resolved</span>
                <span className="text-[9px] font-data text-muted">Yesterday</span>
              </div>
              <p className="text-muted">Water leak report resolved on Elm Street.</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  </div>
  );
}
