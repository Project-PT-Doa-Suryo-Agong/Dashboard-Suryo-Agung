"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchApi } from "@/lib/http/client";
import type { MVarian } from "@/types/supabase";
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

// ─── Variants (core.m_varian) ──────────────────────────────────────────────────

/**
 * List all variants with optional product_id filter.
 *
 * @example
 * const { data, loading, refresh } = useVariants({ filters: [["product_id", productId]] });
 */
export function useVariants(options?: UseTableOptions) {
  const { page = 1, limit = 200, enabled = true, filters = [] } = options ?? {};

  const [data, setData] = useState<MVarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const refreshRef = useRef(0);
  const filtersKey = JSON.stringify(filters);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedFilters = JSON.parse(filtersKey) as Array<[string, string]>;
      const productId = parsedFilters.find(([col]) => col === "product_id")?.[1];
      const qs = productId ? `?product_id=${encodeURIComponent(productId)}` : "";

      const res = await fetchApi<{ varian: MVarian[] }>(`/api/core/variants${qs}`);
      setData(res.varian ?? []);
      setTotal(res.varian?.length ?? 0);
    } catch (err) {
      setData([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Gagal memuat varian.");
    } finally {
      setLoading(false);
    }
  }, [enabled, filtersKey]);

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
  } as QueryResult<MVarian>;
}

/**
 * Fetch a single variant by ID.
 */
export function useVariant(id: string | null) {
  const { data, loading, error } = useVariants({ enabled: Boolean(id), limit: 200 });
  const row = useMemo(() => {
    if (!id) return null;
    return data.find((item) => item.id === id) ?? null;
  }, [data, id]);

  return { data: row, loading, error };
}

/**
 * Insert a new variant.
 */
export function useInsertVariant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(async (input: Record<string, unknown>): Promise<MVarian | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<{ varian: MVarian }>("/api/core/variants", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return res.varian ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat varian.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { insert, loading, error } as MutationResult & {
    insert: (input: Record<string, unknown>) => Promise<MVarian | null>;
  };
}

/**
 * Update an existing variant.
 */
export function useUpdateVariant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, input: Record<string, unknown>): Promise<MVarian | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<{ varian: MVarian }>(`/api/core/variants/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return res.varian ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update varian.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error } as MutationResult & {
    update: (id: string, input: Record<string, unknown>) => Promise<MVarian | null>;
  };
}

/**
 * Delete a variant by ID.
 */
export function useDeleteVariant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await fetchApi<null>(`/api/core/variants/${id}`, { method: "DELETE" });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus varian.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error } as MutationResult & {
    remove: (id: string) => Promise<boolean>;
  };
}
