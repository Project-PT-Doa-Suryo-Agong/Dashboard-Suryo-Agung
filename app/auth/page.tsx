"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";

export default function LoginPage() {
  const { signIn, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Mapping dari role profile ke subdomain
  const roleToSubdomain: Record<string, string> = {
    Developer: "developer",
    CEO: "management",
    Finance: "finance",
    HR: "hr",
    Produksi: "produksi",
    Logistik: "logistik",
    Creative: "creative",
    Office: "office",
  };

  // Redirect jika sudah login
  useEffect(() => {
    if (user && !authLoading) {
      const role = user.profile?.role ?? "creative";
      const subdomain = roleToSubdomain[role] ?? "creative";
      setSuccess(true);

      // Delay redirect untuk menampilkan pesan sukses
      const timer = setTimeout(() => {
        window.location.href = `http://${subdomain}.localhost:3000`;
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: authError } = await signIn(email, password);

      if (authError) {
        // Translate error messages ke Bahasa Indonesia
        const errorMessages: Record<string, string> = {
          "Invalid login credentials": "Email atau password salah.",
          "Email not confirmed": "Email belum dikonfirmasi. Cek inbox Anda.",
          "Too many requests": "Terlalu banyak percobaan. Coba lagi nanti.",
        };

        setError(
          errorMessages[authError.message] ??
            `Login gagal: ${authError.message}`
        );
        setIsSubmitting(false);
        return;
      }

      // Success! onAuthStateChange di AuthProvider akan handle sisanya
      setSuccess(true);
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
      setIsSubmitting(false);
    }
  };

  // Loading state saat AuthProvider resolving
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#999999]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#BC934B]" />
          <p className="text-sm text-white/80">Memuat sesi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-[#999999] font-display flex min-h-screen flex-col items-center justify-center p-3 transition-colors duration-300 md:p-4 lg:p-6">
      {/* Main Login Card Container */}
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#333333]">
        {/* Header Image/Logo Section */}
        <div className="flex flex-col items-center px-4 pb-3 pt-6 md:px-6 md:pt-8 lg:px-8">
          <div className="mb-4 flex items-center justify-center md:mb-6">
            <Image
              src="/logo.png"
              alt="Suryo Agong Logo"
              width={160}
              height={48}
              className="h-10 w-auto md:h-12 lg:h-14"
            />
          </div>
          <h1 className="text-center text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-2xl lg:text-3xl">
            Sign In
          </h1>
          <p className="mt-2 px-2 text-center text-xs font-normal text-slate-500 dark:text-[#999999] md:px-4 md:text-sm lg:text-base">
            Masuk ke dashboard divisi Anda.
          </p>
        </div>

        {/* Login Form */}
        <div className="mt-3 px-4 pb-6 md:mt-4 md:px-6 md:pb-8 lg:px-8 lg:pb-10">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 md:text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300 md:text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Login berhasil! Mengalihkan ke dashboard...</span>
              </div>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 md:text-base"
              >
                <Mail className="h-4 w-4 shrink-0 text-[#BC934B] md:h-5 md:w-5" />
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting || success}
                placeholder="nama@perusahaan.com"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#666666] dark:text-slate-100 dark:placeholder:text-slate-500 md:px-4 md:text-sm lg:text-base"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 md:text-base"
              >
                <Lock className="h-4 w-4 shrink-0 text-[#BC934B] md:h-5 md:w-5" />
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting || success}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 pr-10 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#666666] dark:text-slate-100 dark:placeholder:text-slate-500 md:px-4 md:pr-12 md:text-sm lg:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-2 flex items-center text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 md:right-3"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#BC934B] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#BC934B]/20 transition-all hover:bg-[#BC934B]/90 disabled:cursor-not-allowed disabled:opacity-60 md:py-3.5 md:text-sm lg:text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin md:h-5 md:w-5" />
                  <span>Signing In...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-center dark:border-slate-800 dark:bg-slate-800/50 md:px-6 md:py-4 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 md:text-xs lg:text-sm">
            Suryo Agong Enterprise Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}