import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

type AppRole =
  | "developer"
  | "management"
  | "finance"
  | "hr"
  | "produksi"
  | "logistik"
  | "creative"
  | "office";

type ProtectedRoute = {
  prefix: string;
  allowed: AppRole[];
};

const LOGIN_PATH = "/auth/login";
const DEV_ROOT_HOST = "lvh.me";

const VALID_SUBDOMAINS: AppRole[] = [
  "creative",
  "developer",
  "finance",
  "hr",
  "logistik",
  "management",
  "produksi",
  "office",
];

const ACCESS_CONTROL_LIST: ProtectedRoute[] = [
  { prefix: "/finance", allowed: ["finance", "management"] },
  { prefix: "/logistik", allowed: ["logistik", "management"] },
  { prefix: "/hr", allowed: ["hr", "management"] },
  { prefix: "/management", allowed: ["management"] },
  { prefix: "/produksi", allowed: ["produksi", "management"] },
  { prefix: "/creative", allowed: ["creative", "management"] },
  { prefix: "/office", allowed: ["office", "management"] },
  { prefix: "/developer", allowed: ["developer"] },
];

const ROLE_DASHBOARD: Record<AppRole, string> = {
  developer: "/developer",
  management: "/management",
  finance: "/finance",
  hr: "/hr",
  produksi: "/produksi",
  logistik: "/logistik",
  creative: "/creative",
  office: "/office",
};

function normalizeRole(input: string | null | undefined): AppRole | null {
  if (!input) return null;
  const value = input.trim().toLowerCase();

  if (value === "developer") return "developer";
  if (value === "ceo" || value === "management") return "management";
  if (value === "finance") return "finance";
  if (value === "hr" || value === "human resource") return "hr";
  if (value === "produksi" || value === "production") return "produksi";
  if (value === "logistik" || value === "logistics") return "logistik";
  if (value === "creative" || value === "sales") return "creative";
  if (value === "office") return "office";

  return null;
}
import { createServerClient } from "@supabase/ssr";

async function readRoleFromSupabaseSession(request: NextRequest, response: NextResponse): Promise<AppRole | null> {
  const cookieDomain = DEV_ROOT_HOST;

  const supabase = createServerClient(
    env.supabaseUrl, 
    env.supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          const raw = request.cookies.get(name)?.value;
          if (!raw) return undefined;
          
          // Handle base64- prefix set by browser client
          if (raw.startsWith("base64-")) {
            try {
              return atob(raw.slice(7));
            } catch {
              return raw;
            }
          }
          return raw;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ 
            name, value, 
            ...(options as object), 
            domain: `.${cookieDomain}` 
          });
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ 
            name, value: "", 
            ...(options as object), 
            domain: `.${cookieDomain}`, 
            maxAge: 0 
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  let role =
    normalizeRole(typeof session.user.user_metadata?.role === "string" ? session.user.user_metadata.role : null) ??
    normalizeRole(typeof session.user.app_metadata?.role === "string" ? session.user.app_metadata.role : null);

  if (!role && session.user.id) {
    const { data: profile } = await supabase
      .schema("core")
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    role = normalizeRole(typeof profile?.role === "string" ? profile.role : null);
  }

  return role;
}

function readRoleFromSimpleCookies(request: NextRequest): AppRole | null {
  const roleCookieKeys = ["role", "user_role", "profile_role", "division_role", "access_role"];

  for (const key of roleCookieKeys) {
    const role = normalizeRole(request.cookies.get(key)?.value);
    if (role) return role;
  }

  return null;
}

async function resolveCurrentRole(request: NextRequest, response: NextResponse): Promise<AppRole | null> {
  return readRoleFromSimpleCookies(request) ?? (await readRoleFromSupabaseSession(request, response));
}

function findRouteRule(pathname: string): ProtectedRoute | null {
  return (
    ACCESS_CONTROL_LIST.find(
      (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
    ) ?? null
  );
}

function resolveRewrittenPath(pathname: string, hostHeader: string): string {
  const subdomain = hostHeader.split(".")[0]?.toLowerCase();
  if (!subdomain || !VALID_SUBDOMAINS.includes(subdomain as AppRole)) {
    return pathname;
  }

  if (pathname === `/${subdomain}` || pathname.startsWith(`/${subdomain}/`)) {
    return pathname;
  }

  return `/${subdomain}${pathname}`;
}

function isLocalhostSubdomain(hostHeader: string) {
  const hostWithoutPort = hostHeader.split(":")[0]?.toLowerCase() ?? "";
  if (hostWithoutPort.endsWith(".localhost")) {
    return hostWithoutPort !== "localhost";
  }
  if (hostWithoutPort.endsWith(`.${DEV_ROOT_HOST}`)) {
    return hostWithoutPort !== DEV_ROOT_HOST;
  }
  return false;
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostHeader = request.headers.get("host") ?? "";
  let response = NextResponse.next();

  if (url.pathname.includes(".")) {
    return response;
  }

  if (url.pathname.startsWith("/auth")) {
    if (isLocalhostSubdomain(hostHeader)) {
      const authUrl = request.nextUrl.clone();
      authUrl.hostname = DEV_ROOT_HOST;
      return NextResponse.redirect(authUrl);
    }
    return response;
  }

  const effectivePathname = resolveRewrittenPath(url.pathname, hostHeader);
  const routeRule = findRouteRule(effectivePathname);

  if (routeRule) {
    const role = await resolveCurrentRole(request, response);

    const allCookies = request.cookies.getAll();
    console.log("[PROXY] host:", request.headers.get("host"));
    console.log("[PROXY] cookies received:", allCookies.map((c) => c.name));
    console.log("[PROXY] session exists:", !!role);

    const authCookie = allCookies.find(c => c.name.includes('auth-token'));
    console.log("[PROXY] auth cookie value prefix:", authCookie?.value?.substring(0, 50));
    console.log("[PROXY] auth cookie starts with base64-:", authCookie?.value?.startsWith('base64-'));

    console.log("[PROXY] supabase url:", env.supabaseUrl);

    const tokenCookie = request.cookies.get('sb-mhfdzprxauqfczmtyizg-auth-token');
    if (tokenCookie) {
      const rawValue = tokenCookie.value;
      const actualValue = rawValue.startsWith('base64-') 
        ? atob(rawValue.slice(7))
        : rawValue;
      try {
        const parsed = JSON.parse(actualValue);
        console.log("[PROXY] manual parse - has access_token:", !!parsed.access_token);
        if (parsed.expires_at) console.log("[PROXY] manual parse - expires_at:", parsed.expires_at);
      } catch(e) {
        console.log("[PROXY] manual parse failed:", e);
      }
    }

    if (!role) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.hostname = DEV_ROOT_HOST;
      loginUrl.pathname = LOGIN_PATH;
      loginUrl.searchParams.set("next", effectivePathname);
      const redirect = NextResponse.redirect(loginUrl);
      // copy cookies
      response.cookies.getAll().forEach(c => redirect.cookies.set(c.name, c.value));
      return redirect;
    }

    if (!routeRule.allowed.includes(role)) {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = ROLE_DASHBOARD[role] ?? LOGIN_PATH;
      deniedUrl.searchParams.set("denied", "1");
      const redirect = NextResponse.redirect(deniedUrl);
      response.cookies.getAll().forEach(c => redirect.cookies.set(c.name, c.value));
      return redirect;
    }
  }

  if (effectivePathname !== url.pathname) {
    const rewrite = NextResponse.rewrite(new URL(effectivePathname, request.url));
    response.cookies.getAll().forEach(c => rewrite.cookies.set(c.name, c.value));
    return rewrite;
  }

  return response;
}

export const middleware = proxy;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|logo.svg|style.css).*)"],
};
