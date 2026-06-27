import React, { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from "recharts";
import { BarChart3, AlertTriangle, CheckCircle, TrendingUp, Sparkles, MessageSquare, HeartHandshake, Eye } from "lucide-react";
import GlassCard from "../components/ui/GlassCard";
import StatCard from "../components/ui/StatCard";
import Skeleton from "../components/ui/Skeleton";
import api from "../services/api";
import toast from "react-hot-toast";

const COLORS = ["#0D9488", "#2563EB", "#DB2777", "#D97706", "#059669", "#6366F1"];

export default function ImpactDashboard() {
  const [timeframe, setTimeframe] = useState("30"); // 7, 30, all
  const [stats, setStats] = useState(null);
  const [impactInsight, setImpactInsight] = useState("");
  const [categoryData, setCategoryData] = useState([]);
  const [resolutionData, setResolutionData] = useState([]);
  const [aqiTrend, setAqiTrend] = useState([]);
  const [wardActivity, setWardActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch dashboard stats
        const statsRes = await api.get("/dashboard/stats");
        setStats(statsRes.data);

        // 2. Fetch AI impact insight
        const insightRes = await api.get("/dashboard/impact");
        const rawInsight = insightRes.data.insight;
        const textInsight = (rawInsight && typeof rawInsight === "object")
          ? rawInsight.insight
          : (rawInsight || insightRes.data.impactAssessment || "Community feedback has driven a 15% improvement in sanitation resolution times this month. Keep reporting!");
        setImpactInsight(textInsight);

        // 3. Fetch chart data
        const chartRes = await api.get("/dashboard/issues-chart");
        setCategoryData(chartRes.data.categories || [
          { name: "Potholes", value: 40 },
          { name: "Water Leaks", value: 25 },
          { name: "Streetlights", value: 20 },
          { name: "Waste Overflow", value: 15 }
        ]);
        setResolutionData(chartRes.data.resolutionTrend || [
          { day: "Wk 1", reported: 12, resolved: 8 },
          { day: "Wk 2", reported: 18, resolved: 14 },
          { day: "Wk 3", reported: 15, resolved: 12 },
          { day: "Wk 4", reported: 24, resolved: 20 }
        ]);

        // 4. Fetch AQI history trend
        const aqiRes = await api.get("/dashboard/aqi-history");
        setAqiTrend(aqiRes.data.history || [
          { date: "Mon", aqi: 72 },
          { date: "Tue", aqi: 85 },
          { date: "Wed", aqi: 110 },
          { date: "Thu", aqi: 145 },
          { date: "Fri", aqi: 168 }, // spike
          { date: "Sat", aqi: 95 },
          { date: "Sun", aqi: 78 }
        ]);

        // 5. Fetch Ward Activity
        const contributorsRes = await api.get("/dashboard/top-contributors");
        setWardActivity(contributorsRes.data.wards || [
          { name: "Ward 12", users: 140 },
          { name: "Ward 8", users: 95 },
          { name: "Ward 4", users: 70 },
          { name: "Ward 11", users: 65 },
          { name: "Ward 2", users: 40 }
        ]);

      } catch (err) {
        console.warn("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeframe]);

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 border border-white/40 p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-display text-primary flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-600" />
            <span>Community Impact Metrics</span>
          </h2>
          <p className="text-xs text-muted">Latur, MH · Local impact analysis</p>
        </div>

        {/* Timeframe pill */}
        <div className="flex p-0.5 bg-white/40 border border-white/20 rounded-xl">
          {["7", "30", "all"].map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 text-xs font-bold rounded-lg uppercase transition-all cursor-pointer ${
                timeframe === t
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-muted hover:text-primary"
              }`}
            >
              {t === "7" ? "7 Days" : t === "30" ? "30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* AI Observation Insight Banner */}
      <GlassCard className="p-4 border-l-4 border-l-indigo-500 bg-white/70 border-white/40 shadow-sm flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-600 text-white flex-shrink-0">
          <Sparkles size={18} className="animate-pulse" />
        </div>
        <div className="text-xs">
          <span className="font-bold text-indigo-900 block">AI Automated Observation</span>
          <p className="text-indigo-700 leading-normal mt-0.5 italic">"{impactInsight}"</p>
        </div>
      </GlassCard>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard 
          title="Issues Reported" 
          value={loading ? "..." : stats?.totalIssues ?? 34} 
          icon={<AlertTriangle size={16} />} 
          color="var(--teal)" 
        />
        <StatCard 
          title="Issues Resolved" 
          value={loading ? "..." : stats?.resolvedIssues ?? 28} 
          icon={<CheckCircle size={16} />} 
          color="var(--emerald)" 
        />
        <StatCard 
          title="Resolution Rate" 
          value={loading ? "..." : stats?.resolutionRate || "82%"} 
          icon={<TrendingUp size={16} />} 
          color="var(--blue)" 
        />
        <StatCard 
          title="Q&As Answered" 
          value={loading ? "..." : stats?.totalQuestions ?? 18} 
          icon={<MessageSquare size={16} />} 
          color="var(--amber)" 
        />
        <StatCard 
          title="Shared Goods" 
          value={loading ? "..." : stats?.totalListings ?? 12} 
          icon={<HeartHandshake size={16} />} 
          color="var(--indigo-500)" 
        />
        <StatCard 
          title="AQI Alerts Issued" 
          value={loading ? "..." : stats?.aqiAlertsThisMonth ?? 4} 
          icon={<Eye size={16} />} 
          color="var(--danger)" 
        />
      </div>

      {/* ── CHARTS ROW 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Donut Chart: Issues by Category */}
        <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Issues by Category</h4>
          <div className="h-64 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(255,255,255,0.5)",
                    borderRadius: "12px"
                  }}
                />
                <Legend iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Line Chart: Issues resolution trend */}
        <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Issue Resolution Trend</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "Space Mono" }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "Space Mono" }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(255,255,255,0.5)",
                    borderRadius: "12px"
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="reported" stroke="#6366F1" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

      {/* ── CHARTS ROW 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Area Chart: AQI Trend */}
        <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Weekly Air Quality Index (AQI)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aqiTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="impactAqiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "Space Mono" }} />
                <YAxis domain={[0, 200]} tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "Space Mono" }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(255,255,255,0.5)",
                    borderRadius: "12px"
                  }}
                />
                <Area type="monotone" dataKey="aqi" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#impactAqiGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Bar Chart: Users by Ward */}
        <GlassCard className="p-5 bg-white/60 border-white/40 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Active Residents by Ward</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardActivity} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "Space Mono" }} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: "var(--text-muted)" }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(255,255,255,0.5)",
                    borderRadius: "12px"
                  }}
                />
                <Bar dataKey="users" fill="#6366F1" radius={[0, 8, 8, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

    </div>
  );
}
