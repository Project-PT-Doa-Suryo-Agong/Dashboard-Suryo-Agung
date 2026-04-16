import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createReturnOrder, listReturnOrder } from "@/lib/services/logistics.service";
import { requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TReturnOrderInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

const RETURN_BUKTI_BUCKET = "returns";

function parseDataUrl(value: string): { mimeType: string; buffer: Buffer; ext: string } | null {
  const matches = value.match(/^data:([A-Za-z0-9.+/-]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");
  const ext = mimeType.split("/")[1]?.toLowerCase() || "bin";
  return { mimeType, buffer, ext };
}

async function uploadReturnProofFromDataUrl(value: string, orderId: string): Promise<string> {
  const parsed = parseDataUrl(value);
  if (!parsed) return value;

  const fileName = `${orderId}-${Date.now()}.${parsed.ext}`;
  const { error } = await supabaseAdmin.storage
    .from(RETURN_BUKTI_BUCKET)
    .upload(fileName, parsed.buffer, {
      contentType: parsed.mimeType,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Gagal upload bukti retur ke storage: ${error.message}`);
  }

  return fileName;
}

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);

  const { data, error, meta } = await listReturnOrder(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data retur.", 500, error.message);

  const returns = data ?? [];
  const buktiPaths = Array.from(
    new Set(
      returns
        .map((item) => item.foto_bukti_url)
        .filter(
          (path): path is string =>
            typeof path === "string" && path.trim().length > 0 && !/^https?:\/\//i.test(path),
        ),
    ),
  );

  const signedUrlByPath: Record<string, string> = {};
  if (buktiPaths.length > 0) {
    const { data: signedUrls, error: signedError } = await auth.ctx.supabase.storage
      .from(RETURN_BUKTI_BUCKET)
      .createSignedUrls(buktiPaths, 60 * 60);

    if (signedError) {
      return fail(ErrorCode.DB_ERROR, "Gagal membuat signed URL bukti retur.", 500, signedError.message);
    }

    for (const item of signedUrls ?? []) {
      if (item.path && item.signedUrl) {
        signedUrlByPath[item.path] = item.signedUrl;
      }
    }
  }

  const enriched = returns.map((item) => {
    const rawPath = item.foto_bukti_url;
    const fotoBuktiSignedUrl =
      typeof rawPath === "string" && rawPath.length > 0
        ? /^https?:\/\//i.test(rawPath)
          ? rawPath
          : signedUrlByPath[rawPath] ?? null
        : null;

    return {
      ...item,
      foto_bukti_signed_url: fotoBuktiSignedUrl,
    };
  });

  return ok({ returns: enriched, meta });
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
  const orderId = requireUUID(input, "order_id");
  if (!orderId.ok) return fail(ErrorCode.VALIDATION_ERROR, orderId.message, 400);
  const alasan = requireString(input, "alasan", { maxLen: 255 });
  if (!alasan.ok) return fail(ErrorCode.VALIDATION_ERROR, alasan.message, 400);
  const status = requireString(input, "status", { optional: true });
  if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
  if (status.data !== null && !["pending", "diproses", "selesai"].includes(status.data)) {
    return fail(ErrorCode.VALIDATION_ERROR, "status harus pending, diproses, atau selesai.", 400);
  }
  const fotoBuktiUrl = requireString(input, "foto_bukti_url", { optional: true });
  if (!fotoBuktiUrl.ok) return fail(ErrorCode.VALIDATION_ERROR, fotoBuktiUrl.message, 400);

  if (
    fotoBuktiUrl.data &&
    !fotoBuktiUrl.data.startsWith("data:") &&
    fotoBuktiUrl.data.length > 500
  ) {
    return fail(ErrorCode.VALIDATION_ERROR, "foto_bukti_url maksimal 500 karakter.", 400);
  }

  const payload: TReturnOrderInsert = {
    order_id: orderId.data,
    alasan: alasan.data!,
    status: status.data ?? "pending",
    foto_bukti_url: fotoBuktiUrl.data ? await uploadReturnProofFromDataUrl(fotoBuktiUrl.data, orderId.data!) : null,
  };

  const { data, error } = await createReturnOrder(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat data retur.", 500, error.message);
  return ok({ return: data }, "Data retur berhasil dibuat.", 201);
}
