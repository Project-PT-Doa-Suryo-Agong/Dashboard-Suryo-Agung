"use client";

import { useMemo, useState } from "react";
import { Edit3, Plus, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";

type ProductionOrderStatus = "draft" | "ongoing" | "done";

type VendorItem = { id: string; nama_vendor: string };
type ProductItem = { id: string; nama_produk: string };

type ProductionOrder = {
  id: string;
  vendor_id: string;
  product_id: string;
  target_qty: number;
  start_date: string;
  deadline: string;
  status: ProductionOrderStatus;
};

const core_m_vendor_seed: VendorItem[] = [
  { id: "f31d0cdc-2f89-4a2e-b2ef-df7f1a130001", nama_vendor: "Vendor Nusantara" },
  { id: "f31d0cdc-2f89-4a2e-b2ef-df7f1a130002", nama_vendor: "Mitra Sejahtera" },
  { id: "f31d0cdc-2f89-4a2e-b2ef-df7f1a130003", nama_vendor: "Prima Supply" },
];

const core_m_produk_seed: ProductItem[] = [
  { id: "a9f3f5f5-60e3-4b95-8cc7-7b6f5f710001", nama_produk: "Coffee Beans Arabica 250gr" },
  { id: "a9f3f5f5-60e3-4b95-8cc7-7b6f5f710002", nama_produk: "Chocolate Blend 500gr" },
  { id: "a9f3f5f5-60e3-4b95-8cc7-7b6f5f710003", nama_produk: "Syrup Caramel 1L" },
  { id: "a9f3f5f5-60e3-4b95-8cc7-7b6f5f710004", nama_produk: "Matcha Mix 400gr" },
  { id: "a9f3f5f5-60e3-4b95-8cc7-7b6f5f710005", nama_produk: "Roasted Robusta 1kg" },
  { id: "a9f3f5f5-60e3-4b95-8cc7-7b6f5f710006", nama_produk: "Vanilla Cream Powder 500gr" },
  { id: "a9f3f5f5-60e3-4b95-8cc7-7b6f5f710007", nama_produk: "Hazelnut Syrup 750ml" },
];

const production_t_produksi_order_rows_seed: ProductionOrder[] = [
  {
    id: "PO-20260316-001",
    product_id: "a9f3f5f5-60e3-4b95-8cc7-7b6f5f710001",
    vendor_id: "f31d0cdc-2f89-4a2e-b2ef-df7f1a130001",
    target_qty: 500,
    start_date: "2026-03-15",
    deadline: "2026-03-18",
    status: "ongoing",
  },
  {
    id: "PO-20260316-002",
    product_id: "a9f3f5f5-60e3-4b95-8cc7-7b6f5f710002",
    vendor_id: "f31d0cdc-2f89-4a2e-b2ef-df7f1a130002",
    target_qty: 320,
    start_date: "2026-03-16",
    deadline: "2026-03-20",
    status: "draft",
  },
  {
    id: "PO-20260316-003",
    product_id: "a9f3f5f5-60e3-4b95-8cc7-7b6f5f710003",
    vendor_id: "f31d0cdc-2f89-4a2e-b2ef-df7f1a130003",
    target_qty: 220,
    start_date: "2026-03-12",
    deadline: "2026-03-16",
    status: "done",
  },
  {
    id: "PO-20260316-004",
    product_id: "a9f3f5f5-60e3-4b95-8cc7-7b6f5f710004",
    vendor_id: "f31d0cdc-2f89-4a2e-b2ef-df7f1a130001",
    target_qty: 280,
    start_date: "2026-03-10",
    deadline: "2026-03-14",
    status: "draft",
  },
  {
    id: "PO-20260316-005",
    product_id: "a9f3f5f5-60e3-4b95-8cc7-7b6f5f710005",
    vendor_id: "f31d0cdc-2f89-4a2e-b2ef-df7f1a130002",
    target_qty: 150,
    start_date: "2026-03-16",
    deadline: "2026-03-19",
    status: "ongoing",
  },
  {
    id: "PO-20260316-006",
    product_id: "a9f3f5f5-60e3-4b95-8cc7-7b6f5f710006",
    vendor_id: "f31d0cdc-2f89-4a2e-b2ef-df7f1a130003",
    target_qty: 260,
    start_date: "2026-03-17",
    deadline: "2026-03-21",
    status: "draft",
  },
  {
    id: "PO-20260316-007",
    product_id: "a9f3f5f5-60e3-4b95-8cc7-7b6f5f710007",
    vendor_id: "f31d0cdc-2f89-4a2e-b2ef-df7f1a130001",
    target_qty: 180,
    start_date: "2026-03-13",
    deadline: "2026-03-17",
    status: "done",
  },
];

const status_label: Record<ProductionOrderStatus, string> = {
  draft: "Draft",
  ongoing: "Berjalan",
  done: "Selesai",
};

const status_badge_class: Record<ProductionOrderStatus, string> = {
  draft: "bg-amber-100 text-amber-700",
  ongoing: "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
};

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function ProductionOrdersPage() {
  const [items, setItems] = useState<ProductionOrder[]>(production_t_produksi_order_rows_seed);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | ProductionOrderStatus>("all");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

  const productById = useMemo(
    () => Object.fromEntries(core_m_produk_seed.map((item) => [item.id, item.nama_produk])) as Record<string, string>,
    [],
  );

  const vendorById = useMemo(
    () => Object.fromEntries(core_m_vendor_seed.map((item) => [item.id, item.nama_vendor])) as Record<string, string>,
    [],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchStatus = filterStatus === "all" || item.status === filterStatus;
      const matchSearch =
        normalizedSearch.length === 0 ||
        item.id.toLowerCase().includes(normalizedSearch) ||
        (productById[item.product_id] ?? "").toLowerCase().includes(normalizedSearch);

      return matchStatus && matchSearch;
    });
  }, [items, searchTerm, filterStatus, productById]);

  const handleOpenUpdateModal = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setIsUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedOrder(null);
  };

  const handleSaveUpdate = () => {
    if (!selectedOrder) return;

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === selectedOrder.id ? selectedOrder : item,
      ),
    );

    handleCloseUpdateModal();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Pesanan Produksi (Orders)</h1>
        <p className="text-sm md:text-base text-slate-600">
          Kelola dan pantau antrean proses manufaktur produk.
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
              placeholder="Cari ID pesanan atau nama produk..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value as "all" | ProductionOrderStatus)}
            className="w-full sm:w-52 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="ongoing">Berjalan</option>
            <option value="done">Selesai</option>
          </select>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a88444] w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Buat Pesanan Baru
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Daftar Pesanan Produksi</h2>
          <p className="mt-1 text-xs md:text-sm text-slate-500">
            Data pesanan produksi dari antrean proses aktif dan historis.
          </p>
        </div>

        <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full min-w-max">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  ID Pesanan
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Produk
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Vendor
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Target (Qty)
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Timeline
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
                    Tidak ada pesanan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">
                      {item.id}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 min-w-56">
                      <p className="break-words">{productById[item.product_id] ?? "Produk tidak ditemukan"}</p>
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {vendorById[item.vendor_id] ?? "Vendor tidak ditemukan"}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {item.target_qty} Unit
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {formatDate(item.start_date)} - {formatDate(item.deadline)}
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
                        onClick={() => handleOpenUpdateModal(item)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#BC934B] transition hover:text-[#a88444] whitespace-nowrap"
                      >
                        <Edit3 className="h-4 w-4" />
                        Update Progress
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        isOpen={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        title="Update Progress Pesanan"
        maxWidth="max-w-lg"
      >
        {selectedOrder ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSaveUpdate();
            }}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="product-order" className="text-sm font-semibold text-slate-700">
                  Produk
                </label>
                <select
                  id="product-order"
                  value={selectedOrder.product_id}
                  onChange={(event) =>
                    setSelectedOrder((prevOrder) =>
                      prevOrder ? { ...prevOrder, product_id: event.target.value } : prevOrder,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
                >
                  {core_m_produk_seed.map((product) => (
                    <option key={product.id} value={product.id}>{product.nama_produk}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="vendor-order" className="text-sm font-semibold text-slate-700">
                  Vendor
                </label>
                <select
                  id="vendor-order"
                  value={selectedOrder.vendor_id}
                  onChange={(event) =>
                    setSelectedOrder((prevOrder) =>
                      prevOrder ? { ...prevOrder, vendor_id: event.target.value } : prevOrder,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
                >
                  {core_m_vendor_seed.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>{vendor.nama_vendor}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="status-order" className="text-sm font-semibold text-slate-700">
                  Ubah Status
                </label>
                <select
                  id="status-order"
                  value={selectedOrder.status}
                  onChange={(event) =>
                    setSelectedOrder((prevOrder) =>
                      prevOrder
                        ? { ...prevOrder, status: event.target.value as ProductionOrderStatus }
                        : prevOrder,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
                >
                  <option value="draft">Draft</option>
                  <option value="ongoing">Berjalan</option>
                  <option value="done">Selesai</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCloseUpdateModal}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a88444]"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
