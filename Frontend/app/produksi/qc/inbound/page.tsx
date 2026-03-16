"use client";

import { useMemo, useState } from "react";
import { CheckSquare, ClipboardCheck, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";

type QcInboundStatus = "pending" | "approved" | "rejected" | "partial";

type QcInboundItem = {
  id: string;
  po_number: string;
  material_name: string;
  qty_received: number;
  status: QcInboundStatus;
  inspector_name: string;
  date: string;
  inspection_note?: string;
};

const production_t_qc_inbound_rows_seed: QcInboundItem[] = [
  {
    id: "QCI-20260316-001",
    po_number: "PO-MAT-202603-121",
    material_name: "Biji Kopi Arabica Grade A",
    qty_received: 180,
    status: "pending",
    inspector_name: "Rizal Mahendra",
    date: "2026-03-16",
  },
  {
    id: "QCI-20260316-002",
    po_number: "PO-MAT-202603-122",
    material_name: "Susu Bubuk Full Cream",
    qty_received: 140,
    status: "approved",
    inspector_name: "Nadia Kurnia",
    date: "2026-03-16",
    inspection_note: "Warna, aroma, dan kadar air sesuai standar.",
  },
  {
    id: "QCI-20260316-003",
    po_number: "PO-MAT-202603-123",
    material_name: "Kemasan Pouch 250gr",
    qty_received: 1000,
    status: "partial",
    inspector_name: "Ari Wijaya",
    date: "2026-03-15",
    inspection_note: "Sebagian kemasan penyok, 120 pcs dipisahkan.",
  },
  {
    id: "QCI-20260316-004",
    po_number: "PO-MAT-202603-124",
    material_name: "Label Produk Batch Maret",
    qty_received: 950,
    status: "rejected",
    inspector_name: "Mila Pratama",
    date: "2026-03-15",
    inspection_note: "Cetak label blur dan warna tidak sesuai master.",
  },
  {
    id: "QCI-20260316-005",
    po_number: "PO-MAT-202603-125",
    material_name: "Caramel Concentrate",
    qty_received: 65,
    status: "pending",
    inspector_name: "Rizal Mahendra",
    date: "2026-03-14",
  },
  {
    id: "QCI-20260316-006",
    po_number: "PO-MAT-202603-126",
    material_name: "Cocoa Powder Premium",
    qty_received: 120,
    status: "approved",
    inspector_name: "Nadia Kurnia",
    date: "2026-03-14",
    inspection_note: "Lolos sampling fisik dan uji aroma.",
  },
  {
    id: "QCI-20260316-007",
    po_number: "PO-MAT-202603-127",
    material_name: "Gula Kristal Putih",
    qty_received: 200,
    status: "partial",
    inspector_name: "Ari Wijaya",
    date: "2026-03-13",
    inspection_note: "15 kg menggumpal, dikarantina untuk retur.",
  },
];

const status_label: Record<QcInboundStatus, string> = {
  pending: "Menunggu Inspeksi",
  approved: "Lolos QC",
  rejected: "Ditolak",
  partial: "Lolos Sebagian",
};

const status_badge_class: Record<QcInboundStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  partial: "bg-indigo-100 text-indigo-700",
};

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function QcInboundPage() {
  const [items, setItems] = useState<QcInboundItem[]>(production_t_qc_inbound_rows_seed);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | QcInboundStatus>("all");
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QcInboundItem | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchStatus = filterStatus === "all" || item.status === filterStatus;
      const matchSearch =
        normalizedSearch.length === 0 ||
        item.id.toLowerCase().includes(normalizedSearch) ||
        item.material_name.toLowerCase().includes(normalizedSearch);

      return matchStatus && matchSearch;
    });
  }, [items, searchTerm, filterStatus]);

  const handleOpenInspectModal = (item: QcInboundItem) => {
    if (item.status === "approved" || item.status === "rejected") return;
    setSelectedItem(item);
    setIsInspectModalOpen(true);
  };

  const handleCloseInspectModal = () => {
    setIsInspectModalOpen(false);
    setSelectedItem(null);
  };

  const handleSaveInspection = () => {
    if (!selectedItem) return;

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              status: selectedItem.status,
              inspection_note: selectedItem.inspection_note,
            }
          : item,
      ),
    );

    handleCloseInspectModal();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">QC Inbound (Bahan Baku Masuk)</h1>
        <p className="text-sm md:text-base text-slate-600">
          Inspeksi kualitas bahan baku dari supplier sebelum masuk ke gudang utama.
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
              placeholder="Cari ID inspeksi atau nama bahan baku..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value as "all" | QcInboundStatus)}
            className="w-full sm:w-56 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu Inspeksi</option>
            <option value="approved">Lolos QC</option>
            <option value="partial">Lolos Sebagian</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a88444] w-full sm:w-auto"
        >
          <ClipboardCheck className="h-4 w-4" />
          Catat Inspeksi Baru
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Daftar QC Inbound</h2>
          <p className="mt-1 text-xs md:text-sm text-slate-500">
            Rekap inspeksi bahan baku masuk berdasarkan purchase order supplier.
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
                  No. PO &amp; Bahan Baku
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Qty Diterima
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
                    item.status === "approved" || item.status === "rejected";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">
                        {item.id}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 min-w-72">
                        <p className="font-semibold text-slate-800 whitespace-nowrap">{item.po_number}</p>
                        <p className="text-slate-600 break-words">{item.material_name}</p>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {item.qty_received} Unit
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
                          Input Hasil QC
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
        title="Input Hasil QC Inbound"
        maxWidth="max-w-lg"
      >
        {selectedItem ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSaveInspection();
            }}
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Nama Bahan Baku</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 break-words">
                  {selectedItem.material_name}
                </p>

                <p className="mt-3 text-xs uppercase tracking-wide font-semibold text-slate-500">Qty Diterima</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedItem.qty_received} Unit</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="status-qc-inbound" className="text-sm font-semibold text-slate-700">
                  Ubah Status Hasil QC
                </label>
                <select
                  id="status-qc-inbound"
                  value={selectedItem.status}
                  onChange={(event) =>
                    setSelectedItem((prevItem) =>
                      prevItem
                        ? { ...prevItem, status: event.target.value as QcInboundStatus }
                        : prevItem,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
                >
                  <option value="approved">Lolos QC</option>
                  <option value="rejected">Ditolak</option>
                  <option value="partial">Lolos Sebagian</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="inspection-note" className="text-sm font-semibold text-slate-700">
                  Catatan Inspeksi (Opsional)
                </label>
                <textarea
                  id="inspection-note"
                  rows={4}
                  value={selectedItem.inspection_note ?? ""}
                  onChange={(event) =>
                    setSelectedItem((prevItem) =>
                      prevItem ? { ...prevItem, inspection_note: event.target.value } : prevItem,
                    )
                  }
                  placeholder="Tuliskan catatan inspeksi, misal alasan reject atau komponen yang lolos sebagian..."
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
                Simpan Hasil
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
