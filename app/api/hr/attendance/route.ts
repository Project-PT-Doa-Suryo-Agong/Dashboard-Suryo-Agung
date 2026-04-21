import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import {
  listAttendance,
  createAttendance,
  updateAttendanceByEmployeeDate,
  deleteAttendanceByEmployeeDate,
} from "@/lib/services/hr.service";
import { requireDate, requireString, requireUUID, requireNumber } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);
  const employeeId = url.searchParams.get("employee_id") ?? undefined;

  const { data, error, meta } = await listAttendance(auth.ctx.supabase, page, limit, employeeId);

  console.log("[HR ROUTE][attendance][GET] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][attendance][GET] role:", auth.ctx.role);
  console.log("[HR ROUTE][attendance][GET] query result:", {
    count: data.length,
    hasError: Boolean(error),
    error: error?.message,
  });

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data attendance.", 500, error.message);
  return ok({ attendance: data, meta });
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
  const employeeId = requireUUID(input, "employee_id");
  if (!employeeId.ok) return fail(ErrorCode.VALIDATION_ERROR, employeeId.message, 400);
  const tanggal = requireDate(input, "tanggal");
  if (!tanggal.ok) return fail(ErrorCode.VALIDATION_ERROR, tanggal.message, 400);
  const status = requireString(input, "status");
  if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
  if (!status.data || !["hadir", "izin", "sakit", "alpha"].includes(status.data)) {
    return fail(ErrorCode.VALIDATION_ERROR, "status harus hadir, izin, sakit, atau alpha.", 400);
  }

  // Optional fields
  const jamMasuk = requireString(input, "jam_masuk", { optional: true });
  if (!jamMasuk.ok) return fail(ErrorCode.VALIDATION_ERROR, jamMasuk.message, 400);
  const jamKeluar = requireString(input, "jam_keluar", { optional: true });
  if (!jamKeluar.ok) return fail(ErrorCode.VALIDATION_ERROR, jamKeluar.message, 400);
  const jarakMeter = requireNumber(input, "jarak_meter", { optional: true });
  if (!jarakMeter.ok) return fail(ErrorCode.VALIDATION_ERROR, jarakMeter.message, 400);
  const isDinas = requireString(input, "is_dinas", { optional: true });
  if (!isDinas.ok) return fail(ErrorCode.VALIDATION_ERROR, isDinas.message, 400);
  if (isDinas.data && !["Ya", "Tidak"].includes(isDinas.data)) return fail(ErrorCode.VALIDATION_ERROR, "is_dinas harus 'Ya' atau 'Tidak'.", 400);
  const laporanHarian = requireString(input, "laporan_harian", { optional: true });
  if (!laporanHarian.ok) return fail(ErrorCode.VALIDATION_ERROR, laporanHarian.message, 400);

  const payload: Record<string, unknown> = {
    employee_id: employeeId.data,
    tanggal: tanggal.data,
    status: status.data,
    jam_masuk: jamMasuk.ok ? jamMasuk.data : null,
    jam_keluar: jamKeluar.ok ? jamKeluar.data : null,
    jarak_meter: jarakMeter.ok ? jarakMeter.data : null,
    is_dinas: isDinas.ok ? isDinas.data : "Tidak",
    laporan_harian: laporanHarian.ok ? laporanHarian.data : null,
  };

  const { data, error } = await createAttendance(auth.ctx.supabase, payload);

  console.log("[HR ROUTE][attendance][POST] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][attendance][POST] role:", auth.ctx.role);
  console.log("[HR ROUTE][attendance][POST] query result:", {
    employee_id: data?.employee_id ?? null,
    tanggal: data?.tanggal ?? null,
    hasError: Boolean(error),
    error: error?.message,
  });

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menambah attendance.", 500, error.message);
  return ok({ attendance: data }, "Attendance berhasil dibuat.", 201);
}

export async function PATCH(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  const sourceEmployeeId = requireUUID(input, "source_employee_id");
  if (!sourceEmployeeId.ok) return fail(ErrorCode.VALIDATION_ERROR, sourceEmployeeId.message, 400);
  const sourceTanggal = requireDate(input, "source_tanggal");
  if (!sourceTanggal.ok) return fail(ErrorCode.VALIDATION_ERROR, sourceTanggal.message, 400);
  if (!sourceEmployeeId.data || !sourceTanggal.data) {
    return fail(ErrorCode.VALIDATION_ERROR, "source_employee_id dan source_tanggal wajib diisi.", 400);
  }

  const payload: Record<string, unknown> = {};

  if ("employee_id" in input) {
    const employeeId = requireUUID(input, "employee_id");
    if (!employeeId.ok) return fail(ErrorCode.VALIDATION_ERROR, employeeId.message, 400);
    payload.employee_id = employeeId.data;
  }

  if ("tanggal" in input) {
    const tanggal = requireDate(input, "tanggal");
    if (!tanggal.ok) return fail(ErrorCode.VALIDATION_ERROR, tanggal.message, 400);
    payload.tanggal = tanggal.data;
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

  const { data, error } = await updateAttendanceByEmployeeDate(
    auth.ctx.supabase,
    sourceEmployeeId.data,
    sourceTanggal.data,
    payload,
  );

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update attendance.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data attendance tidak ditemukan.", 404);
  return ok({ attendance: data });
}

export async function DELETE(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  const sourceEmployeeId = requireUUID(input, "source_employee_id");
  if (!sourceEmployeeId.ok) return fail(ErrorCode.VALIDATION_ERROR, sourceEmployeeId.message, 400);
  const sourceTanggal = requireDate(input, "source_tanggal");
  if (!sourceTanggal.ok) return fail(ErrorCode.VALIDATION_ERROR, sourceTanggal.message, 400);
  if (!sourceEmployeeId.data || !sourceTanggal.data) {
    return fail(ErrorCode.VALIDATION_ERROR, "source_employee_id dan source_tanggal wajib diisi.", 400);
  }

  const { error, deleted } = await deleteAttendanceByEmployeeDate(
    auth.ctx.supabase,
    sourceEmployeeId.data,
    sourceTanggal.data,
  );

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus attendance.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data attendance tidak ditemukan.", 404);
  return ok(null, "Data attendance berhasil dihapus.");
}
