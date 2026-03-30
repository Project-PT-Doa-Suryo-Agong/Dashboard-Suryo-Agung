"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";

type PackingStatusDB = "pending" | "packed" | "shipped";
type FilterStatus = "all" | PackingStatusDB;

type SalesOrderRef = {
  id: string;
  order_code: string;
  customer_name: string;
  product_name: string;
};

type PackingItem = {
  id: string;
  order_id: string;
  status: PackingStatusDB;
  created_at: string;
};

const sales_t_sales_order_seed: SalesOrderRef[] = [
  { id: "4c9a398e-5312-4305-9a48-09b3988a0001", order_code: "SO-20260314-001", customer_name: "Aulia Pramesti", product_name: "Jaket Windproof" },
  { id: "4c9a398e-5312-4305-9a48-09b3988a0002", order_code: "SO-20260314-002", customer_name: "Rizky Permana", product_name: "Sepatu Safety" },
  { id: "4c9a398e-5312-4305-9a48-09b3988a0003", order_code: "SO-20260314-003", customer_name: "Dina Maharani", product_name: "Helm Pro Guard" },
  { id: "4c9a398e-5312-4305-9a48-09b3988a0004", order_code: "SO-20260314-004", customer_name: "Farhan Aji", product_name: "Tas Utility" },
  { id: "4c9a398e-5312-4305-9a48-09b3988a0005", order_code: "SO-20260314-005", customer_name: "Wulan Sari", product_name: "Sarung Tangan Grip" },
  { id: "4c9a398e-5312-4305-9a48-09b3988a0006", order_code: "SO-20260314-006", customer_name: "Yogi Prakoso", product_name: "Kacamata Safety" },
];

const DUMMY_PACKING_ITEMS: PackingItem[] = [
  {
    id: "4a7159d8-fcf2-4f09-b4a2-9b197cbde111",
    order_id: "4c9a398e-5312-4305-9a48-09b3988a0001",
    status: "pending",
    created_at: "2026-03-14T08:12:00+07:00",
  },
  {
    id: "f8c6f03a-d7be-4dc8-8f75-7ac1f0552d22",
    order_id: "4c9a398e-5312-4305-9a48-09b3988a0002",
    status: "packed",
    created_at: "2026-03-14T08:35:00+07:00",
  },
  {
    id: "d73095a7-8db0-42e8-8e57-0c4ad3ef8333",
    order_id: "4c9a398e-5312-4305-9a48-09b3988a0003",
    status: "shipped",
    created_at: "2026-03-14T09:10:00+07:00",
  },
  {
    id: "85762818-86c7-4a73-aa4b-f70386af9444",
    order_id: "4c9a398e-5312-4305-9a48-09b3988a0004",
    status: "packed",
    created_at: "2026-03-14T09:26:00+07:00",
  },
];

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function statusBadgeClass(status: PackingStatusDB): string {
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "packed") return "bg-blue-100 text-blue-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function PackingPage() {
  const [items, setItems] = useState<PackingItem[]>(DUMMY_PACKING_ITEMS);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<PackingItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<PackingStatusDB>("pending");

  const orderById = useMemo(
    () => Object.fromEntries(sales_t_sales_order_seed.map((order) => [order.id, order])) as Record<string, SalesOrderRef>,
    [],
  );

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const order = orderById[item.order_id];
      const matchesSearch =
        (order?.order_code ?? "").toLowerCase().includes(keyword) ||
        (order?.customer_name ?? "").toLowerCase().includes(keyword) ||
        (order?.product_name ?? "").toLowerCase().includes(keyword);
      const matchesStatus = filterStatus === "all" ? true : item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, filterStatus, orderById]);

  const openUpdateModal = (item: PackingItem) => {
    setSelectedItem(item);
    setSelectedStatus(item.status);
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedItem(null);
    setSelectedStatus("pending");
  };

  const handleSaveUpdate = () => {
    if (!selectedItem) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? { ...item, status: selectedStatus }
          : item,
      ),
    );

    closeUpdateModal();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Daftar Packing Barang</h1>
        <p className="text-sm md:text-base text-slate-200">
          Pantau antrean dan proses pengemasan pesanan.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari order / customer / produk..."
            className="w-full rounded-xl border border-slate-300 bg-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value as FilterStatus)}
          className="w-full sm:w-52 rounded-xl border border-slate-300 bg-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
        >
          <option value="all">Semua Status</option>
          <option value="pending">pending</option>
          <option value="packed">packed</option>
          <option value="shipped">shipped</option>
        </select>
      </div>

      <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                No. Pesanan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Customer & Produk
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const order = orderById[item.order_id];
                return (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{order?.order_code ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {dateFormatter.format(new Date(item.created_at))}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">{order?.customer_name ?? "Customer tidak ditemukan"}</p>
                      <p className="text-xs text-slate-600">{order?.product_name ?? "Produk tidak ditemukan"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadgeClass(
                          item.status,
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => openUpdateModal(item)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border bg-green-500 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-green-700 hover:text-white"
                      >
                        <CheckCircle2 size={15} />
                        Update Status
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  Data packing tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isUpdateModalOpen}
        onClose={closeUpdateModal}
        title="Update Status Packing"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">No. Pesanan</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{selectedItem ? orderById[selectedItem.order_id]?.order_code ?? "-" : "-"}</p>
            <p className="mt-1 text-xs text-slate-600">Produk: {selectedItem ? orderById[selectedItem.order_id]?.product_name ?? "-" : "-"}</p>
          </div>

          <label className="space-y-1.5 block">
            <span className="text-sm font-medium text-slate-700">Pilih Status</span>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as PackingStatusDB)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            >
              <option value="pending">pending</option>
              <option value="packed">packed</option>
              <option value="shipped">shipped</option>
            </select>
          </label>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeUpdateModal}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveUpdate}
              className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
