"use client";

import React, { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

interface AdminDashboardShellProps {
  children: React.ReactNode;
}

export function AdminDashboardShell({ children }: AdminDashboardShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-indigo-50/25 via-[#F8FAFC] to-[#F8FAFC] text-slate-900 font-sans">
      {/* Sidebar: Desktop Sticky + Mobile Drawer */}
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Admin Utility Header */}
        <AdminHeader onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />

        {/* Page Content Viewport */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-6 sm:p-8 lg:p-10 space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
