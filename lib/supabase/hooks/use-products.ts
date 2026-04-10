"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchApi } from "@/lib/http/client";
import type { MProduk } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

type QueryMeta = {
  page: number;
  limit: number;
  total: number;
};

type QueryResult<T> = {
  data: T[];
  loading: boolean;
  error: string | null;
  meta: QueryMeta;
  refresh: () => void;
};

type MutationResult = {
  loading: boolean;
  error: string | null;
};

// ─── Products (core.m_produk) ──────────────────────────────────────────────────

/**
 * List all products with pagination & filtering.
 *
 * @example
 * const { data, loading, meta, refresh } = useProducts({ page: 1, limit: 50 });
 */
export function useProducts(options?: UseTableOptions) {
  const { page = 1, limit = 200, enabled = true } = options ?? {};

  const [data, setData] = useState<MProduk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const refreshRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetchApi<{ produk: MProduk[]; meta?: QueryMeta }>(
        `/api/core/products?page=${page}&limit=${limit}`,
      );
      setData(res.produk ?? []);
      setTotal(res.meta?.total ?? (res.produk?.length ?? 0));
    } catch (err) {
      setData([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Gagal memuat produk.");
    } finally {
      setLoading(false);
    }
  }, [enabled, page, limit]);

  useEffect(() => {
    void fetchData();
  }, [fetchData, refreshRef.current]);

  const refresh = useCallback(() => {
    refreshRef.current += 1;
    void fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    meta: { page, limit, total },
    refresh,
  } as QueryResult<MProduk>;
}

/**
 * Fetch a single product by ID.
 */
export function useProduct(id: string | null) {
  const { data, loading, error } = useProducts({ enabled: Boolean(id), limit: 200 });
  const row = useMemo(() => {
    if (!id) return null;
    return data.find((item) => item.id === id) ?? null;
  }, [data, id]);

  return { data: row, loading, error };
}

/**
 * Insert a new product.
 *
 * @example
 * const { insert, loading, error } = useInsertProduct();
 * await insert({ nama_produk: "Kaos", kategori: "Pakaian" });
 */
export function useInsertProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(async (input: Record<string, unknown>): Promise<MProduk | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<{ produk: MProduk }>("/api/core/products", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return res.produk ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat produk.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { insert, loading, error } as MutationResult & {
    insert: (input: Record<string, unknown>) => Promise<MProduk | null>;
  };
}

/**
 * Update an existing product.
 */
export function useUpdateProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, input: Record<string, unknown>): Promise<MProduk | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<{ produk: MProduk }>(`/api/core/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return res.produk ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update produk.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error } as MutationResult & {
    update: (id: string, input: Record<string, unknown>) => Promise<MProduk | null>;
  };
}

/**
 * Delete a product by ID.
 */
export function useDeleteProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await fetchApi<null>(`/api/core/products/${id}`, { method: "DELETE" });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus produk.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error } as MutationResult & {
    remove: (id: string) => Promise<boolean>;
  };
}
