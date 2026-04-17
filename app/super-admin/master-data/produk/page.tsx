import { SearchBar } from "@/components/ui/search-bar";
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Save,
  Search,
  Edit,
  Trash2,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  ImagePlus,
  X,
} from "lucide-react";
import type { MProduk } from "@/types/supabase";
import {
  useProducts,
  useInsertProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/lib/supabase/hooks/index";
import {
  uploadProdukFoto,
  extractStoragePath,
} from "@/lib/utils/upload-produk-foto";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { RowActions, EditButton, DeleteButton } from "@/components/ui/RowActions";

const KATEGORI_LIST = [
  "Pakaian",
  "Aksesoris",
  "Sepatu",
  "Tas",
  "Elektronik",
  "Lainnya",
];

export default function ProdukPage() {
  const [namaProduk, setNamaProduk] = useState("");
  const [kategori, setKategori] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // ── Delete confirm state ──
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState("");

  // ── Foto state ──
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [existingFotoUrl, setExistingFotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Supabase Direct: read products ──
  const { data: produkList, loading: isLoading, error: readError, refresh } = useProducts();

  // ── Supabase Direct: mutations ──
  const { insert } = useInsertProduct();
  const { update } = useUpdateProduct();
  const { remove } = useDeleteProduct();

  const handleFotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }, []);

  const handleRemoveFoto = useCallback(() => {
    setFotoFile(null);
    setFotoPreview(null);
    setExistingFotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const resetForm = useCallback(() => {
    setNamaProduk("");
    setKategori("");
    setEditingId(null);
    setFotoFile(null);
    setFotoPreview(null);
    setExistingFotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let fotoUrl: string | null = existingFotoUrl ?? null;

      // Upload new foto if selected
      if (fotoFile) {
        setIsUploading(true);
        const oldPath = existingFotoUrl
          ? extractStoragePath(existingFotoUrl)
          : null;
        fotoUrl = await uploadProdukFoto(fotoFile, oldPath);
        setIsUploading(false);
      }

      const payload = { nama_produk: namaProduk, kategori, foto_url: fotoUrl };

      if (editingId) {
        const result = await update(editingId, payload);
        if (!result) throw new Error("Gagal update produk.");
      } else {
        const result = await insert(payload);
        if (!result) throw new Error("Gagal membuat produk.");
      }

      refresh();
      resetForm();
    } catch (error) {
      setIsUploading(false);
      const message = error instanceof Error ? error.message : "Operasi simpan produk gagal.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (p: MProduk) => {
    setEditingId(p.id);
    setNamaProduk(p.nama_produk);
    setKategori(p.kategori ?? "");
    setFotoFile(null);
    setFotoPreview(null);
    setExistingFotoUrl(p.foto_url ?? null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDeleteDialog = (p: MProduk) => {
    setDeleteTargetId(p.id);
    setDeleteTargetName(p.nama_produk ?? "produk ini");
  };

  const closeDeleteDialog = () => {
    setDeleteTargetId(null);
    setDeleteTargetName("");
  };

  const handleDelete = async () => {
    if (!deleteTargetId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await remove(deleteTargetId);
      if (!success) throw new Error("Gagal menghapus produk.");
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus produk.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteDialog();
    }
  };

  const filtered = useMemo(
    () =>
      produkList.filter(
        (p) =>
          p.nama_produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.kategori ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [produkList, searchQuery],
  );

  // The preview to show in the form — new file takes priority over existing URL
  const displayPreview = fotoPreview ?? existingFotoUrl ?? null;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Link
            href="/super-admin"
            className="hover:text-slate-300 text-slate-100 transition-colors"
          >
            Super Admin
          </Link>
          <ChevronRight size={13} className="text-slate-30" />
          <Link
            href="/super-admin/master-data"
            className="hover:text-slate-300 text-slate-100 transition-colors"
          >
            Master Data
          </Link>
          <ChevronRight size={13} className="text-slate-30" />
          <span className="text-emerald-300 font-medium">Produk</span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Package size={18} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              Master Data: Produk Induk
            </h2>
            <p className="text-sm text-slate-200 mt-0.5">
              Kelola produk utama sebelum dibentuk menjadi varian SKU.
            </p>
          </div>
        </div>
      </div>

      {/* ── Form Section ── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <PlusCircle size={18} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {editingId ? "Edit Produk" : "Tambah Produk Baru"}
          </h3>
          {editingId && (
            <span
              className="ml-auto text-xs text-slate-400 cursor-pointer hover:text-red-500 transition-colors"
              onClick={resetForm}
            >
              Batal Edit
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nama Produk */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Nama Produk <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={namaProduk}
              onChange={(e) => setNamaProduk(e.target.value)}
              required
              placeholder="contoh: Kaos Polo Classic"
              className="w-full px-4 py-3 bg-slate-200 border border-slate-200 text-slate-700 rounded-xl focus:ring-2 focus:ring-slate-200/20 focus:border-slate-200 text-sm outline-none transition-all"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Kategori <span className="text-red-400">*</span>
            </label>
            <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari nama produk atau kategori..."
            className="relative"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Foto
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Nama Produk
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Kategori
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Ditambahkan
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-slate-400"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-slate-400"
                  >
                    Tidak ada produk yang ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Foto thumbnail */}
                    <td className="px-6 py-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0">
                        {p.foto_url ? (
                          <Image
                            src={p.foto_url}
                            alt={p.nama_produk}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <Package size={18} className="text-slate-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {p.nama_produk}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                        {p.kategori ?? "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {p.created_at ? p.created_at.split("T")[0] : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <RowActions>
                        <EditButton onClick={() => handleEdit(p)} disabled={isSubmitting} />
                        <DeleteButton onClick={() => openDeleteDialog(p)} disabled={isSubmitting} />
                      </RowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Menampilkan {filtered.length} dari {produkList.length} produk
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Sebelumnya
            </button>
            <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Berikutnya
            </button>
          </div>
        </div>
      </section>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Hapus Produk"
        description={`Apakah kamu yakin ingin menghapus produk "${deleteTargetName}"? Semua varian terkait mungkin juga terpengaruh.`}
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
