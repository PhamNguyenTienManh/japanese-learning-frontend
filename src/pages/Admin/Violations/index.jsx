import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import {
  CheckCircle2,
  Eye,
  RefreshCw,
  RotateCcw,
  Settings2,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import moderationService, {
  MODERATION_COUNTS_REFRESH_EVENT,
} from "~/services/moderationService";
import styles from "./Violations.module.scss";

const cx = classNames.bind(styles);

const statusTabs = [
  {
    value: "pending",
    label: "Chờ duyệt",
    status: "pending",
    source: "automated",
    countKey: "automatedPending",
  },
  {
    value: "auto_deleted",
    label: "AI tự động xóa",
    status: "auto_deleted",
    source: "automated",
    countKey: "automatedAutoDeleted",
  },
  {
    value: "user_report_posts",
    label: "Bài viết bị người dùng báo cáo",
    status: "pending",
    source: "user_report",
    targetType: "post",
    countKey: "userReportPostsPending",
  },
  { value: "handled", label: "Đã xử lý", status: "handled", source: "" },
];

const PAGE_SIZE = 10;

const targetTypeLabels = {
  post: "Bài viết",
  comment: "Bình luận",
  reply_comment: "Trả lời bình luận",
};

const categoryLabels = {
  spam_advertising: "Spam / quảng cáo",
  abusive_language: "Thô tục / xúc phạm",
  off_topic: "Không liên quan",
  language_misinformation: "Sai lệch ngôn ngữ",
  nsfw: "Nhạy cảm / NSFW",
  manipulation: "Thao túng",
};

function unwrap(response) {
  return response?.success ? response.data : response;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("vi-VN");
}

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.$oid || value._id || String(value);
}

function getPostLink(item) {
  const postId =
    item.targetType === "post" ? getId(item.targetId) : getId(item.parentPostId);
  return postId ? `/community/${postId}` : "";
}

function getLatestReport(item) {
  const reports = Array.isArray(item.userReports) ? item.userReports : [];
  return reports[reports.length - 1] || null;
}

function Violations() {
  const [cases, setCases] = useState([]);
  const [settings, setSettings] = useState(null);
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [activeStatus, setActiveStatus] = useState("pending");
  const [targetType, setTargetType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPage: 1,
  });
  const [caseCounts, setCaseCounts] = useState({
    automatedPending: 0,
    automatedAutoDeleted: 0,
    userReportPostsPending: 0,
    actionableTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCases = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const activeTab = statusTabs.find((tab) => tab.value === activeStatus) || statusTabs[0];
      const effectiveTargetType = activeTab.targetType || targetType;
      const response = await moderationService.getCases({
        status: activeTab.status,
        targetType: effectiveTargetType,
        source: activeTab.source,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      const data = unwrap(response);
      const totalPage = Math.max(Number(data?.totalPage) || 1, 1);
      if (currentPage > totalPage) {
        setCurrentPage(totalPage);
        return;
      }

      setCases(data?.data || []);
      setPagination({
        total: Number(data?.total) || 0,
        page: Number(data?.page) || currentPage,
        limit: Number(data?.limit) || PAGE_SIZE,
        totalPage,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể tải báo cáo vi phạm.");
      setCases([]);
      setPagination({
        total: 0,
        page: 1,
        limit: PAGE_SIZE,
        totalPage: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [activeStatus, currentPage, targetType]);

  const loadSettings = useCallback(async () => {
    try {
      const response = await moderationService.getSettings();
      const data = unwrap(response);
      const loadedSettings = {
        postBatchSize: data?.postBatchSize || 2,
        commentBatchSize: data?.commentBatchSize || 5,
        batchTimeoutSeconds: data?.batchTimeoutSeconds || 30,
        autoDeleteConfidenceThreshold:
          data?.autoDeleteConfidenceThreshold ?? 0.8,
      };
      setSettings(loadedSettings);
      setSettingsDraft(loadedSettings);
      setIsEditingSettings(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể tải cấu hình AI duyệt.");
    }
  }, []);

  const loadCaseCounts = useCallback(async () => {
    try {
      const response = await moderationService.getCaseCounts();
      const data = unwrap(response);
      setCaseCounts({
        automatedPending: Number(data?.automatedPending) || 0,
        automatedAutoDeleted: Number(data?.automatedAutoDeleted) || 0,
        userReportPostsPending: Number(data?.userReportPostsPending) || 0,
        actionableTotal: Number(data?.actionableTotal) || 0,
      });
    } catch {
      setCaseCounts({
        automatedPending: 0,
        automatedAutoDeleted: 0,
        userReportPostsPending: 0,
        actionableTotal: 0,
      });
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    loadCaseCounts();
  }, [loadCaseCounts]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const counts = useMemo(
    () => ({
      total: pagination.total,
      ai: cases.filter(
        (item) => item.source === "ai" || item.source === "rulebase",
      ).length,
      userReports: cases.reduce(
        (sum, item) => sum + (Number(item.reportCount) || 0),
        0,
      ),
    }),
    [cases, pagination.total],
  );

  const handleAction = async (action, id) => {
    try {
      setActionLoading(true);
      setError("");
      if (action === "delete") await moderationService.deleteCase(id);
      if (action === "dismiss") await moderationService.dismissCase(id);
      if (action === "restore") await moderationService.restoreCase(id);
      if (cases.length === 1 && currentPage > 1) {
        setCurrentPage((page) => Math.max(page - 1, 1));
      } else {
        await loadCases();
      }
      await loadCaseCounts();
      window.dispatchEvent(new Event(MODERATION_COUNTS_REFRESH_EVENT));
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể cập nhật báo cáo.");
    } finally {
      setActionLoading(false);
    }
  };

  const requestConfirmAction = (action, item) => {
    setConfirmAction({
      action,
      id: getId(item._id),
      title: item.title || "Nội dung bình luận",
    });
  };

  const closeConfirmAction = () => {
    if (actionLoading) return;
    setConfirmAction(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    await handleAction(confirmAction.action, confirmAction.id);
    setConfirmAction(null);
  };

  const handleSettingChange = (key, value) => {
    setSettingsDraft((prev) => ({
      ...prev,
      [key]: key === "autoDeleteConfidenceThreshold" ? Number(value) : Number.parseInt(value, 10),
    }));
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    if (!settingsDraft) return;

    try {
      setSavingSettings(true);
      setError("");
      const response = await moderationService.updateSettings(settingsDraft);
      const savedSettings = unwrap(response);
      setSettings(savedSettings);
      setSettingsDraft(savedSettings);
      setIsEditingSettings(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể lưu cấu hình.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleEditSettings = () => {
    setSettingsDraft(settings);
    setIsEditingSettings(true);
  };

  const handleCancelSettings = () => {
    setSettingsDraft(settings);
    setIsEditingSettings(false);
  };

  const handleStatusChange = (status) => {
    setActiveStatus(status);
    if (status === "user_report_posts") setTargetType("");
    setCurrentPage(1);
  };

  const handleTargetTypeChange = (value) => {
    setTargetType(value);
    setCurrentPage(1);
  };

  const totalPage = Math.max(pagination.totalPage || 1, 1);
  const canGoPrevious = currentPage > 1 && !loading;
  const canGoNext = currentPage < totalPage && !loading;
  const isUserReportTab = activeStatus === "user_report_posts";

  return (
    <div className={cx("page")}>
      <header className={cx("header")}>
        <div>
          <h1>Báo cáo vi phạm</h1>
          <p>Theo dõi nội dung được AI hoặc người dùng đánh dấu trong cộng đồng.</p>
        </div>
        <button type="button" onClick={loadCases} disabled={loading}>
          <RefreshCw size={16} className={cx({ spinning: loading })} />
          <span>Làm mới</span>
        </button>
      </header>

      {error && <div className={cx("error")}>{error}</div>}

      <section className={cx("summary")}>
        <article>
          <ShieldAlert size={18} />
          <span>Tổng báo cáo</span>
          <strong>{counts.total}</strong>
        </article>
        <article>
          <span>AI</span>
          <strong>{counts.ai}</strong>
        </article>
        <article>
          <span>Người dùng báo cáo</span>
          <strong>{counts.userReports}</strong>
        </article>
      </section>

      <section className={cx("settingsPanel")}>
        <div className={cx("panelHeading")}>
          <Settings2 size={18} />
          <h2>Cấu hình batch</h2>
        </div>
        {settingsDraft && (
          <form onSubmit={handleSaveSettings} className={cx("settingsForm")}>
            <label>
              <span>Batch bài viết</span>
              <input
                type="number"
                min="1"
                max="50"
                value={settingsDraft.postBatchSize}
                disabled={!isEditingSettings}
                onChange={(event) =>
                  handleSettingChange("postBatchSize", event.target.value)
                }
              />
            </label>
            <label>
              <span>Batch bình luận</span>
              <input
                type="number"
                min="1"
                max="100"
                value={settingsDraft.commentBatchSize}
                disabled={!isEditingSettings}
                onChange={(event) =>
                  handleSettingChange("commentBatchSize", event.target.value)
                }
              />
            </label>
            <label>
              <span>Timeout giây</span>
              <input
                type="number"
                min="5"
                max="300"
                value={settingsDraft.batchTimeoutSeconds}
                disabled={!isEditingSettings}
                onChange={(event) =>
                  handleSettingChange("batchTimeoutSeconds", event.target.value)
                }
              />
            </label>
            <label>
              <span>Ngưỡng tự xóa</span>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={settingsDraft.autoDeleteConfidenceThreshold}
                disabled={!isEditingSettings}
                onChange={(event) =>
                  handleSettingChange(
                    "autoDeleteConfidenceThreshold",
                    event.target.value,
                  )
                }
              />
            </label>
            {!isEditingSettings ? (
              <button type="button" onClick={handleEditSettings}>
                Sửa cấu hình
              </button>
            ) : (
              <div className={cx("settingsActions")}>
                <button type="submit" disabled={savingSettings}>
                  {savingSettings ? "Đang lưu" : "Lưu"}
                </button>
                <button
                  type="button"
                  className={cx("secondary")}
                  onClick={handleCancelSettings}
                  disabled={savingSettings}
                >
                  Hủy
                </button>
              </div>
            )}
          </form>
        )}
      </section>

      <section className={cx("toolbar")}>
        <div className={cx("tabs")}>
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={cx({ active: activeStatus === tab.value })}
              onClick={() => handleStatusChange(tab.value)}
            >
              <span>{tab.label}</span>
              {tab.countKey && caseCounts[tab.countKey] > 0 && (
                <span className={cx("tabBadge")}>
                  {caseCounts[tab.countKey] > 99
                    ? "99+"
                    : caseCounts[tab.countKey]}
                </span>
              )}
            </button>
          ))}
        </div>
        <select
          value={targetType}
          onChange={(event) => handleTargetTypeChange(event.target.value)}
          disabled={isUserReportTab}
        >
          <option value="">Tất cả nội dung</option>
          <option value="post">Bài viết</option>
          <option value="comment">Bình luận</option>
          <option value="reply_comment">Trả lời bình luận</option>
        </select>
      </section>

      <section className={cx("cases")}>
        {loading ? (
          <div className={cx("empty")}>Đang tải báo cáo...</div>
        ) : cases.length === 0 ? (
          <div className={cx("empty")}>Không có báo cáo phù hợp.</div>
        ) : (
          cases.map((item) => {
            const id = getId(item._id);
            const isUserReport = item.source === "user_report";
            const latestReport = getLatestReport(item);
            const confidenceNumber = Number(item.confidence);
            const hasKnownConfidence =
              item.confidence !== null &&
              item.confidence !== undefined &&
              Number.isFinite(confidenceNumber);
            const confidence =
              !hasKnownConfidence
                ? "-"
                : confidenceNumber.toLocaleString("vi-VN", {
                    style: "percent",
                    maximumFractionDigits: 1,
                  });
            const postLink = getPostLink(item);

            return (
              <article key={id} className={cx("caseCard", item.status)}>
                <div className={cx("caseTop")}>
                  <div>
                    <div className={cx("badges")}>
                      <span>{targetTypeLabels[item.targetType]}</span>
                      <span>{isUserReport ? "Người dùng báo cáo" : "AI"}</span>
                      <span>{categoryLabels[item.category] || "Chưa phân loại"}</span>
                      {isUserReport ? (
                        <span>{Number(item.reportCount) || 0} lượt báo cáo</span>
                      ) : (
                        <span>Confidence {confidence}</span>
                      )}
                    </div>
                    <h2>{item.title || "Nội dung bình luận"}</h2>
                    <p>
                      {item.authorName || "Không rõ tác giả"} ·{" "}
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  {postLink && (
                    <Link
                      to={postLink}
                      state={{
                        fromAdminViolations: true,
                        returnTo: "/admin/violations",
                      }}
                      className={cx("viewLink")}
                    >
                      <Eye size={16} />
                      <span>Xem</span>
                    </Link>
                  )}
                </div>

                <blockquote>{item.contentSnapshot}</blockquote>

                <div className={cx("reason")}>
                  <strong>Lý do:</strong> {item.reason || "-"}
                </div>

                {isUserReport && latestReport && (
                  <div className={cx("reportDetail")}>
                    <strong>Báo cáo gần nhất:</strong>{" "}
                    {latestReport.reporterName || "Người dùng"} ·{" "}
                    {latestReport.subcategory || "Chưa rõ mục con"}
                    {latestReport.description ? ` · ${latestReport.description}` : ""}
                  </div>
                )}

                {item.matchedTerms?.length > 0 && (
                  <div className={cx("terms")}>
                    {item.matchedTerms.map((term) => (
                      <span key={term}>{term}</span>
                    ))}
                  </div>
                )}

                <div className={cx("actions")}>
                  {item.status === "pending" && (
                    <>
                      <button
                        type="button"
                        className={cx("danger")}
                        onClick={() => requestConfirmAction("delete", item)}
                      >
                        <Trash2 size={15} />
                        <span>Xóa mềm</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => requestConfirmAction("dismiss", item)}
                      >
                        <CheckCircle2 size={15} />
                        <span>Bỏ qua</span>
                      </button>
                    </>
                  )}
                  {(item.status === "auto_deleted" ||
                    item.status === "approved_deleted") && (
                    <button
                      type="button"
                      onClick={() => handleAction("restore", id)}
                    >
                      <RotateCcw size={15} />
                      <span>Khôi phục</span>
                    </button>
                  )}
                  {item.status === "auto_deleted" && (
                    <button
                      type="button"
                      onClick={() => handleAction("dismiss", id)}
                    >
                      <CheckCircle2 size={15} />
                      <span>Đã xem</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>

      <nav className={cx("pagination")} aria-label="Phân trang báo cáo vi phạm">
        <span>
          Tổng {pagination.total.toLocaleString("vi-VN")} báo cáo
        </span>
        <div>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={!canGoPrevious}
          >
            Trước
          </button>
          <strong>
            Trang {Math.min(currentPage, totalPage).toLocaleString("vi-VN")} /{" "}
            {totalPage.toLocaleString("vi-VN")}
          </strong>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPage))}
            disabled={!canGoNext}
          >
            Sau
          </button>
        </div>
      </nav>

      {confirmAction && (
        <div
          className={cx("confirmOverlay")}
          role="presentation"
          onMouseDown={closeConfirmAction}
        >
          <div
            className={cx("confirmDialog")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="violation-confirm-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="violation-confirm-title">
              {confirmAction.action === "delete"
                ? "Xác nhận xóa mềm"
                : "Xác nhận bỏ qua"}
            </h2>
            <p>
              {confirmAction.action === "delete"
                ? `Nội dung "${confirmAction.title}" sẽ bị xóa mềm và không còn hiển thị công khai.`
                : `Báo cáo "${confirmAction.title}" sẽ được đánh dấu là đã bỏ qua.`}
            </p>
            <div className={cx("confirmActions")}>
              <button
                type="button"
                className={cx("cancel")}
                onClick={closeConfirmAction}
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                className={cx({
                  confirmDanger: confirmAction.action === "delete",
                  confirmPrimary: confirmAction.action !== "delete",
                })}
                onClick={handleConfirmAction}
                disabled={actionLoading}
              >
                {actionLoading ? "Đang xử lý" : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Violations;
