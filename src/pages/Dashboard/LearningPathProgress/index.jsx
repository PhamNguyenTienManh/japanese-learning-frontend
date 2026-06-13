import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames/bind";

import styles from "./LearningPathProgress.module.scss";
import {
  applyLearningPathReview,
  getLearningPathDashboard,
  reviewLearningPath,
} from "~/services/learningPathService";

const cx = classNames.bind(styles);

const skillMeta = {
  vocab: { icon: "🔤", label: "Từ vựng" },
  grammar: { icon: "📝", label: "Ngữ pháp" },
  kanji: { icon: "🖊", label: "Kanji" },
  conversation: { icon: "🗣", label: "Hội thoại" },
  jlpt_exam: { icon: "📋", label: "Đề JLPT" },
  reading: { icon: "📖", label: "Đọc hiểu" },
  writing: { icon: "✍️", label: "Viết" },
};

const suggestionTypeLabels = {
  speed_up: "Có thể tăng tốc",
  slow_down: "Nên giảm tải",
  focus_skill: "Tập trung kỹ năng",
  add_review: "Thêm ôn tập",
};

const formatReviewDate = (value) => {
  if (!value) return "Chưa có đánh giá";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const getTaskHref = (task, level) => {
  const order = Number(task.order) || 1;
  const levelLower = String(level || "N5").toLowerCase();

  if (task.skill === "vocab") {
    return `/jlpt?type=word&level=${level}&tour=flashcard&lpSkill=vocab&lpOrder=${order}`;
  }
  if (task.skill === "kanji") {
    return `/jlpt?type=kanji&level=${level}&tour=flashcard&lpSkill=kanji&lpOrder=${order}`;
  }
  if (task.skill === "grammar") {
    return `/jlpt?type=grammar&level=${level}&tour=flashcard&lpSkill=grammar&lpOrder=${order}`;
  }
  if (task.skill === "jlpt_exam") {
    return `/practice/${levelLower}?tour=exam`;
  }
  if (task.skill === "conversation") return "/conversation?tour=conversation";
  if (task.skill === "reading") return "/reading?tour=reading";
  if (task.skill === "writing") return `/jlpt?type=kanji&level=${level}&writing=1&tour=writing`;

  return null;
};

function LearningPathProgress() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");
  const [reviewDismissed, setReviewDismissed] = useState(false);

  const loadProgress = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getLearningPathDashboard();
      setData(result);
      setError("");
    } catch (err) {
      console.error("Failed to load learning path progress:", err);
      setError("Không tải được tiến độ lộ trình.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const handleReview = async () => {
    try {
      setReviewLoading(true);
      setReviewError("");
      setApplyError("");
      setApplySuccess("");
      setReviewDismissed(false);
      const result = await reviewLearningPath();
      setData((current) => ({
        ...current,
        lastReview: result.lastReview,
        reviewStats: result.stats,
      }));
    } catch (err) {
      console.error("Failed to review learning path:", err);
      setReviewError(err?.message || "Hệ thống AI đánh giá lộ trình đang gặp lỗi. Vui lòng thử lại sau.");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleApplyReview = async () => {
    const confirmedItems = data?.lastReview?.adjustedWeeklyItems || [];
    if (!confirmedItems.length) {
      setApplyError("Không có điều chỉnh nào để áp dụng.");
      return;
    }

    try {
      setApplyLoading(true);
      setApplyError("");
      setApplySuccess("");
      const result = await applyLearningPathReview({ confirmedItems });
      setData(result);
      setReviewDismissed(true);
      setApplySuccess("Đã áp dụng điều chỉnh vào tuần tiếp theo.");
    } catch (err) {
      console.error("Failed to apply learning path review:", err);
      setApplyError(err?.message || "Không áp dụng được điều chỉnh. Vui lòng thử lại sau.");
    } finally {
      setApplyLoading(false);
    }
  };

  const weekTasks = data?.weekTasks || [];
  const weekProgress = data?.weekProgress || {};
  const weekPercent = Math.min(Math.max(Number(weekProgress.percent) || 0, 0), 100);
  const generationSource = data?.generationSource === "ai" ? "ai" : "fallback";
  const adjustedWeeklyItems = data?.lastReview?.adjustedWeeklyItems || [];
  const canApplyReview = adjustedWeeklyItems.length > 0 && !reviewDismissed;

  return (
    <main className={cx("wrapper")}>
      <div className={cx("container")}>
        <header className={cx("hero")}>
          <div className={cx("heroContent")}>
            <div className={cx("eyebrow")}>Lộ trình cá nhân</div>
            <h1 className={cx("title")}>Kế hoạch học tuần này</h1>
            <p className={cx("subtitle")}>
              Theo dõi các mục AI đã lên lịch, mức hoàn thành từng kỹ năng và bắt đầu bài học đúng nơi trong hệ thống.
            </p>
          </div>
          <button type="button" className={cx("regenerateBtn")} onClick={() => navigate("/onboarding")}>
            Tạo lại lộ trình
          </button>
        </header>

        {loading ? (
          <div className={cx("state")}>
            <span className={cx("stateSpinner")} />
            <strong>Đang tải tiến độ lộ trình...</strong>
            <p>Chúng tôi đang lấy kế hoạch học mới nhất của bạn.</p>
          </div>
        ) : error ? (
          <div className={cx("state")}>
            <strong>{error}</strong>
            <button type="button" className={cx("stateBtn")} onClick={loadProgress}>
              Thử lại
            </button>
          </div>
        ) : !data?.hasLearningPath ? (
          <div className={cx("state")}>
            <strong>Bạn chưa có lộ trình học.</strong>
            <p>Hãy tạo lộ trình cá nhân hóa để AI sắp xếp bài học phù hợp với mục tiêu của bạn.</p>
            <button type="button" className={cx("stateBtn")} onClick={() => navigate("/onboarding")}>
              Tạo lộ trình
            </button>
          </div>
        ) : (
          <>
            <section className={cx("overview")}>
              <div className={cx("summaryCard")}>
                <div className={cx("summaryLabel")}>Tuần hiện tại</div>
                <div className={cx("summaryValue")}>{weekProgress.week || 1}</div>
                <p className={cx("summaryHint")}>Cấp độ {data.level || "N5"}</p>
              </div>
              <div className={cx("summaryCard")}>
                <div className={cx("summaryLabel")}>Bài hoàn thành</div>
                <div className={cx("summaryValue")}>
                  {weekProgress.completed || 0}/{weekProgress.total || 0}
                </div>
                <p className={cx("summaryHint")}>Theo kế hoạch tuần</p>
              </div>
              <div className={cx("summaryCard", "progressSummary")}>
                <div className={cx("summaryLabel")}>Tiến độ tuần</div>
                <div className={cx("summaryValue")}>{weekPercent}%</div>
                <div className={cx("miniTrack")}>
                  <span style={{ width: `${weekPercent}%` }} />
                </div>
              </div>
            </section>

            <section className={cx("reviewPanel")}>
              <div className={cx("reviewHeader")}>
                <div>
                  <h2>Đánh giá lộ trình bằng AI</h2>
                  <p>Cập nhật sau 7–14 ngày học để biết nên tăng tốc, giảm tải hoặc tập trung kỹ năng nào.</p>
                </div>
                <button
                  type="button"
                  className={cx("reviewBtn")}
                  onClick={handleReview}
                  disabled={reviewLoading}
                >
                  {reviewLoading ? "Đang đánh giá..." : data?.lastReview ? "Đánh giá lại" : "Tạo đánh giá"}
                </button>
              </div>

              {reviewError && <div className={cx("reviewError")}>{reviewError}</div>}

              {data?.lastReview ? (
                <div className={cx("reviewBody")}>
                  <div className={cx("reviewMetaRow")}>
                    <div className={cx("reviewMeta")}>Lần đánh giá gần nhất: {formatReviewDate(data.lastReview.reviewedAt)}</div>
                    {typeof data.lastReview.onTrack === "boolean" && (
                      <span className={cx("reviewStatus", { reviewStatusWarning: !data.lastReview.onTrack })}>
                        {data.lastReview.onTrack ? "Đúng tiến độ" : "Cần điều chỉnh"}
                      </span>
                    )}
                  </div>
                  <p className={cx("assessment")}>{data.lastReview.assessment}</p>
                  {data.lastReview.suggestions?.length > 0 && (
                    <div className={cx("suggestionList")}>
                      {data.lastReview.suggestions.map((suggestion, index) => (
                        <article key={`${suggestion.type}-${suggestion.skill || index}`} className={cx("suggestionCard")}>
                          <div className={cx("suggestionTitle")}>
                            {suggestionTypeLabels[suggestion.type] || "Gợi ý"}
                            {suggestion.skill && skillMeta[suggestion.skill]?.label ? ` · ${skillMeta[suggestion.skill].label}` : ""}
                          </div>
                          <p>{suggestion.reason}</p>
                        </article>
                      ))}
                    </div>
                  )}

                  {adjustedWeeklyItems.length > 0 && (
                    <div className={cx("adjustedBlock")}>
                      <div className={cx("adjustedTitle")}>Điều chỉnh đề xuất cho tuần tiếp theo</div>
                      <div className={cx("adjustedList")}>
                        {adjustedWeeklyItems.map((item, index) => (
                          <div key={`${item.skill}-${item.order || index}`} className={cx("adjustedItem")}>
                            <span>{skillMeta[item.skill]?.label || item.skill}</span>
                            <strong>{item.title}</strong>
                            <small>{item.targetCount || 1} mục · {item.estimatedMinutes || 15} phút</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {applyError && <div className={cx("reviewError")}>{applyError}</div>}
                  {applySuccess && <div className={cx("applySuccess")}>{applySuccess}</div>}

                  {canApplyReview && (
                    <div className={cx("reviewActions")}>
                      <button
                        type="button"
                        className={cx("reviewBtn")}
                        onClick={handleApplyReview}
                        disabled={applyLoading}
                      >
                        {applyLoading ? "Đang áp dụng..." : "Áp dụng điều chỉnh"}
                      </button>
                      <button
                        type="button"
                        className={cx("keepBtn")}
                        onClick={() => {
                          setReviewDismissed(true);
                          setApplyError("");
                          setApplySuccess("Đã giữ nguyên lộ trình hiện tại.");
                        }}
                        disabled={applyLoading}
                      >
                        Giữ nguyên lộ trình
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={cx("reviewEmpty")}>
                  Chưa có đánh giá nào. Khi bạn đã học được vài ngày, hãy tạo đánh giá để AI đề xuất điều chỉnh phù hợp.
                </div>
              )}
            </section>

            <section className={cx("panel")}>
              <div className={cx("panelHeader")}>
                <div>
                  <h2>Nhiệm vụ học tập</h2>
                  <p>{weekTasks.length} mục được AI đề xuất cho tuần này</p>
                </div>
                <div className={cx("panelBadges")}>
                  <span className={cx("panelBadge", { fallbackBadge: generationSource === "fallback" })}>
                    {generationSource === "ai" ? "Tạo bởi AI" : "Kế hoạch dự phòng"}
                  </span>
                  <span className={cx("panelBadge")}>{weekPercent}% hoàn thành</span>
                </div>
              </div>

              {weekTasks.length === 0 ? (
                <div className={cx("emptyTasks")}>
                  Tuần này chưa có mục học nào trong lộ trình.
                </div>
              ) : (
                <div className={cx("taskList")}>
                  {weekTasks.map((task) => {
                    const meta = skillMeta[task.skill] || { icon: "📌", label: task.skill };
                    const progress = task.progress || {
                      count: task.completedAt ? task.targetCount || 1 : 0,
                      target: task.targetCount || 1,
                      percent: task.completedAt ? 100 : 0,
                      label: `${task.completedAt ? task.targetCount || 1 : 0}/${task.targetCount || 1} mục`,
                    };
                    const progressPercent = Math.min(Math.max(Number(progress.percent) || 0, 0), 100);
                    const href = getTaskHref(task, data.level);
                    const isDone = Boolean(task.completedAt || progress.isComplete);

                    return (
                      <article key={`${task.skill}-${task.order}`} className={cx("taskCard")}>
                        <div className={cx("taskTop")}>
                          <span className={cx("icon")}>{meta.icon}</span>
                          <div className={cx("taskInfo")}>
                            <div className={cx("taskLabelRow")}>
                              <span>{meta.label}</span>
                              <span>{task.estimatedMinutes || 15} phút</span>
                            </div>
                            <h3 className={cx("taskTitle")}>{task.title || meta.label}</h3>
                            <p className={cx("taskMeta")}>
                              {progress.requirement || progress.label}
                            </p>
                          </div>
                          <span className={cx("badge", { badgeDone: isDone })}>
                            {isDone ? "Hoàn thành" : `${progressPercent}%`}
                          </span>
                        </div>

                        <div className={cx("progressBlock")}>
                          <div className={cx("progressMeta")}>
                            <span>{progress.label}</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className={cx("progressTrack")}>
                            <div
                              className={cx("progressFill", { progressFillDone: isDone })}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          {progress.latestScore !== null && progress.latestScore !== undefined && (
                            <p className={cx("scoreNote")}>Điểm cao nhất tuần này: {progress.latestScore}</p>
                          )}
                        </div>

                        {href && (
                          <div className={cx("taskActions")}>
                            <button type="button" className={cx("startBtn")} onClick={() => navigate(href)}>
                              {isDone ? "Tiếp tục luyện" : "Bắt đầu học"}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default LearningPathProgress;


