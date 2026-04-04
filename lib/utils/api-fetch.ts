export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 401 && typeof window !== "undefined") {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://lvh.me:3000";
    const base = siteUrl.replace(/\/$/, "");
    const loginUrl = `${base}/auth/login?message=Sesi+telah+berakhir,+silakan+login+kembali`;

    // Avoid noisy reload loops when already on login screen.
    if (!window.location.pathname.startsWith("/auth/login")) {
      window.location.href = loginUrl;
    }
  }

  return response;
}
