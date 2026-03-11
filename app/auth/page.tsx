"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt with:", { email, password });
    // Di sini nanti tempat logika redirect berdasarkan role
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex items-center justify-center p-4 transition-colors duration-300">
      {/* Main Login Card Container */}
      <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Image/Logo Section */}
        <div className="pt-10 pb-6 px-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-primary text-4xl">hub</span>
          </div>
          <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight text-center">
            Welcome Back
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-normal text-center mt-2 px-4">
            Please enter your credentials to access your cluster
          </p>
        </div>

        {/* Login Form */}
        <div className="px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  mail
                </span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-primary hover:text-primary/80 text-xs font-semibold transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  lock
                </span>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Warning Notice (Contoh penggunaan warna amber F0AD4E) */}
            <div className="bg-accent-warning/10 border border-accent-warning/30 p-3 rounded-lg flex items-start gap-3">
              <span className="material-symbols-outlined text-accent-warning text-lg">warning</span>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Security Note: Ensure you are accessing via a secure network.
              </p>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>Sign In</span>
              <span className="material-symbols-outlined text-lg">login</span>
            </button>
          </form>

          {/* Decorative Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-700"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium tracking-widest">
                Security Note
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-sm">shield_lock</span>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium italic">
              Access is restricted based on assigned roles.
            </p>
          </div>
        </div>

        {/* Optional Bottom Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/50 py-4 px-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
            Enterprise Grade Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}