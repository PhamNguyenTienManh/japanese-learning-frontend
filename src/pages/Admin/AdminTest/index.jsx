import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faChartLine,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faClock,
  faEyeSlash,
  faFileLines,
  faMagnifyingGlass,
  faPenToSquare,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

import Input from "~/components/Input";
import { getExamsByLevel, updateExam } from "~/services/examService";
import styles from "./AdminTest.module.scss";

const cx = classNames.bind(styles);

const LEVEL_OPTIONS = ["N5", "N4", "N3", "N2", "N1"];
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const STATUS_OPTIONS = [
  { value: "published", label: "Công khai", tone: "published" },
  { value: "completed", label: "Hoàn thiện", tone: "completed" },
  { value: "draft", label: "Bản nháp", tone: "draft" },
  { value: "hidden", label: "Ẩn", tone: "hidden" },
];

const STATUS_MAP = STATUS_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item;
  return acc;
}, {});

const LEVEL_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả cấp độ" },
  ...LEVEL_OPTIONS.map((level) => ({ value: level, label: level })),
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  ...STATUS_OPTIONS.map((status) => ({ value: status.value, label: status.label })),
];

const PAGE_SIZE_DROPDOWN_OPTIONS = PAGE_SIZE_OPTIONS.map((size) => ({
  value: size,
  label: `${size} dòng`,
}));

const statusIcons = {
  published: faCircleCheck,
  completed: faCircleCheck,
  draft: faClock,
  hidden: faEyeSlash,
};

function getStatusMeta(status) {
  return STATUS_MAP[status] || { value: status || "unknown", label: "Không rõ", tone: "unknown" };
}

function formatDate(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return date.toLocaleDateString("vi-VN");
}

function AdminDropdown({ value, options, onChange, className, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const selectedOption = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;

    const updateMenuPosition = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;

      setMenuStyle({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    };

    const handlePointerDown = (event) => {
      const clickedButton = rootRef.current?.contains(event.target);
      const clickedMenu = menuRef.current?.contains(event.target);

      if (!clickedButton && !clickedMenu) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    updateMenuPosition();
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cx("dropdown", className, { open })}>
      <button
        type="button"
        className={cx("dropdownButton")}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedOption?.label}</span>
        <FontAwesomeIcon icon={faChevronDown} />
      </button>

      {open && menuStyle && createPortal(
        <div
          ref={menuRef}
          className={cx("dropdownMenu")}
          role="listbox"
          aria-label={ariaLabel}
          style={menuStyle}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={cx("dropdownOption", {
                selected: option.value === value,
              })}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function AdminTest() {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exams, setExams] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const navigate = useNavigate();
  const location = useLocation();

  const fetchExams = async (level) => {
    try {
      setLoading(true);
      setError("");
      const res = await getExamsByLevel(level);
      const nextExams = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      setExams(nextExams);
    } catch (err) {
      console.error(err);
      setExams([]);
      if (/not found/i.test(err?.message || "")) {
        setError("");
        return;
      }
      setError("Không thể tải dữ liệu đề thi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!toast.show) return undefined;
    const timer = setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.show]);

  useEffect(() => {
    const routeToast = location.state?.toast;
    if (!routeToast) return;

    setToast({
      show: true,
      message: routeToast.message,
      type: routeToast.type || "success",
    });
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    fetchExams(levelFilter);
  }, [levelFilter]);

  const filteredExams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return exams.filter((exam) => {
      const title = (exam.title || "").toLowerCase();
      const level = (exam.level || "").toLowerCase();
      const matchSearch = !q || title.includes(q) || level.includes(q);
      const matchStatus = statusFilter === "all" || exam.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [exams, searchQuery, statusFilter]);

  const summary = useMemo(() => {
    return exams.reduce(
      (acc, exam) => {
        acc.total += 1;
        if (exam.status === "published") acc.published += 1;
        if (exam.status === "draft") acc.draft += 1;
        if (exam.status === "hidden") acc.hidden += 1;
        return acc;
      },
      { total: 0, published: 0, draft: 0, hidden: 0 },
    );
  }, [exams]);

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / pageSize));

  useEffect(() => {
    setCurrentPage((page) => Math.min(Math.max(page, 1), totalPages));
  }, [totalPages]);

  const paginatedExams = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExams.slice(start, start + pageSize);
  }, [filteredExams, currentPage, pageSize]);

  const showingFrom =
    filteredExams.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, filteredExams.length);

  const handleChangeStatus = async (id, newStatus) => {
    const previousExams = exams;
    setExams((prev) =>
      prev.map((exam) => (exam._id === id ? { ...exam, status: newStatus } : exam)),
    );

    try {
      await updateExam(id, { status: newStatus });
      setToast({
        show: true,
        message: "Cập nhật trạng thái thành công",
        type: "success",
      });
    } catch (err) {
      setExams(previousExams);
      setToast({
        show: true,
        message: "Cập nhật trạng thái thất bại",
        type: "error",
      });
    }
  };

  const handleViewStats = () => {
    setToast({
      show: true,
      message: "Chức năng thống kê sẽ được bổ sung sau",
      type: "info",
    });
  };

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("inner")}>
          <section className={cx("header")}>
            <div className={cx("titleBlock")}>
              <h1 className={cx("title")}>Quản lý đề thi</h1>
              <p className={cx("subtitle")}>
                Tổng cộng <strong>{summary.total}</strong> đề thi
                {filteredExams.length !== exams.length && (
                  <>
                    {" "}· hiển thị <strong>{filteredExams.length}</strong> kết quả
                  </>
                )}
              </p>
            </div>

            <div className={cx("headerRight")}>
              <Link to="/admin/tests/create" className={cx("primaryBtn")}>
                <FontAwesomeIcon icon={faPlus} />
                <span>Tạo đề thi</span>
              </Link>
            </div>
          </section>

          <section className={cx("filterCard")}>
            <div className={cx("filterRow")}>
              <div className={cx("searchWrapper")}>
                <FontAwesomeIcon icon={faMagnifyingGlass} className={cx("searchIcon")} />
                <Input
                  placeholder="Tìm theo tên đề hoặc cấp độ..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={cx("searchInput")}
                />
              </div>

              <div className={cx("selectGroup")}>
                <AdminDropdown
                  className="select"
                  value={levelFilter}
                  options={LEVEL_FILTER_OPTIONS}
                  ariaLabel="Lọc cấp độ"
                  onChange={(nextValue) => {
                    setLevelFilter(nextValue);
                    setCurrentPage(1);
                  }}
                />

                <AdminDropdown
                  className="select"
                  value={statusFilter}
                  options={STATUS_FILTER_OPTIONS}
                  ariaLabel="Lọc trạng thái"
                  onChange={(nextValue) => {
                    setStatusFilter(nextValue);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </section>

          {loading && (
            <section className={cx("stateCard")}>
              <div className={cx("loadingRing")} />
              <p>Đang tải dữ liệu đề thi...</p>
            </section>
          )}

          {!loading && error && (
            <section className={cx("stateCard", "errorState")}>
              <FontAwesomeIcon icon={faFileLines} />
              <p>{error}</p>
              <button type="button" className={cx("retryBtn")} onClick={() => fetchExams(levelFilter)}>
                Thử lại
              </button>
            </section>
          )}

          {!loading && !error && (
            <section className={cx("tablePanel")}>
              <div className={cx("tableHeader")}>
                <div>
                  <h2>Danh sách đề thi</h2>
                  <p>
                    Hiển thị <strong>{showingFrom}-{showingTo}</strong> trên{" "}
                    <strong>{filteredExams.length}</strong> đề thi
                  </p>
                </div>
              </div>

              {filteredExams.length > 0 ? (
                <div className={cx("tableWrap")}>
                  <table className={cx("testsTable")}>
                    <colgroup>
                      <col className={cx("colTitle")} />
                      <col className={cx("colLevel")} />
                      <col className={cx("colStatus")} />
                      <col className={cx("colQuestions")} />
                      <col className={cx("colScore")} />
                      <col className={cx("colPassScore")} />
                      <col className={cx("colDate")} />
                      <col className={cx("colActions")} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Tên đề</th>
                        <th>Cấp độ</th>
                        <th>Trạng thái</th>
                        <th>Số câu hỏi</th>
                        <th>Tổng điểm</th>
                        <th>Điểm đạt</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedExams.map((exam) => {
                        const level = exam.level || "N5";
                        const levelTone = level.toLowerCase();
                        const statusMeta = getStatusMeta(exam.status);
                        const statusIcon = statusIcons[statusMeta.value] || faClock;
                        const maxScore = Number(exam.score) || 0;
                        const passScore = Number(exam.pass_score) || 0;
                        const questionCount = Number(exam.questionCount) || 0;

                        return (
                          <tr key={exam._id}>
                            <td>
                              <div className={cx("examCell")}>
                                <span className={cx("examTitle")}>
                                  {exam.title || "Đề thi chưa có tên"}
                                </span>
                                <span className={cx("examId")}>{exam._id}</span>
                              </div>
                            </td>
                            <td>
                              <span className={cx("levelBadge", levelTone)}>
                                {level}
                              </span>
                            </td>
                            <td>
                              <span className={cx("statusBadge", statusMeta.tone)}>
                                <FontAwesomeIcon icon={statusIcon} />
                                {statusMeta.label}
                              </span>
                            </td>
                            <td className={cx("numberCell")}>{questionCount}</td>
                            <td className={cx("numberCell")}>{maxScore || "--"}</td>
                            <td className={cx("numberCell")}>{passScore || "--"}</td>
                            <td className={cx("mutedCell")}>
                              {formatDate(exam.createdAt)}
                            </td>
                            <td>
                              <div className={cx("tableActions")}>
                                <button
                                  type="button"
                                  className={cx("iconAction")}
                                  title="Sửa đề thi"
                                  aria-label="Sửa đề thi"
                                  onClick={() => navigate(`/admin/tests/update/${exam._id}`)}
                                >
                                  <FontAwesomeIcon icon={faPenToSquare} />
                                </button>

                                <button
                                  type="button"
                                  className={cx("iconAction")}
                                  title="Xem thống kê"
                                  aria-label="Xem thống kê"
                                  onClick={handleViewStats}
                                >
                                  <FontAwesomeIcon icon={faChartLine} />
                                </button>

                                <AdminDropdown
                                  className="statusSelect"
                                  value={exam.status || "draft"}
                                  options={STATUS_OPTIONS}
                                  ariaLabel="Trạng thái đề thi"
                                  onChange={(nextValue) => handleChangeStatus(exam._id, nextValue)}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <section className={cx("emptyCard")}>
                  <div className={cx("emptyIcon")}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </div>
                  <p>Không tìm thấy đề thi nào phù hợp</p>
                </section>
              )}

              {filteredExams.length > 0 && (
                <div className={cx("paginationBar")}>
                  <span className={cx("pageInfo")}>
                    Trang {currentPage} / {totalPages}
                  </span>

                  <div className={cx("pageControls")}>
                    <AdminDropdown
                      className="pageSizeSelect"
                      value={pageSize}
                      options={PAGE_SIZE_DROPDOWN_OPTIONS}
                      ariaLabel="Số dòng mỗi trang"
                      onChange={(nextValue) => {
                        setPageSize(Number(nextValue));
                        setCurrentPage(1);
                      }}
                    />

                    <button
                      type="button"
                      className={cx("pageButton")}
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                      aria-label="Trang trước"
                    >
                      <FontAwesomeIcon icon={faChevronLeft} />
                    </button>

                    <button
                      type="button"
                      className={cx("pageButton")}
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setCurrentPage((page) => Math.min(page + 1, totalPages))
                      }
                      aria-label="Trang sau"
                    >
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {toast.show && (
        <div className={cx("toast", toast.type)}>
          <div className={cx("toastContent")}>
            <span className={cx("toastIcon")}>{toast.type === "success" ? "✓" : "!"}</span>
            <span className={cx("toastMessage")}>{toast.message}</span>
          </div>

          <button
            type="button"
            className={cx("toastClose")}
            onClick={() => setToast({ show: false, message: "", type: "" })}
            aria-label="Đóng thông báo"
          >
            ×
          </button>

          <div className={cx("toastProgress")} />
        </div>
      )}
    </div>
  );
}

export default AdminTest;
