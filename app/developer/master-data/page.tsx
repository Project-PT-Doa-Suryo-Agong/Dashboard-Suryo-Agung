"use client";
import Link from "next/link";
import React, { useState } from "react";
import {
  Tag,
  Save,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  PackageOpen,
} from "lucide-react";

export default function CreativeDashboard() {
  return (
    <div>
      <div>
        <Link
          href="/developer/master-data/vendor"
          className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors"
        >
          Vendor
        </Link>
      </div>
      <div>
        <Link
          href="/developer/master-data/Produk"
          className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors"
        >
          Produk
        </Link>
      </div>
      <div>
        <Link
          href="/developer/master-data/varian"
          className="flex p-10items-center gap-2 px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors"
        >
          Varian
        </Link>
      </div>
    </div>
  );
}
