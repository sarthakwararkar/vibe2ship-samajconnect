import React from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import NotificationPanel from "./NotificationPanel";

export default function PageLayout({ children }) {
  return (
    <div className="min-h-screen flex text-primary">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Page Area */}
      <div className="flex-1 pl-[240px]">
        {/* Fixed Topbar */}
        <TopBar />

        {/* Scrollable Page Body */}
        <main className="pt-[60px] p-8 min-h-screen">
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
