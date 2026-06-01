import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faChartLine,
  faChevronLeft,
  faChevronRight,
  faClock,
  faMagnifyingGlass,
  faRotateRight,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";

import { getAdminExamAttemptStats } from "~/services/examService";
import styles from "./Statistics.module.scss";

const cx = classNames.bind(styles);

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "in_progress", label: "Đang làm" },
  { value: "saving", label: "Đã lưu" },
  { value: "completed", label: "Hoàn thành" },
];

const PAGE_SIZE = 10;

const STATUS_META = {
  in_progress: { label: "Đang làm", tone: "progress" },
  saving: { label: "Đã lưu", tone: "saving" },
  completed: { label: "Hoàn thành", tone: "completed" },
};

function unwrapResponse(response) {
  return response?.data || response || {};
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  if (!total) return "--";

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) return `${hours}g ${minutes}p`;
  if (minutes > 0) return `${minutes}p ${secs}s`;
  return `${secs}s`;
}

function getResultLabel(row) {
  if (row.status !== "completed") {
    return { label: "Chưa có kết quả", tone: "muted" };
  }

  return row.passed
    ? { label: "Đạt", tone: "passed" }
    : { label: "Chưa đạt", tone: "failed" };
}

function AdminTestStatistics() {
  const { examId } = useParams();
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [status, debouncedQuery]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminExamAttemptStats(examId, {
        page,
        limit: PAGE_SIZE,
        status,
        q: debouncedQuery,
      });
      setData(unwrapResponse(response));
    } catch (err) {
      console.error(err);
      setError("Không thể tải thống kê lượt làm bài");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, page, status, debouncedQuery]);

  const exam = data?.exam || {};
  const summary = data?.summary || {};
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const pagination = data?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
  };

  const summaryCards = [
    {
      label: "Tổng lượt làm",
      value: summary.totalAttempts || 0,
      icon: faChartLine,
      tone: "slate",
    },
    {
      label: "Đã nộp",
      value: summary.completed || 0,
      icon: faUserCheck,
      tone: "teal",
    },
    {
      label: "Đang làm / Đã lưu",
      value: `${summary.inProgress || 0} / ${summary.saving || 0}`,
      icon: faClock,
      tone: "amber",
    },
    {
      label: "Tỉ lệ đạt",
      value: `${summary.passRate || 0}%`,
      icon: faChartLine,
      tone: "green",
    },
    {
      label: "Điểm trung bình",
      value: summary.averageScore || 0,
      icon: faChartLine,
      tone: "blue",
    },
  ];

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("inner")}>
          <section className={cx("header")}>
            <div>
              <Link to="/admin/tests" className={cx("backLink")}>
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>Quay lại danh sách đề</span>
              </Link>
              <h1 className={cx("title")}>Thống kê lượt làm bài</h1>
              <p className={cx("subtitle")}>
                {exam.title || "Đề thi"}{" "}
                {exam.level && <span className={cx("levelBadge")}>{exam.level}</span>}
              </p>
            </div>

            <button type="button" className={cx("refreshBtn")} onClick={loadStats}>
              <FontAwesomeIcon icon={faRotateRight} />
              <span>Tải lại</span>
            </button>
          </section>

          <section className={cx("summaryGrid")}>
            {summaryCards.map((item) => (
              <article key={item.label} className={cx("summaryCard", item.tone)}>
                <div className={cx("summaryIcon")}>
                  <FontAwesomeIcon icon={item.icon} />
                </div>
                <div>
                  <p className={cx("summaryValue")}>{item.value}</p>
                  <p className={cx("summaryLabel")}>{item.label}</p>
                </div>
              </article>
            ))}
          </section>

          <section className={cx("filterCard")}>
            <div className={cx("searchWrapper")}>
              <FontAwesomeIcon icon={faMagnifyingGlass} className={cx("searchIcon")} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên hoặc email user..."
                className={cx("searchInput")}
              />
            </div>

            <select
              className={cx("statusSelect")}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </section>

          <section className={cx("tablePanel")}>
            <div className={cx("tableHeader")}>
              <div>
                <h2>Danh sách lượt làm</h2>
                <p>
                  Tổng cộng <strong>{pagination.total || 0}</strong> lượt phù hợp
                </p>
              </div>
            </div>

            {loading && (
              <div className={cx("stateCard")}>
                <div className={cx("loadingRing")} />
                <p>Đang tải thống kê...</p>
              </div>
            )}

            {!loading && error && (
              <div className={cx("stateCard", "errorState")}>
                <p>{error}</p>
                <button type="button" onClick={loadStats}>
                  Thử lại
                </button>
              </div>
            )}

            {!loading && !error && rows.length === 0 && (
              <div className={cx("stateCard")}>
                <p>Chưa có lượt làm bài phù hợp.</p>
              </div>
            )}

            {!loading && !error && rows.length > 0 && (
              <>
                <div className={cx("tableWrap")}>
                  <table className={cx("statsTable")}>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Trạng thái</th>
                        <th>Kết quả</th>
                        <th>Điểm</th>
                        <th>Thời lượng</th>
                        <th>Bắt đầu</th>
                        <th>Kết thúc/nộp bài</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const statusMeta = STATUS_META[row.status] || {
                          label: row.status || "Không rõ",
                          tone: "unknown",
                        };
                        const resultMeta = getResultLabel(row);

                        return (
                          <tr key={row.examResultId}>
                            <td>
                              <span className={cx("userName")}>
                                {row.user?.name || "Chưa có tên"}
                              </span>
                            </td>
                            <td className={cx("mutedCell")}>
                              {row.user?.email || "--"}
                            </td>
                            <td>
                              <span className={cx("statusBadge", statusMeta.tone)}>
                                {statusMeta.label}
                              </span>
                            </td>
                            <td>
                              <span className={cx("resultBadge", resultMeta.tone)}>
                                {resultMeta.label}
                              </span>
                            </td>
                            <td className={cx("numberCell")}>
                              {row.status === "completed"
                                ? `${row.totalScore}/${row.maxScore || exam.score || "--"}`
                                : "--"}
                            </td>
                            <td>{formatDuration(row.duration)}</td>
                            <td>{formatDateTime(row.startTime || row.createdAt)}</td>
                            <td>
                              {row.status === "completed"
                                ? formatDateTime(row.endTime)
                                : "--"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className={cx("paginationBar")}>
                  <span>
                    Trang {pagination.page || 1} / {pagination.totalPages || 1}
                  </span>
                  <div className={cx("pageControls")}>
                    <button
                      type="button"
                      disabled={(pagination.page || 1) <= 1}
                      onClick={() => setPage((current) => Math.max(current - 1, 1))}
                      aria-label="Trang trước"
                    >
                      <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <button
                      type="button"
                      disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
                      onClick={() =>
                        setPage((current) =>
                          Math.min(current + 1, pagination.totalPages || 1),
                        )
                      }
                      aria-label="Trang sau"
                    >
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminTestStatistics;
