import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateAttendanceByEmployeeDate, deleteAttendanceByEmployeeDate } from "@/lib/services/hr.service";
import { requireDate, requireString, requireUUID, requireNumber } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function PATCH(request: Request, { params }: { params: Promise<{ employee_id: string; tanggal: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { employee_id, tanggal } = await params;

  // Validate path params
  const empCheck = requireUUID({ employee_id }, "employee_id");
  if (!empCheck.ok) return fail(ErrorCode.VALIDATION_ERROR, empCheck.message, 400);
  const dateCheck = requireDate({ tanggal }, "tanggal");
  if (!dateCheck.ok) return fail(ErrorCode.VALIDATION_ERROR, dateCheck.message, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  const payload: Record<string, unknown> = {};

  if ("employee_id" in input) {
    const employeeId = requireUUID(input, "employee_id");
    if (!employeeId.ok) return fail(ErrorCode.VALIDATION_ERROR, employeeId.message, 400);
    payload.employee_id = employeeId.data;
  }

  if ("tanggal" in input) {
    const t = requireDate(input, "tanggal");
    if (!t.ok) return fail(ErrorCode.VALIDATION_ERROR, t.message, 400);
    payload.tanggal = t.data;
  }

  if ("status" in input) {
    const status = requireString(input, "status");
    if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
    if (!status.data || !["hadir", "izin", "sakit", "alpha"].includes(status.data)) {
      return fail(ErrorCode.VALIDATION_ERROR, "status harus hadir, izin, sakit, atau alpha.", 400);
    }
    payload.status = status.data;
  }

  if ("jam_masuk" in input) {
    const jamMasuk = requireString(input, "jam_masuk");
    if (!jamMasuk.ok) return fail(ErrorCode.VALIDATION_ERROR, jamMasuk.message, 400);
    payload.jam_masuk = jamMasuk.data;
  }

  if ("jam_keluar" in input) {
    const jamKeluar = requireString(input, "jam_keluar");
    if (!jamKeluar.ok) return fail(ErrorCode.VALIDATION_ERROR, jamKeluar.message, 400);
    payload.jam_keluar = jamKeluar.data;
  }

  if ("jarak_meter" in input) {
    const jarakMeter = requireNumber(input, "jarak_meter");
    if (!jarakMeter.ok) return fail(ErrorCode.VALIDATION_ERROR, jarakMeter.message, 400);
    payload.jarak_meter = jarakMeter.data;
  }

  if ("is_dinas" in input) {
    const isDinas = requireString(input, "is_dinas");
    if (!isDinas.ok) return fail(ErrorCode.VALIDATION_ERROR, isDinas.message, 400);
    if (isDinas.data && !["Ya", "Tidak"].includes(isDinas.data)) return fail(ErrorCode.VALIDATION_ERROR, "is_dinas harus 'Ya' atau 'Tidak'.", 400);
    payload.is_dinas = isDinas.data;
  }

  if ("laporan_harian" in input) {
    const laporanHarian = requireString(input, "laporan_harian");
    if (!laporanHarian.ok) return fail(ErrorCode.VALIDATION_ERROR, laporanHarian.message, 400);
    payload.laporan_harian = laporanHarian.data;
  }

  const { data, error } = await updateAttendanceByEmployeeDate(auth.ctx.supabase, empCheck.data!, dateCheck.data!, payload);

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update attendance.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data attendance tidak ditemukan.", 404);
  return ok({ attendance: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ employee_id: string; tanggal: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { employee_id, tanggal } = await params;

  const empCheck = requireUUID({ employee_id }, "employee_id");
  if (!empCheck.ok) return fail(ErrorCode.VALIDATION_ERROR, empCheck.message, 400);
  const dateCheck = requireDate({ tanggal }, "tanggal");
  if (!dateCheck.ok) return fail(ErrorCode.VALIDATION_ERROR, dateCheck.message, 400);

  const { error, deleted } = await deleteAttendanceByEmployeeDate(auth.ctx.supabase, empCheck.data!, dateCheck.data!);

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus attendance.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data attendance tidak ditemukan.", 404);
  return ok(null, "Data attendance berhasil dihapus.");
}
