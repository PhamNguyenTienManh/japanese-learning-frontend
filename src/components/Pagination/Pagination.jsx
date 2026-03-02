import Button from "~/components/Button";
import classNames from "classnames/bind";
import styles from "./Pagination.module.scss";

const cx = classNames.bind(styles);

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

  return (
    <div className={cx("pagination")}>
      <Button
        outline
        className={cx("pagination-btn")}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ← Trước
      </Button>

      <div className={cx("pagination-numbers")}>
        {startPage > 1 && (
          <>
            <button className={cx("pagination-number")} onClick={() => onPageChange(1)}>1</button>
            {startPage > 2 && <span className={cx("pagination-dots")}>...</span>}
          </>
        )}

        {pageNumbers.map((page) => (
          <button
            key={page}
            className={cx("pagination-number", { active: page === currentPage })}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className={cx("pagination-dots")}>...</span>}
            <button className={cx("pagination-number")} onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </button>
          </>
        )}
      </div>

      <Button
        outline
        className={cx("pagination-btn")}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Sau →
      </Button>
    </div>
  );
}

export default Pagination;
