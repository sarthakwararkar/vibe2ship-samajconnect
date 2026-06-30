import React, { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import NotificationPanel from "./NotificationPanel";

export default function PageLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex text-primary">
      {/* Fixed/Drawer Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Page Area */}
      <div className="flex-1 pl-0 lg:pl-[240px]">
        {/* Fixed Topbar */}
        <TopBar onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Scrollable Page Body */}
        <main className="pt-[76px] pb-4 px-4 lg:pt-[92px] lg:pb-8 lg:px-8 min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Slide-out Notification Panel */}
      <NotificationPanel />
    </div>
  );
}
