import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames/bind";
import { AlertTriangle, ArrowLeft, Check, X } from "lucide-react";

import moderationService from "~/services/moderationService";
import { useToast } from "~/context/ToastContext";
import styles from "./ReportPostModal.module.scss";

const cx = classNames.bind(styles);

export const REPORT_REASONS = [
  {
    value: "spam_advertising",
    label: "Spam / quảng cáo",
    options: ["Quảng cáo không liên quan", "Link lừa đảo", "Lặp nội dung"],
  },
  {
    value: "abusive_language",
    label: "Thô tục / xúc phạm",
    options: ["Công kích cá nhân", "Kỳ thị/thù ghét", "Đe dọa/quấy rối"],
  },
  {
    value: "off_topic",
    label: "Không liên quan",
    options: ["Sai chủ đề học tiếng Nhật", "Gây nhiễu", "Nội dung rác"],
  },
  {
    value: "language_misinformation",
    label: "Sai lệch ngôn ngữ",
    options: [
      "Giải thích/dịch sai nghiêm trọng",
      "Thông tin học tập gây hiểu nhầm",
      "Mạo danh chuyên môn",
    ],
  },
  {
    value: "nsfw",
    label: "Nhạy cảm / NSFW",
    options: ["Nội dung người lớn", "Bạo lực/ghê rợn", "Hình ảnh không phù hợp"],
  },
  {
    value: "manipulation",
    label: "Thao túng / giả mạo",
    options: ["Giả mạo admin/giáo viên", "Kêu gọi thao túng like/vote", "Lừa đảo"],
  },
];

function ReportPostModal({ postId, commentId, targetLabel = "bài viết", onClose }) {
  const { addToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const category = useMemo(
    () => REPORT_REASONS.find((item) => item.value === selectedCategory),
    [selectedCategory],
  );

  const handleSelectCategory = (value) => {
    setSelectedCategory(value);
    setSelectedSubcategory("");
    setError("");
  };

  const handleBack = () => {
    setSelectedCategory("");
    setSelectedSubcategory("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !selectedSubcategory) {
      setError("Vui lòng chọn mục vi phạm cụ thể.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const payload = {
        category: selectedCategory,
        subcategory: selectedSubcategory,
        description: description.trim(),
      };
      if (commentId) {
        await moderationService.reportComment(commentId, payload);
      } else {
        await moderationService.reportPost(postId, payload);
      }
      addToast(`Báo cáo ${targetLabel} thành công`, "success");
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể gửi báo cáo. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={cx("overlay")} role="presentation" onMouseDown={onClose}>
      <section
        className={cx("dialog")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-post-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={cx("header")}>
          {selectedCategory ? (
            <button type="button" className={cx("iconButton")} onClick={handleBack}>
              <ArrowLeft size={18} />
            </button>
          ) : (
            <span className={cx("headerIcon")}>
              <AlertTriangle size={18} />
            </span>
          )}
          <h2 id="report-post-title">Báo cáo vi phạm</h2>
          <button type="button" className={cx("iconButton")} onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        {!selectedCategory ? (
          <div className={cx("reasonList")}>
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason.value}
                type="button"
                onClick={() => handleSelectCategory(reason.value)}
              >
                <span>{reason.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className={cx("detailStep")}>
            <div className={cx("selectedReason")}>{category?.label}</div>
            <div className={cx("subReasonList")}>
              {category?.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={cx({ selected: selectedSubcategory === option })}
                  onClick={() => setSelectedSubcategory(option)}
                >
                  <span>{option}</span>
                  {selectedSubcategory === option && <Check size={16} />}
                </button>
              ))}
            </div>
            <label className={cx("description")}>
              <span>Mô tả thêm</span>
              <textarea
                value={description}
                maxLength={500}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={`Bạn có thể ghi thêm chi tiết để admin kiểm tra ${targetLabel} nhanh hơn.`}
              />
            </label>
            {error && <div className={cx("error")}>{error}</div>}
            <button
              type="button"
              className={cx("submit")}
              onClick={handleSubmit}
              disabled={submitting || !selectedSubcategory}
            >
              {submitting ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}

export default ReportPostModal;
