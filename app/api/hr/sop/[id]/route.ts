import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateSOP, deleteSOP } from "@/lib/services/hr.service";
import { requireString } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID wajib diisi.", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  if (Object.keys(input).length === 0) {
    return fail(ErrorCode.VALIDATION_ERROR, "Tidak ada field yang diupdate.", 400);
  }

  const payload: Record<string, unknown> = {};

  if ("judul" in input) {
    const judul = requireString(input, "judul");
    if (!judul.ok || !judul.data) return fail(ErrorCode.VALIDATION_ERROR, judul.ok ? "judul wajib diisi." : judul.message, 400);
    payload.judul = judul.data;
  }

  if ("divisi" in input) {
    const divisi = requireString(input, "divisi", { optional: true });
    if (!divisi.ok) return fail(ErrorCode.VALIDATION_ERROR, divisi.message, 400);
    payload.divisi = divisi.data;
  }

  if ("konten" in input) {
    const konten = requireString(input, "konten", { optional: true });
    if (!konten.ok) return fail(ErrorCode.VALIDATION_ERROR, konten.message, 400);
    payload.konten = konten.data;
  }

  const { data, error } = await updateSOP(auth.ctx.supabase, id, payload);

  console.log("[HR ROUTE][sop][PATCH] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][sop][PATCH] role:", auth.ctx.role);
  console.log("[HR ROUTE][sop][PATCH] query result:", {
    id: data?.id ?? null,
    hasError: Boolean(error),
    error: error?.message,
  });

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update SOP.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data SOP tidak ditemukan.", 404);
  return ok({ sop: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID wajib diisi.", 400);

  const { error, deleted } = await deleteSOP(auth.ctx.supabase, id);

  console.log("[HR ROUTE][sop][DELETE] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][sop][DELETE] role:", auth.ctx.role);
  console.log("[HR ROUTE][sop][DELETE] query result:", {
    deleted,
    hasError: Boolean(error),
    error: error?.message,
  });

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus SOP.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data SOP tidak ditemukan.", 404);
  return ok(null, "Data SOP berhasil dihapus.");
}
