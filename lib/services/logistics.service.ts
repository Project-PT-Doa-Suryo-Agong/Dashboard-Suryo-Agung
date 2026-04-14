import type { TLogistikManifest, TPacking, TReturnOrder } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SchemaClient = DbClient & { schema: (schema: string) => DbClient };
const db = (client: DbClient) => (client as unknown as SchemaClient).schema("logistics");

type SalesOrderLite = {
  id: string;
  varian_id: string | null;
  affiliator_id: string | null;
  quantity: number;
  total_price: number;
  created_at: string | null;
};

type VariantLite = {
  id: string;
  product_id: string | null;
  nama_varian: string | null;
  sku: string | null;
  harga: number | null;
};

type LogisticsRowWithOrder = {
  order_id: string | null;
  [key: string]: unknown;
};

async function enrichLogisticsRows<T extends LogisticsRowWithOrder>(client: DbClient, rows: T[]) {
  const orderIds = Array.from(
    new Set(rows.map((row) => row.order_id).filter((value): value is string => typeof value === "string" && value.length > 0)),
  );

  if (orderIds.length === 0) {
    return { data: rows, error: null };
  }

  const toBaseRows = (sourceRows: T[]) =>
    sourceRows.map((row) => ({
      ...row,
      order: null,
      variant: null,
    }));

  const { data: orders, error: orderError } = await supabaseAdmin
    .schema("sales")
    .from("t_sales_order")
    .select("id, varian_id, affiliator_id, quantity, total_price, created_at")
    .in("id", orderIds);

  if (orderError) {
    // Some operational roles can access logistics data but not cross-schema sales data.
    // Do not fail the endpoint; return base logistics rows without enrichment.
    return { data: toBaseRows(rows), error: null };
  }

  const orderList = (orders ?? []) as SalesOrderLite[];
  const orderById = new Map(orderList.map((order) => [order.id, order]));

  const variantIds = Array.from(
    new Set(orderList.map((order) => order.varian_id).filter((value): value is string => typeof value === "string" && value.length > 0)),
  );

  let variantById = new Map<string, VariantLite>();
  if (variantIds.length > 0) {
    const { data: variants, error: variantError } = await supabaseAdmin
      .schema("core")
      .from("m_varian")
      .select("id, product_id, nama_varian, sku, harga")
      .in("id", variantIds);

    if (variantError) {
      return { data: toBaseRows(rows), error: null };
    }

    variantById = new Map(((variants ?? []) as VariantLite[]).map((variant) => [variant.id, variant]));
  }

  const enriched = rows.map((row) => {
    const order = row.order_id ? orderById.get(row.order_id) ?? null : null;
    const variant = order?.varian_id ? variantById.get(order.varian_id) ?? null : null;

    return {
      ...row,
      order,
      variant,
    };
  });

  return { data: enriched, error: null };
}

export async function listManifest(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_logistik_manifest")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  if (error) return { data: [], error, meta: { page, limit, total: count ?? 0 } };

  const enriched = await enrichLogisticsRows(client, ((data ?? []) as LogisticsRowWithOrder[]));
  return { data: enriched.data as any[], error: enriched.error, meta: { page, limit, total: count ?? 0 } };
}

export async function createManifest(client: DbClient, input: Record<string, unknown>) {
  const orderId = typeof input.order_id === "string" ? input.order_id : null;

  if (orderId) {
    const { data: existing, error: existingError } = await db(client)
      .from("t_logistik_manifest")
      .select("order_id")
      .eq("order_id", orderId)
      .limit(1);

    if (existingError) {
      return { data: null, error: existingError };
    }

    if ((existing ?? []).length > 0) {
      const { data, error } = await db(client)
        .from("t_logistik_manifest")
        .update(input as any)
        .eq("order_id", orderId)
        .select("*");

      return { data: ((data ?? [])[0] as TLogistikManifest | undefined) ?? null, error };
    }
  }

  const { data, error } = await db(client).from("t_logistik_manifest").insert(input as any).select("*").single();
  return { data: data as TLogistikManifest | null, error };
}

export async function updateManifest(client: DbClient, orderId: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_logistik_manifest")
    .update(input as any)
    .eq("order_id", orderId)
    .select("*")
    .maybeSingle();
  return { data: data as TLogistikManifest | null, error };
}

export async function deleteManifest(client: DbClient, orderId: string) {
  const { error, count } = await db(client).from("t_logistik_manifest").delete({ count: "exact" }).eq("order_id", orderId);
  return { error, deleted: (count ?? 0) > 0 };
}

export async function listPacking(client: DbClient, page = 1, limit = 100) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_packing")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  if (error) return { data: [], error, meta: { page, limit, total: count ?? 0 } };

  const enriched = await enrichLogisticsRows(client, ((data ?? []) as LogisticsRowWithOrder[]));
  return { data: enriched.data as any[], error: enriched.error, meta: { page, limit, total: count ?? 0 } };
}

export async function createPacking(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_packing").insert(input as any).select("*").single();
  return { data: data as TPacking | null, error };
}

export async function updatePacking(client: DbClient, orderId: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_packing")
    .update(input as any)
    .eq("order_id", orderId)
    .select("*")
    .maybeSingle();
  return { data: data as TPacking | null, error };
}

export async function deletePacking(client: DbClient, orderId: string) {
  const { error, count } = await db(client).from("t_packing").delete({ count: "exact" }).eq("order_id", orderId);
  return { error, deleted: (count ?? 0) > 0 };
}

export async function listReturnOrder(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_return_order")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  if (error) return { data: [], error, meta: { page, limit, total: count ?? 0 } };

  const enriched = await enrichLogisticsRows(client, ((data ?? []) as LogisticsRowWithOrder[]));
  return { data: enriched.data as any[], error: enriched.error, meta: { page, limit, total: count ?? 0 } };
}

export async function createReturnOrder(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_return_order").insert(input as any).select("*").single();
  return { data: data as TReturnOrder | null, error };
}

export async function updateReturnOrder(client: DbClient, orderId: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_return_order")
    .update(input as any)
    .eq("order_id", orderId)
    .select("*")
    .maybeSingle();
  return { data: data as TReturnOrder | null, error };
}

export async function deleteReturnOrder(client: DbClient, orderId: string) {
  const { error, count } = await db(client).from("t_return_order").delete({ count: "exact" }).eq("order_id", orderId);
  return { error, deleted: (count ?? 0) > 0 };
}
