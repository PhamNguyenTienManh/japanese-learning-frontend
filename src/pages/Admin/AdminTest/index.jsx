import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
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

function AdminTest() {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const navigate = useNavigate();

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

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("inner")}>
          <section className={cx("header")}>
            <div className={cx("titleBlock")}>
              <span className={cx("eyebrow")}>Quản trị</span>
              <h1 className={cx("title")}>
                Quản lý <span className={cx("titleAccent")}>đề thi</span>
              </h1>
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
              <div className={cx("statsRow")}>
                <div className={cx("statPill", "tonePrimary")}>
                  <span className={cx("statValue")}>{summary.total}</span>
                  <span className={cx("statLabel")}>Tổng</span>
                </div>
                <div className={cx("statPill", "toneOrange")}>
                  <span className={cx("statValue")}>{summary.published}</span>
                  <span className={cx("statLabel")}>Công khai</span>
                </div>
              </div>

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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cx("searchInput")}
                />
              </div>

              <div className={cx("selectGroup")}>
                <select
                  className={cx("select")}
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                >
                  <option value="all">Tất cả cấp độ</option>
                  {LEVEL_OPTIONS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>

                <select
                  className={cx("select")}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
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
            <section className={cx("list")}>
              {filteredExams.length > 0 ? (
                filteredExams.map((exam) => {
                  const level = exam.level || "N5";
                  const levelTone = level.toLowerCase();
                  const statusMeta = getStatusMeta(exam.status);
                  const statusIcon = statusIcons[statusMeta.value] || faClock;
                  const maxScore = Number(exam.score) || 0;
                  const passScore = Number(exam.pass_score) || 0;
                  const passPercent = maxScore > 0
                    ? Math.min(100, Math.round((passScore / maxScore) * 100))
                    : 0;

                  return (
                    <article key={exam._id} className={cx("testCard", levelTone)}>
                      <div className={cx("levelMark", levelTone)}>
                        <span>{level}</span>
                      </div>

                      <div className={cx("testBody")}>
                        <div className={cx("testTop")}>
                          <div className={cx("testInfo")}>
                            <div className={cx("titleRow")}>
                              <h2 className={cx("testTitle")}>
                                {exam.title || "Đề thi chưa có tên"}
                              </h2>
                              <span className={cx("badge", "badgeLevel", levelTone)}>
                                JLPT {level}
                              </span>
                              <span className={cx("statusBadge", statusMeta.tone)}>
                                <FontAwesomeIcon icon={statusIcon} />
                                {statusMeta.label}
                              </span>
                            </div>

                            <p className={cx("createdText")}>
                              Ngày tạo: <strong>{formatDate(exam.createdAt)}</strong>
                            </p>
                          </div>

                          <div className={cx("actions")}>
                            <button
                              type="button"
                              className={cx("editBtn")}
                              title="Sửa đề thi"
                              aria-label="Sửa đề thi"
                              onClick={() => navigate(`/admin/tests/update/${exam._id}`)}
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>

                            <select
                              className={cx("statusSelect")}
                              value={exam.status || "draft"}
                              onChange={(e) => handleChangeStatus(exam._id, e.target.value)}
                              aria-label="Trạng thái đề thi"
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className={cx("metaGrid")}>
                          <div className={cx("metaItem")}>
                            <span className={cx("metaLabel")}>Tổng điểm</span>
                            <strong>{maxScore || "--"}</strong>
                          </div>
                          <div className={cx("metaItem")}>
                            <span className={cx("metaLabel")}>Điểm đạt</span>
                            <strong>{passScore || "--"}</strong>
                          </div>
                          <div className={cx("metaItem", "scoreProgress")}>
                            <span className={cx("metaLabel")}>Tỷ lệ đạt</span>
                            <div className={cx("progressLine")}>
                              <span style={{ width: `${passPercent}%` }} />
                            </div>
                            <strong>{passPercent}%</strong>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <section className={cx("emptyCard")}>
                  <div className={cx("emptyIcon")}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </div>
                  <p>Không tìm thấy đề thi nào phù hợp</p>
                </section>
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
