"use client";

import { useMemo, useState } from "react";
import { CheckSquare, Search, ShieldCheck } from "lucide-react";
import Modal from "@/components/ui/Modal";

type QcOutboundStatus = "pending" | "passed" | "failed" | "rework";

type QcOutboundItem = {
  id: string;
  batch_id: string;
  product_name: string;
  qty_produced: number;
  status: QcOutboundStatus;
  inspector_name: string;
  date: string;
  notes?: string;
};

const production_t_qc_outbound_rows_seed: QcOutboundItem[] = [
  {
    id: "QCO-20260316-001",
    batch_id: "BATCH-PROD-240316-A",
    product_name: "Coffee Beans Arabica 250gr",
    qty_produced: 500,
    status: "pending",
    inspector_name: "Nadia Kurnia",
    date: "2026-03-16",
  },
  {
    id: "QCO-20260316-002",
    batch_id: "BATCH-PROD-240316-B",
    product_name: "Chocolate Blend 500gr",
    qty_produced: 320,
    status: "passed",
    inspector_name: "Rama Saputra",
    date: "2026-03-16",
    notes: "Sesuai standar fisik dan berat bersih.",
  },
  {
    id: "QCO-20260316-003",
    batch_id: "BATCH-PROD-240315-C",
    product_name: "Syrup Caramel 1L",
    qty_produced: 220,
    status: "rework",
    inspector_name: "Indah Lestari",
    date: "2026-03-15",
    notes: "Seal tutup botol belum konsisten, perlu perbaikan line packing.",
  },
  {
    id: "QCO-20260316-004",
    batch_id: "BATCH-PROD-240315-D",
    product_name: "Matcha Mix 400gr",
    qty_produced: 280,
    status: "failed",
    inspector_name: "Fikri Maulana",
    date: "2026-03-15",
    notes: "Kelembapan produk melebihi batas QC.",
  },
  {
    id: "QCO-20260316-005",
    batch_id: "BATCH-PROD-240314-E",
    product_name: "Roasted Robusta 1kg",
    qty_produced: 150,
    status: "pending",
    inspector_name: "Nadia Kurnia",
    date: "2026-03-14",
  },
  {
    id: "QCO-20260316-006",
    batch_id: "BATCH-PROD-240314-F",
    product_name: "Vanilla Cream Powder 500gr",
    qty_produced: 260,
    status: "passed",
    inspector_name: "Ari Wijaya",
    date: "2026-03-14",
    notes: "Produk lolos inspeksi akhir, siap kirim.",
  },
  {
    id: "QCO-20260316-007",
    batch_id: "BATCH-PROD-240313-G",
    product_name: "Hazelnut Syrup 750ml",
    qty_produced: 180,
    status: "rework",
    inspector_name: "Mila Pratama",
    date: "2026-03-13",
    notes: "Warna batch belum seragam, perlu mixing ulang.",
  },
];

const status_label: Record<QcOutboundStatus, string> = {
  pending: "Menunggu Inspeksi",
  passed: "Lolos QC / Siap Kirim",
  failed: "Gagal Total / Reject",
  rework: "Butuh Perbaikan",
};

const status_badge_class: Record<QcOutboundStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  passed: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  rework: "bg-indigo-100 text-indigo-700",
};

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function QcOutboundPage() {
  const [items, setItems] = useState<QcOutboundItem[]>(production_t_qc_outbound_rows_seed);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | QcOutboundStatus>("all");
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QcOutboundItem | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchStatus = filterStatus === "all" || item.status === filterStatus;
      const matchSearch =
        normalizedSearch.length === 0 ||
        item.id.toLowerCase().includes(normalizedSearch) ||
        item.product_name.toLowerCase().includes(normalizedSearch);

      return matchStatus && matchSearch;
    });
  }, [items, searchTerm, filterStatus]);

  const handleOpenInspectModal = (item: QcOutboundItem) => {
    if (item.status === "passed" || item.status === "failed") return;
    setSelectedItem(item);
    setIsInspectModalOpen(true);
  };

  const handleCloseInspectModal = () => {
    setIsInspectModalOpen(false);
    setSelectedItem(null);
  };

  const handleSaveEvaluation = () => {
    if (!selectedItem) return;

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              status: selectedItem.status,
              notes: selectedItem.notes,
            }
          : item,
      ),
    );

    handleCloseInspectModal();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">QC Outbound (Produk Jadi)</h1>
        <p className="text-sm md:text-base text-slate-600">
          Inspeksi akhir kualitas produk jadi sebelum diserahkan ke gudang/logistik.
        </p>
      </section>

      <section className="flex flex-col gap-3 md:gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-3xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari ID inspeksi atau nama produk jadi..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value as "all" | QcOutboundStatus)}
            className="w-full sm:w-56 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu Inspeksi</option>
            <option value="passed">Lolos QC / Siap Kirim</option>
            <option value="rework">Butuh Perbaikan</option>
            <option value="failed">Gagal Total / Reject</option>
          </select>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a88444] w-full sm:w-auto"
        >
          <ShieldCheck className="h-4 w-4" />
          Jadwalkan Inspeksi
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Daftar QC Outbound</h2>
          <p className="mt-1 text-xs md:text-sm text-slate-500">
            Rekap inspeksi akhir produk jadi sebelum proses serah ke logistik.
          </p>
        </div>

        <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full min-w-max">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  ID Inspeksi
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Tanggal
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Batch &amp; Produk
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Qty Produksi
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Inspektur
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500" colSpan={7}>
                    Tidak ada data inspeksi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isActionDisabled =
                    item.status === "passed" || item.status === "failed";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">
                        {item.id}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 min-w-72">
                        <p className="font-semibold text-slate-800 whitespace-nowrap">{item.batch_id}</p>
                        <p className="text-slate-600 break-words">{item.product_name}</p>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {item.qty_produced} Unit
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {item.inspector_name}
                      </td>
                      <td className="px-4 md:px-6 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${status_badge_class[item.status]}`}
                        >
                          {status_label[item.status]}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3">
                        <button
                          type="button"
                          onClick={() => handleOpenInspectModal(item)}
                          disabled={isActionDisabled}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#BC934B] transition hover:text-[#a88444] disabled:text-slate-300 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          <CheckSquare className="h-4 w-4" />
                          Evaluasi QC
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        isOpen={isInspectModalOpen}
        onClose={handleCloseInspectModal}
        title="Evaluasi QC Outbound"
        maxWidth="max-w-lg"
      >
        {selectedItem ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSaveEvaluation();
            }}
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Nama Produk</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 break-words">
                  {selectedItem.product_name}
                </p>

                <p className="mt-3 text-xs uppercase tracking-wide font-semibold text-slate-500">Qty Produksi</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedItem.qty_produced} Unit</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="status-qc-outbound" className="text-sm font-semibold text-slate-700">
                  Ubah Status Evaluasi
                </label>
                <select
                  id="status-qc-outbound"
                  value={selectedItem.status}
                  onChange={(event) =>
                    setSelectedItem((prevItem) =>
                      prevItem
                        ? { ...prevItem, status: event.target.value as QcOutboundStatus }
                        : prevItem,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
                >
                  <option value="passed">Lolos QC / Siap Kirim</option>
                  <option value="failed">Gagal Total / Reject</option>
                  <option value="rework">Butuh Perbaikan</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="evaluation-note" className="text-sm font-semibold text-slate-700">
                  Catatan Evaluasi (Opsional)
                </label>
                <textarea
                  id="evaluation-note"
                  rows={4}
                  value={selectedItem.notes ?? ""}
                  onChange={(event) =>
                    setSelectedItem((prevItem) =>
                      prevItem ? { ...prevItem, notes: event.target.value } : prevItem,
                    )
                  }
                  placeholder="Tulis catatan evaluasi, misalnya alasan failed atau item yang perlu rework..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition resize-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCloseInspectModal}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a88444]"
              >
                Simpan Evaluasi
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
