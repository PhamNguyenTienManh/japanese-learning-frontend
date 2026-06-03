import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileSpreadsheet,
  Loader2,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import {
  getAdminTransactionDetail,
  getAdminTransactions,
} from "~/services/paymentService";

const STATUS_FILTERS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "success", label: "Thành công" },
  { value: "failed", label: "Thất bại" },
  { value: "refunded", label: "Hoàn tiền" },
  { value: "pending", label: "Đang xử lý" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const EXPORT_PAGE_SIZE = 1000;

const STATUS_META = {
  success: {
    label: "Thành công",
    Icon: CircleCheck,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  failed: {
    label: "Thất bại",
    Icon: CircleX,
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  cancelled: {
    label: "Thất bại",
    Icon: CircleX,
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  refunded: {
    label: "Hoàn tiền",
    Icon: RotateCcw,
    className: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  pending: {
    label: "Đang xử lý",
    Icon: Clock,
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
};

function getStatusMeta(status) {
  return (
    STATUS_META[status] || {
      label: "Không rõ",
      Icon: Clock,
      className: "bg-slate-100 text-slate-700 ring-slate-200",
    }
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value) || 0);
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getPaymentTime(transaction) {
  return transaction?.paidAt || transaction?.updatedAt || transaction?.createdAt;
}

function getProviderLabel(provider) {
  const labels = {
    zalopay: "ZaloPay",
    stripe: "Stripe",
  };
  return labels[provider] || provider || "-";
}

function getCycleLabel(cycle) {
  const labels = {
    monthly: "Hàng tháng",
    yearly: "Hàng năm",
  };
  return labels[cycle] || cycle || "-";
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadBlob(content, fileName, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toExportRows(rows) {
  return rows.map((row) => {
    const statusMeta = getStatusMeta(row.status);
    return {
      "Transaction ID": row.transactionId || row.orderId,
      "Order ID": row.orderId,
      "Email": row.user?.email || "",
      "Tên user": row.user?.name || "",
      "Số tiền": Number(row.amount) || 0,
      "Phương thức": getProviderLabel(row.provider),
      "Gói": row.plan || "",
      "Chu kỳ": getCycleLabel(row.cycle),
      "Trạng thái": statusMeta.label,
      "Thời gian": formatDateTime(getPaymentTime(row)),
      "Mã phản hồi": row.responseCode || "",
      "Ngân hàng": row.bankCode || "",
    };
  });
}

function StatusBadge({ status }) {
  const meta = getStatusMeta(status);
  const Icon = meta.Icon;

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${meta.className}`}
    >
      <Icon size={14} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function SummaryCard({ title, value, tone = "slate", icon: Icon }) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-normal text-slate-500">
            {title}
          </p>
          <p className="m-0 mt-2 text-xl font-bold text-slate-950">
            {value}
          </p>
        </div>
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${toneClass}`}
        >
          <Icon size={19} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:grid-cols-[150px_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd
        className={`m-0 min-w-0 break-words text-sm font-semibold text-slate-950 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "-"}
      </dd>
    </div>
  );
}

function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    totalPage: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setQuery(searchInput.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const payload = await getAdminTransactions({
        page,
        limit,
        status,
        q: query,
      });

      setTransactions(Array.isArray(payload?.data) ? payload.data : []);
      setSummary(payload?.summary || {});
      setPagination({
        total: Number(payload?.total) || 0,
        totalPage: Math.max(Number(payload?.totalPage) || 1, 1),
      });
    } catch (err) {
      setTransactions([]);
      setSummary({});
      setPagination({ total: 0, totalPage: 1 });
      setError(err?.message || "Không thể tải danh sách giao dịch.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, query]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const showingFrom = pagination.total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, pagination.total);

  const activeFilterLabel = useMemo(() => {
    return STATUS_FILTERS.find((item) => item.value === status)?.label || "Tất cả";
  }, [status]);

  const handleViewDetail = async (transaction) => {
    setSelected(transaction);
    setDetailLoading(true);
    try {
      const detail = await getAdminTransactionDetail(transaction.id);
      setSelected(detail);
    } catch (err) {
      setSelected({
        ...transaction,
        detailError: err?.message || "Không thể tải chi tiết giao dịch.",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchAllForExport = async () => {
    const firstPayload = await getAdminTransactions({
      page: 1,
      limit: EXPORT_PAGE_SIZE,
      status,
      q: query,
    });
    const rows = Array.isArray(firstPayload?.data) ? [...firstPayload.data] : [];
    const totalPage = Math.max(Number(firstPayload?.totalPage) || 1, 1);

    for (let nextPage = 2; nextPage <= totalPage; nextPage += 1) {
      const payload = await getAdminTransactions({
        page: nextPage,
        limit: EXPORT_PAGE_SIZE,
        status,
        q: query,
      });
      rows.push(...(Array.isArray(payload?.data) ? payload.data : []));
    }

    return rows;
  };

  const handleExportCsv = async () => {
    try {
      setExporting("csv");
      const rows = toExportRows(await fetchAllForExport());
      const headers = Object.keys(rows[0] || toExportRows([{}])[0]);
      const csv = [
        headers.map(csvEscape).join(","),
        ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
      ].join("\n");
      downloadBlob(
        `\ufeff${csv}`,
        `transactions-${new Date().toISOString().slice(0, 10)}.csv`,
        "text/csv;charset=utf-8;",
      );
    } catch (err) {
      setError(err?.message || "Không thể export CSV.");
    } finally {
      setExporting("");
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting("excel");
      const rows = toExportRows(await fetchAllForExport());
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
      XLSX.writeFile(
        workbook,
        `transactions-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (err) {
      setError(err?.message || "Không thể export Excel.");
    } finally {
      setExporting("");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f7f8fb] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm">
              <ReceiptText size={16} aria-hidden="true" />
              Quản lý giao dịch
            </div>
            <h1 className="m-0 mt-3 text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
              Thống kê giao dịch
            </h1>
            <p className="m-0 mt-2 text-sm font-medium text-slate-500">
              {activeFilterLabel} · {formatNumber(pagination.total)} giao dịch
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadTransactions}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                aria-hidden="true"
                className={loading ? "animate-spin" : ""}
              />
              Làm mới
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={Boolean(exporting) || pagination.total === 0}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting === "csv" ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Download size={16} aria-hidden="true" />
              )}
              CSV
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={Boolean(exporting) || pagination.total === 0}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting === "excel" ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <FileSpreadsheet size={16} aria-hidden="true" />
              )}
              Excel
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Tổng doanh thu"
            value={formatCurrency(summary.successAmount)}
            tone="emerald"
            icon={CreditCard}
          />
          <SummaryCard
            title="Thành công"
            value={formatNumber(summary.success)}
            tone="emerald"
            icon={CircleCheck}
          />
          <SummaryCard
            title="Đang xử lý"
            value={formatNumber(summary.pending)}
            tone="amber"
            icon={Clock}
          />
          <SummaryCard
            title="Thất bại"
            value={formatNumber(summary.failed)}
            tone="rose"
            icon={CircleX}
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_130px]">
            <label className="relative block">
              <span className="sr-only">Tìm kiếm giao dịch</span>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm transaction ID, email, tên user..."
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </label>

            <label>
              <span className="sr-only">Lọc trạng thái</span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              >
                {STATUS_FILTERS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Số dòng mỗi trang</span>
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              >
                {PAGE_SIZE_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item} dòng
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="m-0 text-base font-bold text-slate-950">
                Danh sách giao dịch
              </h2>
              <p className="m-0 mt-1 text-sm font-medium text-slate-500">
                Hiển thị {formatNumber(showingFrom)}-{formatNumber(showingTo)} trên{" "}
                {formatNumber(pagination.total)}
              </p>
            </div>
          </div>

          {error && (
            <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] table-fixed border-collapse">
              <colgroup>
                <col className="w-[230px]" />
                <col className="w-[250px]" />
                <col className="w-[150px]" />
                <col className="w-[130px]" />
                <col className="w-[150px]" />
                <col className="w-[170px]" />
                <col className="w-[90px]" />
              </colgroup>
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                    Transaction
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                    Số tiền
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                    Phương thức
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-normal text-slate-500">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center">
                      <div className="inline-flex items-center gap-3 text-sm font-semibold text-slate-500">
                        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                        Đang tải giao dịch...
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 align-middle">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="truncate font-mono text-sm font-bold text-slate-950">
                            {transaction.transactionId || transaction.orderId}
                          </span>
                          <span className="truncate font-mono text-xs font-medium text-slate-500">
                            Order #{transaction.orderId}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="truncate text-sm font-bold text-slate-950">
                            {transaction.user?.name || "-"}
                          </span>
                          <span className="truncate text-xs font-semibold text-slate-500">
                            {transaction.user?.email || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle text-sm font-bold text-slate-950">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span className="inline-flex min-h-7 items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {getProviderLabel(transaction.provider)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <StatusBadge status={transaction.status} />
                      </td>
                      <td className="px-4 py-4 align-middle text-sm font-semibold text-slate-600">
                        {formatDateTime(getPaymentTime(transaction))}
                      </td>
                      <td className="px-4 py-4 text-right align-middle">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(transaction)}
                          className="inline-grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                          aria-label="Xem chi tiết giao dịch"
                          title="Xem chi tiết"
                        >
                          <Eye size={17} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}

                {!loading && transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-slate-500">
                        <ReceiptText size={34} aria-hidden="true" />
                        <p className="m-0 text-sm font-semibold">
                          Không có giao dịch phù hợp.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-semibold text-slate-500">
              Trang {formatNumber(page)} / {formatNumber(pagination.totalPage)}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="inline-grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Trang trước"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPage || loading}
                onClick={() =>
                  setPage((current) => Math.min(current + 1, pagination.totalPage))
                }
                className="inline-grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Trang sau"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[10000] flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            aria-label="Đóng chi tiết"
            onClick={() => setSelected(null)}
          />
          <aside className="relative h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
              <div className="min-w-0">
                <p className="m-0 text-sm font-semibold text-slate-500">
                  Chi tiết giao dịch
                </p>
                <h3 className="m-0 mt-1 truncate font-mono text-lg font-bold text-slate-950">
                  {selected.transactionId || selected.orderId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                aria-label="Đóng"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="px-5 py-5">
              {detailLoading && (
                <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Đang tải chi tiết...
                </div>
              )}

              {selected.detailError && (
                <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                  {selected.detailError}
                </div>
              )}

              <div className="mb-5 flex flex-wrap items-center gap-2">
                <StatusBadge status={selected.status} />
                <span className="inline-flex min-h-7 items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {getProviderLabel(selected.provider)}
                </span>
              </div>

              <dl className="m-0 rounded-lg border border-slate-200 px-4">
                <DetailRow label="User" value={selected.user?.name} />
                <DetailRow label="Email" value={selected.user?.email} />
                <DetailRow
                  label="Số tiền"
                  value={formatCurrency(selected.amount)}
                />
                <DetailRow
                  label="Phương thức"
                  value={getProviderLabel(selected.provider)}
                />
                <DetailRow label="Gói" value={selected.plan || "Pro"} />
                <DetailRow label="Chu kỳ" value={getCycleLabel(selected.cycle)} />
                <DetailRow
                  label="Thời gian"
                  value={formatDateTime(getPaymentTime(selected))}
                />
                <DetailRow
                  label="Transaction ID"
                  value={selected.transactionId}
                  mono
                />
                <DetailRow label="Order ID" value={selected.orderId} mono />
                <DetailRow label="Mã phản hồi" value={selected.responseCode} />
                <DetailRow label="Ngân hàng" value={selected.bankCode} />
                <DetailRow label="IP" value={selected.ipAddr} mono />
              </dl>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default AdminTransactions;
