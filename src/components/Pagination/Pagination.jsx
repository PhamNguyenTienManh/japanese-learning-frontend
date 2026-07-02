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

  const pageBtnClass =
    "flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg border border-outline-variant/30 bg-surface-container-lowest font-medium text-on-surface-variant transition hover:border-primary/40 hover:bg-surface-container hover:text-on-surface";

  return (
    <div className="mt-8 flex items-center justify-center gap-2 py-4">
      <button
        className={`px-4 py-2 rounded-lg border border-outline-variant/30 text-on-surface-variant transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer bg-transparent ${currentPage === 1 ? "opacity-50" : ""}`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ← Trước
      </button>

      <div className="flex items-center gap-1">
        {startPage > 1 && (
          <>
            <button className={pageBtnClass} onClick={() => onPageChange(1)}>1</button>
            {startPage > 2 && <span className="px-2 text-on-surface-variant">...</span>}
          </>
        )}

        {pageNumbers.map((page) => (
          <button
            key={page}
            className={
              page === currentPage
                ? "flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-lg border border-primary bg-primary font-medium text-on-primary transition"
                : pageBtnClass
            }
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-on-surface-variant">...</span>}
            <button className={pageBtnClass} onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        className={`px-4 py-2 rounded-lg border border-outline-variant/30 text-on-surface-variant transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer bg-transparent ${currentPage === totalPages ? "opacity-50" : ""}`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Sau →
      </button>
    </div>
  );
}

export default Pagination;
