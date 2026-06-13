import { RefreshCw } from "lucide-react";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function UserHeader({ total, filteredCount, page, onRefresh, refreshing }) {
  const isFiltered = filteredCount !== total;

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="m-0 text-[28px] font-extrabold leading-[1.2] text-[#0f172a]">
          Quản lý {page}
        </h1>
        <p className="m-0 mt-2 text-sm font-medium text-slate-500">
          Tổng cộng <strong className="font-bold text-slate-700">{formatNumber(total)}</strong> {page}
          {isFiltered && (
            <>
              {" "}· hiển thị{" "}
              <strong className="font-bold text-slate-700">
                {formatNumber(filteredCount)}
              </strong>{" "}
              kết quả
            </>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-950 bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
      >
        <RefreshCw
          size={16}
          aria-hidden="true"
          className={refreshing ? "animate-spin" : ""}
        />
        Làm mới
      </button>
    </header>
  );
}

export default UserHeader;
