import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { getCookieDomain } from "@/lib/cookie-domain";
import type { Database } from "@/types/supabase";

type AppSubdomain =
  | "developer"
  | "management"
  | "finance"
  | "hr"
  | "produksi"
  | "logistik"
  | "creative"
  | "office";

const SUBDOMAINS: AppSubdomain[] = [
  "creative",
  "developer",
  "finance",
  "hr",
  "logistik",
  "management",
  "produksi",
  "office",
];

const ROLE_TO_SUBDOMAIN: Record<string, AppSubdomain> = {
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

function slugifyRole(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function mapRoleToSubdomain(role: string | null | undefined): AppSubdomain | null {
  const normalized = slugifyRole(role);
  return ROLE_TO_SUBDOMAIN[normalized] ?? null;
}

function extractSubdomain(hostWithPort: string): string | null {
  const host = hostWithPort.split(":")[0]?.toLowerCase() ?? "";
  if (!host || host === "localhost" || host === "lvh.me") return null;

  if (host.endsWith(".localhost") || host.endsWith(".lvh.me")) {
    const parts = host.split(".");
    return parts.length >= 2 ? parts[0] : null;
  }

  const parts = host.split(".");
  return parts.length > 2 ? parts[0] : null;
}

function shouldBypass(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/logo") ||
    pathname.startsWith("/assets") ||
    pathname.includes(".")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  const subdomain = extractSubdomain(request.headers.get("host") ?? request.nextUrl.host);
  const isKnownSubdomain = !!subdomain && SUBDOMAINS.includes(subdomain as AppSubdomain);

  const response = NextResponse.next();
  const cookieDomain = getCookieDomain();

  const supabase = createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        response.cookies.set({ name, value, ...(options as object), domain: cookieDomain, sameSite: "lax" as const });
      },
      remove(name: string, options: Record<string, unknown>) {
        response.cookies.set({ name, value: "", ...(options as object), domain: cookieDomain, sameSite: "lax" as const, maxAge: 0 });
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  const isAuthRoute = pathname.startsWith("/auth");
  const isUnauthorizedRoute = pathname.startsWith("/unauthorized");

  if (isKnownSubdomain && !user && !isAuthRoute) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const loginUrl = new URL("/auth/login", baseUrl);
    loginUrl.searchParams.set("message", "Silakan login terlebih dahulu.");
    return NextResponse.redirect(loginUrl.toString());
  }

  if (user && isKnownSubdomain && !isAuthRoute && !isUnauthorizedRoute) {
    const roleCandidate =
      (typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null) ??
      (typeof user.app_metadata?.role === "string" ? user.app_metadata.role : null) ??
      request.cookies.get("role")?.value ??
      null;

    const allowedSubdomain = mapRoleToSubdomain(roleCandidate);

    if (!allowedSubdomain || allowedSubdomain !== subdomain) {
      const unauthorizedUrl = request.nextUrl.clone();
      unauthorizedUrl.pathname = "/unauthorized";
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  if (isKnownSubdomain && !isAuthRoute && !isUnauthorizedRoute) {
    if (!pathname.startsWith(`/${subdomain}`)) {
      return NextResponse.rewrite(new URL(`/${subdomain}${pathname}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|logo.svg|style.css).*)"],
};
