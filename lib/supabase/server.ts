import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { getCookieDomain } from "@/lib/cookie-domain";
import type { Database } from "@/types/supabase";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const cookieDomain = getCookieDomain();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        cookieStore.set({ name, value, ...(options as object), domain: cookieDomain });
      },
      remove(name: string, options: Record<string, unknown>) {
        cookieStore.set({ name, value: "", ...(options as object), domain: cookieDomain, maxAge: 0 });
      },
    },
  });
}

