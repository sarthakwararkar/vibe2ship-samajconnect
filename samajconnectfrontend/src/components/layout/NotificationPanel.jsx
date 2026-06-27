import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { X, Check } from "lucide-react";
import { timeAgo } from "../../utils/formatters";
import GlassCard from "../ui/GlassCard";

export default function NotificationPanel() {
  const { 
    notifications, 
    notificationDrawerOpen, 
    setNotificationDrawerOpen, 
    markAllNotificationsRead,
    loadingNotifications 
  } = useContext(AppContext);

  if (!notificationDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-indigo-950/20 backdrop-blur-sm"
        onClick={() => setNotificationDrawerOpen(false)}
      />
      
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm glass-elevated rounded-none border-l border-white/20 p-6 flex flex-col bg-white/95 shadow-xl transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/30">
            <h2 className="text-lg font-bold font-display text-primary">Notifications</h2>
            <div className="flex items-center gap-2">
              {notifications.some(n => !n.read) && (
                <button 
                  onClick={markAllNotificationsRead}
                  title="Mark all as read"
                  className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors cursor-pointer"
                >
                  <Check size={18} />
                </button>
              )}
              <button 
                onClick={() => setNotificationDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-indigo-50 text-muted transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
            {loadingNotifications ? (
              <div className="text-center py-8 text-muted text-xs">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted text-xs">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <GlassCard 
                  key={n.id} 
                  className={`p-3.5 border text-xs flex flex-col gap-1 transition-all ${
                    n.read ? "bg-white/40 border-white/25" : "bg-indigo-50/60 border-indigo-200 shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-primary">{n.title}</span>
                    <span className="text-[9px] font-data text-muted whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-muted leading-relaxed mt-0.5">{n.body}</p>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
