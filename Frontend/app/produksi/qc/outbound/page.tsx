"use client";

import { useMemo, useState } from "react";
import { CheckSquare, Search, ShieldCheck } from "lucide-react";
import Modal from "@/components/ui/Modal";

type QcOutboundStatus = "pass" | "reject";

type ProduksiOrderRef = {
  id: string;
  code: string;
  product_name: string;
};

type QcOutboundItem = {
  id: string;
  produksi_order_id: string;
  qty_produced: number;
  status: QcOutboundStatus;
  inspector_name: string;
  date: string;
  notes?: string;
};

const production_t_produksi_order_seed: ProduksiOrderRef[] = [
  { id: "e7f5ec66-2f95-4a66-9ef9-95298e5c0001", code: "PO-20260316-001", product_name: "Coffee Beans Arabica 250gr" },
  { id: "e7f5ec66-2f95-4a66-9ef9-95298e5c0002", code: "PO-20260316-002", product_name: "Chocolate Blend 500gr" },
  { id: "e7f5ec66-2f95-4a66-9ef9-95298e5c0003", code: "PO-20260316-003", product_name: "Syrup Caramel 1L" },
  { id: "e7f5ec66-2f95-4a66-9ef9-95298e5c0004", code: "PO-20260316-004", product_name: "Matcha Mix 400gr" },
  { id: "e7f5ec66-2f95-4a66-9ef9-95298e5c0005", code: "PO-20260316-005", product_name: "Roasted Robusta 1kg" },
  { id: "e7f5ec66-2f95-4a66-9ef9-95298e5c0006", code: "PO-20260316-006", product_name: "Vanilla Cream Powder 500gr" },
  { id: "e7f5ec66-2f95-4a66-9ef9-95298e5c0007", code: "PO-20260316-007", product_name: "Hazelnut Syrup 750ml" },
];

const production_t_qc_outbound_rows_seed: QcOutboundItem[] = [
  {
    id: "QCO-20260316-001",
    produksi_order_id: "e7f5ec66-2f95-4a66-9ef9-95298e5c0001",
    qty_produced: 500,
    status: "pass",
    inspector_name: "Nadia Kurnia",
    date: "2026-03-16",
  },
  {
    id: "QCO-20260316-002",
    produksi_order_id: "e7f5ec66-2f95-4a66-9ef9-95298e5c0002",
    qty_produced: 320,
    status: "pass",
    inspector_name: "Rama Saputra",
    date: "2026-03-16",
    notes: "Sesuai standar fisik dan berat bersih.",
  },
  {
    id: "QCO-20260316-003",
    produksi_order_id: "e7f5ec66-2f95-4a66-9ef9-95298e5c0003",
    qty_produced: 220,
    status: "reject",
    inspector_name: "Indah Lestari",
    date: "2026-03-15",
    notes: "Seal tutup botol belum konsisten, perlu perbaikan line packing.",
  },
  {
    id: "QCO-20260316-004",
    produksi_order_id: "e7f5ec66-2f95-4a66-9ef9-95298e5c0004",
    qty_produced: 280,
    status: "reject",
    inspector_name: "Fikri Maulana",
    date: "2026-03-15",
    notes: "Kelembapan produk melebihi batas QC.",
  },
];

const status_label: Record<QcOutboundStatus, string> = {
  pass: "Lolos QC / Siap Kirim",
  reject: "Reject",
};

const status_badge_class: Record<QcOutboundStatus, string> = {
  pass: "bg-emerald-100 text-emerald-700",
  reject: "bg-rose-100 text-rose-700",
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

  const orderById = useMemo(
    () => Object.fromEntries(production_t_produksi_order_seed.map((order) => [order.id, order])) as Record<string, ProduksiOrderRef>,
    [],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const order = orderById[item.produksi_order_id];
      const matchStatus = filterStatus === "all" || item.status === filterStatus;
      const matchSearch =
        normalizedSearch.length === 0 ||
        item.id.toLowerCase().includes(normalizedSearch) ||
        (order?.code ?? "").toLowerCase().includes(normalizedSearch) ||
        (order?.product_name ?? "").toLowerCase().includes(normalizedSearch);

      return matchStatus && matchSearch;
    });
  }, [items, searchTerm, filterStatus, orderById]);

  const handleOpenInspectModal = (item: QcOutboundItem) => {
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
        item.id === selectedItem.id ? selectedItem : item,
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
              placeholder="Cari ID inspeksi atau referensi order..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value as "all" | QcOutboundStatus)}
            className="w-full sm:w-56 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
          >
            <option value="all">Semua Status</option>
            <option value="pass">Lolos QC / Siap Kirim</option>
            <option value="reject">Reject</option>
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
                  Produksi Order
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
                  const order = orderById[item.produksi_order_id];
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">
                        {item.id}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 min-w-72">
                        <p className="font-semibold text-slate-800 whitespace-nowrap">{order?.code ?? "-"}</p>
                        <p className="text-slate-600 break-words">{order?.product_name ?? "Order tidak ditemukan"}</p>
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
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#BC934B] transition hover:text-[#a88444] whitespace-nowrap"
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
              <div className="space-y-1.5">
                <label htmlFor="produksi-order-outbound" className="text-sm font-semibold text-slate-700">
                  Produksi Order
                </label>
                <select
                  id="produksi-order-outbound"
                  value={selectedItem.produksi_order_id}
                  onChange={(event) =>
                    setSelectedItem((prevItem) =>
                      prevItem ? { ...prevItem, produksi_order_id: event.target.value } : prevItem,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
                >
                  {production_t_produksi_order_seed.map((order) => (
                    <option key={order.id} value={order.id}>{order.code} - {order.product_name}</option>
                  ))}
                </select>
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
                  <option value="pass">Lolos QC / Siap Kirim</option>
                  <option value="reject">Reject</option>
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
                  placeholder="Tulis catatan evaluasi QC."
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
