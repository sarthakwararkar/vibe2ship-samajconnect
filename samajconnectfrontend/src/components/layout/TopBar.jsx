import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Bell, Search, LogOut, User, Settings, Wind, MapPin } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { AppContext } from "../../context/AppContext";
import Avatar from "../ui/Avatar";
import { getAqiColor } from "../../utils/formatters";
import toast from "react-hot-toast";

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const { aqiData, unreadCount, setNotificationDrawerOpen, detectedCity, requestUserLocation } = useContext(AppContext);

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Home Dashboard";
    if (path.startsWith("/issues/report")) return "Report Civic Issue";
    if (path.startsWith("/issues/")) return "Civic Issue Details";
    if (path.startsWith("/issues")) return "Civic Issues";
    if (path.startsWith("/aqi")) return "Air Quality & Health";
    if (path.startsWith("/safety")) return "Safety Network";
    if (path.startsWith("/hub/")) return "Community Q&A Details";
    if (path.startsWith("/hub")) return "Expertise Sharing Hub";
    if (path.startsWith("/marketplace/create")) return "List Item on Marketplace";
    if (path.startsWith("/marketplace")) return "Community Marketplace";
    if (path.startsWith("/profile")) return "User Profile";
    if (path.startsWith("/leaderboard")) return "Community Champions";
    if (path.startsWith("/impact")) return "Community Impact";
    return "SamajConnect";
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      toast.error("Failed to log out");
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setSearchFocused(false);
      if (location.pathname.startsWith("/hub")) {
        navigate(`/hub?search=${encodeURIComponent(searchQuery)}`);
      } else if (location.pathname.startsWith("/marketplace")) {
        navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
      } else {
        navigate(`/issues?search=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  const currentAqi = aqiData?.aqi || 72;
  const aqiColor = getAqiColor(currentAqi);
  const isHighAqi = currentAqi > 150;

  return (
    <header className="h-[60px] fixed top-0 right-0 left-[240px] glass-elevated rounded-none border-b border-white/20 flex items-center justify-between px-6 z-30 bg-white/55">
      {/* Title */}
      <h2 className="text-xl font-bold font-display text-primary">{getPageTitle()}</h2>

      {/* Global Search Bar */}
      <div className="relative w-[380px]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            onKeyDown={handleSearchSubmit}
            placeholder="Search issues, questions, listings..."
            className="w-full pl-9 pr-4 py-1.5 glass-input text-xs"
          />
        </div>
        
        {/* Quick search dropdown */}
        {searchFocused && (
          <div className="absolute top-full left-0 right-0 mt-1.5 glass-elevated p-2 z-50 bg-white/95">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider px-2 block mb-1">
              Quick Navigation
            </span>
            <div className="text-xs">
              <div 
                className="px-2 py-1.5 rounded-lg hover:bg-indigo-50 cursor-pointer text-primary flex items-center justify-between"
                onClick={() => { navigate("/issues"); setSearchQuery(""); }}
              >
                <span>Browse Local Issues</span>
                <span className="text-[10px] text-muted">Issues</span>
              </div>
              <div 
                className="px-2 py-1.5 rounded-lg hover:bg-indigo-50 cursor-pointer text-primary flex items-center justify-between"
                onClick={() => { navigate("/hub"); setSearchQuery(""); }}
              >
                <span>Ask a community expert</span>
                <span className="text-[10px] text-muted">Hub</span>
              </div>
              <div 
                className="px-2 py-1.5 rounded-lg hover:bg-indigo-50 cursor-pointer text-primary flex items-center justify-between"
                onClick={() => { navigate("/marketplace"); setSearchQuery(""); }}
              >
                <span>Marketplace items</span>
                <span className="text-[10px] text-muted">Store</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Geolocation/City Pill */}
        <button 
          onClick={requestUserLocation}
          className="flex items-center gap-1.5 px-3 py-1.5 glass border border-white/40 bg-white/60 text-primary rounded-xl hover:border-indigo-400 cursor-pointer select-none transition-all"
          title="Click to request or refresh location permission"
        >
          <MapPin size={15} className="text-indigo-600 animate-pulse" style={{ animationDuration: '3s' }} />
          <span className="text-xs font-bold">{detectedCity || "Latur"}</span>
        </button>

        {/* AQI Pill */}
        <Link 
          to="/aqi" 
          className={`flex items-center gap-1.5 px-3 py-1.5 glass border rounded-xl hover:border-indigo-400 cursor-pointer select-none transition-all ${
            isHighAqi ? "sos-pulse shadow-md border-red-500 bg-red-50 text-red-700" : "bg-white/60 border-white/40 text-primary"
          }`}
        >
          <Wind size={15} className={isHighAqi ? "text-red-500 animate-pulse" : "text-indigo-600"} />
          <span className="text-xs font-bold font-data">AQI {currentAqi}</span>
        </Link>

        {/* Notifications Trigger */}
        <button
          onClick={() => setNotificationDrawerOpen(true)}
          className="relative p-2 rounded-xl hover:bg-white/40 border border-white/20 text-muted hover:text-primary transition-colors cursor-pointer"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-indigo-600 border border-white rounded-full text-[9px] text-white flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Profile Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="focus:outline-none flex-shrink-0 cursor-pointer"
          >
            <Avatar 
              src={profile?.photoURL} 
              name={profile?.name} 
              tier={profile?.tier} 
              size="sm" 
            />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 glass-elevated p-1 z-50 bg-white/95 shadow-md">
              <Link
                to="/profile"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-muted hover:bg-indigo-50 hover:text-primary transition-colors"
              >
                <User size={14} />
                <span>My Profile</span>
              </Link>
              <Link
                to="/profile?settings=true"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-muted hover:bg-indigo-50 hover:text-primary transition-colors"
              >
                <Settings size={14} />
                <span>Settings</span>
              </Link>
              <div className="h-px bg-white/30 my-1 mx-2" />
              <button
                onClick={() => { setProfileDropdownOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
