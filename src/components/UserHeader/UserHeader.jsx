import { Users } from "lucide-react";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function UserHeader({ total, filteredCount, page }) {
  const isFiltered = filteredCount !== total;

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm">
          <Users size={16} aria-hidden="true" />
          Quản trị
        </div>
        <h1 className="m-0 mt-3 text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center shadow-sm">
          <div className="text-xl font-bold leading-none text-slate-950 [font-variant-numeric:tabular-nums]">
            {formatNumber(total)}
          </div>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Tổng
          </div>
        </div>
        {isFiltered && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center shadow-sm">
            <div className="text-xl font-bold leading-none text-slate-950 [font-variant-numeric:tabular-nums]">
              {formatNumber(filteredCount)}
            </div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Hiển thị
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default UserHeader;
