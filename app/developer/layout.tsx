"use client";

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';

const navItems = [
  { label: 'Dashboard', href: '/developer', icon: 'LayoutDashboard' },
  {
    label: 'Master Data',
    href: '/developer/master-data',
    icon: 'Database',
    children: [
      { label: 'Vendor', href: '/developer/master-data/vendor', icon: 'Truck' },
      { label: 'Produk Induk', href: '/developer/master-data/produk', icon: 'Package' },
      { label: 'Varian Produk', href: '/developer/master-data/varian', icon: 'Tags' },
    ],
  },
  { label: 'User', href: '/developer/users', icon: 'User' },
];

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background-light font-display">
      {/* Kiri: Sidebar */}
      <Sidebar
        title="Developer"
        subtitle="Developer Dashboard Page"
        logoIcon="Code2"
        navItems={navItems}
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
          title="Developer Dashboard"
          user={{ name: 'Soebardjo Djojokoesoemo', role: 'Developer' }}
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