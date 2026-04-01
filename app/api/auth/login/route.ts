import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { getCookieDomain } from "@/lib/cookie-domain";
import type { Database } from "@/types/supabase";

// --------------- helpers ---------------

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://lvh.me:3000",
  "http://developer.lvh.me:3000",
  "http://management.lvh.me:3000",
  "http://finance.lvh.me:3000",
  "http://hr.lvh.me:3000",
  "http://produksi.lvh.me:3000",
  "http://logistik.lvh.me:3000",
  "http://creative.lvh.me:3000",
  "http://office.lvh.me:3000",
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : "http://localhost:3000";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

function slugifyRole(role: string) {
  return role
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapRoleToSubdomain(role: string | null | undefined): string {
  const normalized = slugifyRole(role ?? "");
  const roleMap: Record<string, string> = {
    developer: "developer",
    ceo: "management",
    management: "management",
    finance: "finance",
    hr: "hr",
    "human-resource": "hr",
    produksi: "produksi",
    production: "produksi",
    logistik: "logistik",
    logistics: "logistik",
    creative: "creative",
    sales: "creative",
    office: "office",
  };
  return roleMap[normalized] ?? "management";
}

function buildTenantRedirectUrl(subdomain: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    const base = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
    const baseUrl = new URL(base);
    const hostname = baseUrl.hostname.replace(/^www\./, "");
    return `${baseUrl.protocol}//${subdomain}.${hostname}${baseUrl.port ? `:${baseUrl.port}` : ""}`;
  }
  return `http://${subdomain}.localhost:3000`;
}

// --------------- CORS preflight ---------------

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(origin),
  });
}

// --------------- POST handler ---------------

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan password wajib diisi." },
      { status: 400, headers: corsHeaders }
    );
  }

  const cookieDomain = getCookieDomain();
  
  // Use a cookies map to collect ALL chunks Supabase sets
  const cookieMap = new Map<string, { 
    value: string; 
    options: Record<string, unknown> 
  }>();

  const supabase = createServerClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          // Collect ALL cookies Supabase wants to set
          // (including chunks: .0, .1, .2, etc.)
          cookieMap.set(name, { value, options });
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieMap.set(name, { value: "", options: { 
            ...options, maxAge: 0 
          }});
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401, headers: corsHeaders }
    );
  }

  let role =
    (typeof data.user?.user_metadata?.role === "string"
      ? data.user.user_metadata.role : null) ??
    (typeof data.user?.app_metadata?.role === "string"
      ? data.user.app_metadata.role : null);

  let profile = null;
  if (!role && data.user?.id) {
    const res = await supabase
      .schema("core")
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    profile = res.data;
    role = typeof profile?.role === "string" ? profile.role : null;
  }

  const subdomain = mapRoleToSubdomain(role);
  const redirectUrl = buildTenantRedirectUrl(subdomain);

  console.log("[ROUTE] user_metadata:", data.user?.user_metadata);
  console.log("[ROUTE] app_metadata:", data.user?.app_metadata);
  console.log("[ROUTE] profile from DB:", profile);
  console.log("[ROUTE] final role:", role);
  console.log("[ROUTE] redirecting to:", subdomain);

  // Build final response with ALL cookie chunks
  const finalResponse = NextResponse.json(
    { redirectUrl },
    { headers: corsHeaders }
  );

  // Apply ALL cookies Supabase collected (chunks included)
  for (const [name, { value, options }] of cookieMap.entries()) {
    finalResponse.cookies.set({
      name,
      value,
      ...(options as object),
      domain: cookieDomain,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }

  // Debug: log all cookies being set
  console.log("[ROUTE] setting cookies:", 
    Array.from(cookieMap.keys()));

  return finalResponse;
}
