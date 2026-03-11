import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Dapatkan hostname yang diketik user (contoh: "finance.localhost:3000" atau "produksi.perusahaan.com")
  const hostname = req.headers.get('host') || '';

  // Daftar nama folder/subdomain divisi kamu
  const validSubdomains = [
    'creative', 'developer', 'finance', 'hr', 
    'logistik', 'management', 'produksi', 'support'
  ];

  // Ekstrak kata pertama sebelum titik
  // finance.localhost:3000 -> "finance"
  const subdomain = hostname.split('.')[0];

  // Jika subdomainnya valid (ada di dalam array validSubdomains)
  if (validSubdomains.includes(subdomain)) {
    // Arahkan (rewrite) secara gaib ke folder yang sesuai
    // Contoh: finance.localhost:3000/cashflow -> di-rewrite ke /finance/cashflow
    return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, req.url));
  }

  // Jika tidak ada subdomain (misal mengakses localhost:3000 biasa), biarkan lewat
  return NextResponse.next();
}

// Konfigurasi agar middleware tidak ikut me-rewrite file statis seperti CSS, JS, dan Gambar
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}