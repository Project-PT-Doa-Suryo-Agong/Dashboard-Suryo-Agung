"use client";

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';

const navItems = [
  { label: 'Dashboard Overview', href: '/creative', icon: 'LayoutDashboard' },
  { label: 'Content Planner', href: '/creative/content', icon: 'CalendarDays' },
  { label: 'Live Performance', href: '/creative/live-perf', icon: 'TrendingUp' },
  { label: 'Sales Order', href: '/creative/sales-order', icon: 'Handshake' },
];

export default function CreativeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background-light font-display">
      {/* Kiri: Sidebar */}
      <Sidebar
        title="Creative & Sales"
        subtitle="Creative & Sales Dashboard Page"
        logoIcon="Palette"
        navItems={navItems}
        footerAction={{ label: 'New Campaign', icon: 'Plus' }}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Kanan: Area Utama */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-100/50 ml-0 md:ml-72">
        <Topbar
          title="Creative & Sales Dashboard"
          user={{ name: 'Alex Rivera', role: 'Creative Manager' }}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />

        {/* Area Konten Dinamis yang bisa di-scroll */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}