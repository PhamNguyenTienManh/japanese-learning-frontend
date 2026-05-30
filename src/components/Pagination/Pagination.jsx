import Button from "~/components/Button";

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  const numberClass =
    "flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg border border-[#ddd] bg-white font-medium text-[#333] transition hover:border-[#ff6b35] hover:bg-[#f5f5f5]";

  return (
    <div className="mt-8 flex items-center justify-center gap-2 py-4">
      <Button
        outline
        className="min-w-20 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ← Trước
      </Button>

      <div className="flex items-center gap-1">
        {startPage > 1 && (
          <>
            <button className={numberClass} onClick={() => onPageChange(1)}>1</button>
            {startPage > 2 && <span className="px-2 text-[#999]">...</span>}
          </>
        )}

        {pageNumbers.map((page) => (
          <button
            key={page}
            className={
              page === currentPage
                ? "flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg border border-[#ff6b35] bg-[#ff6b35] font-medium text-white transition"
                : numberClass
            }
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-[#999]">...</span>}
            <button className={numberClass} onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </button>
          </>
        )}
      </div>

      <Button
        outline
        className="min-w-20 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Sau →
      </Button>
    </div>
  );
}

export default Pagination;
