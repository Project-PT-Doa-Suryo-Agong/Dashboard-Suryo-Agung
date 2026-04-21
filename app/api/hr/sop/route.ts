import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listSOP, createSOP } from "@/lib/services/hr.service";
import { requireString } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);

  const { data, error, meta } = await listSOP(auth.ctx.supabase, page, limit);

  console.log("[HR ROUTE][sop][GET] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][sop][GET] role:", auth.ctx.role);
  console.log("[HR ROUTE][sop][GET] query result:", {
    count: data.length,
    hasError: Boolean(error),
    error: error?.message,
  });

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data SOP.", 500, error.message);
  return ok({ sop: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  const judul = requireString(input, "judul");
  if (!judul.ok || !judul.data) return fail(ErrorCode.VALIDATION_ERROR, judul.ok ? "judul wajib diisi." : judul.message, 400);
  const divisi = requireString(input, "divisi");
  if (!divisi.ok || !divisi.data) return fail(ErrorCode.VALIDATION_ERROR, divisi.ok ? "divisi wajib diisi." : divisi.message, 400);
  const konten = requireString(input, "konten", { optional: true });
  if (!konten.ok) return fail(ErrorCode.VALIDATION_ERROR, konten.message, 400);

  const payload: Record<string, unknown> = {
    judul: judul.data,
    divisi: divisi.ok ? divisi.data : null,
    konten: konten.ok ? konten.data : null,
  };

  const { data, error } = await createSOP(auth.ctx.supabase, payload);

  console.log("[HR ROUTE][sop][POST] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][sop][POST] role:", auth.ctx.role);
  console.log("[HR ROUTE][sop][POST] query result:", {
    id: data?.id ?? null,
    hasError: Boolean(error),
    error: error?.message,
  });

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat SOP.", 500, error.message);
  return ok({ sop: data }, "SOP berhasil dibuat.", 201);
}
