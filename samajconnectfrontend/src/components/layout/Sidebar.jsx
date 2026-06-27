import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { 
  Home, 
  AlertTriangle, 
  Wind, 
  Shield, 
  Lightbulb, 
  Package, 
  BarChart3, 
  Trophy, 
  User 
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import Avatar from "../ui/Avatar";
import ProgressBar from "../ui/ProgressBar";
import Skeleton from "../ui/Skeleton";
import { formatScore, getTierRange } from "../../utils/formatters";
import { AppContext } from "../../context/AppContext";

export default function Sidebar() {
  const { profile, loading } = useAuth();
  const { detectedCity } = useContext(AppContext);

  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/issues", label: "Issues", icon: AlertTriangle },
    { to: "/aqi", label: "AQI + Weather", icon: Wind },
    { to: "/safety", label: "Safety Network", icon: Shield },
    { to: "/hub", label: "Expertise Hub", icon: Lightbulb },
    { to: "/marketplace", label: "Marketplace", icon: Package },
    { type: "divider" },
    { to: "/impact", label: "Impact Dashboard", icon: BarChart3 },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { type: "divider" },
    { to: "/profile", label: "My Profile", icon: User }
  ];

  // Calculate progress within current tier
  const score = profile?.trustScore || 0;
  const tier = profile?.tier || "Bronze";
  const { min, max } = getTierRange(tier);
  const tierProgress = score - min;
  const tierTotal = max - min;

  return (
    <aside className="w-[240px] fixed top-0 left-0 bottom-0 glass-elevated rounded-none border-r border-white/20 flex flex-col justify-between p-4 z-40 bg-white/45">
      {/* Top Section - Brand */}
      <div>
        <div className="flex items-center gap-3 px-2 py-4 mb-4 select-none">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-display font-bold text-lg shadow-md shadow-indigo-600/20">
            SC
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-primary leading-tight">SamajConnect</h1>
            <span className="text-[11px] font-semibold text-muted tracking-wider uppercase">{detectedCity || "Latur"}, MH</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item, idx) => {
            if (item.type === "divider") {
              return <div key={`div-${idx}`} className="h-px bg-white/30 my-2.5 mx-2" />;
            }
            
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
                  ${isActive 
                    ? "bg-indigo-600/15 border-l-4 border-indigo-600 text-indigo-800 shadow-sm" 
                    : "text-muted hover:bg-white/40 hover:text-primary"
                  }
                `}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - User Widget */}
      <div className="glass p-3.5 bg-white/60 border border-white/40 rounded-2xl flex flex-col gap-2 shadow-sm">
        {loading ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton width="32px" height="32px" rounded="full" />
              <div className="space-y-1">
                <Skeleton width="80px" height="12px" />
                <Skeleton width="40px" height="8px" />
              </div>
            </div>
            <Skeleton width="100%" height="6px" />
          </div>
        ) : profile ? (
          <>
            <div className="flex items-center gap-2.5">
              <Avatar src={profile.photoURL} name={profile.name} tier={profile.tier} size="sm" />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-primary truncate leading-tight">{profile.name}</h4>
                <span className="text-[10px] font-semibold uppercase text-muted tracking-wider leading-none">
                  {profile.tier} Tier
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold font-data text-indigo-700 block">{formatScore(score)}</span>
              </div>
            </div>
            
            {/* Progress to next tier */}
            {max && (
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-muted">
                  <span>{score} pts</span>
                  <span>{max} pts</span>
                </div>
                <ProgressBar 
                  value={tierProgress} 
                  max={tierTotal} 
                  color="bg-indigo-600" 
                  height="4px" 
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-2">
            <NavLink to="/login" className="text-xs font-bold text-indigo-600 hover:underline">
              Sign In to Account
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
}
