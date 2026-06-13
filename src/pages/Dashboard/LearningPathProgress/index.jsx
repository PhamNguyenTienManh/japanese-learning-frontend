import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  applyLearningPathReview,
  getLearningPathDashboard,
  reviewLearningPath,
} from "~/services/learningPathService";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const wrapperClass = "min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(0,135,154,0.12),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(252,95,0,0.08),transparent_28%),linear-gradient(180deg,#f0fbf7_0%,#f7fbfb_52%,#ffffff_100%)] px-5 pt-8 pb-16 max-[780px]:px-3.5 max-[780px]:pt-5 max-[780px]:pb-11";
const containerClass = "mx-auto w-[min(1120px,100%)]";
const heroClass = "relative mb-[22px] flex items-center justify-between gap-6 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.26)] bg-[linear-gradient(135deg,var(--primary)_0%,#006d7d_100%)] p-[30px] shadow-[0_22px_52px_rgba(0,109,125,0.18)] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_86%_18%,rgba(255,255,255,0.16),transparent_28%),linear-gradient(90deg,rgba(255,255,255,0.08),transparent_56%)] before:content-[''] max-[780px]:flex-col max-[780px]:items-stretch max-[780px]:p-6 max-[480px]:rounded-2xl";
const heroContentClass = "relative z-[1] max-w-[720px]";
const eyebrowClass = "inline-flex min-h-7 items-center rounded-full border border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.14)] px-3 text-xs font-black uppercase tracking-[0.08em] text-white";
const titleClass = "my-0 mt-3.5 mb-2 text-[clamp(28px,4vw,42px)] leading-[1.08] tracking-normal text-white max-[480px]:text-[28px]";
const subtitleClass = "m-0 max-w-[640px] text-[15px] font-semibold leading-[1.7] text-[rgba(255,255,255,0.82)]";
const baseButtonClass = "min-h-[42px] cursor-pointer rounded-[10px] border-0 px-4 font-black transition-[transform,box-shadow,background] duration-150 ease-[ease] hover:-translate-y-px";
const regenerateBtnClass = cn(baseButtonClass, "relative z-[1] shrink-0 bg-white text-primary shadow-[0_14px_28px_rgba(0,0,0,0.12)] max-[780px]:w-full");
const overviewClass = "mb-[18px] grid grid-cols-3 gap-3.5 max-[780px]:grid-cols-1";
const cardShellClass = "rounded-2xl border border-[#edf2f4] bg-[rgba(255,255,255,0.92)] shadow-[0_18px_46px_rgba(16,42,45,0.08)]";
const summaryCardClass = cn(cardShellClass, "min-h-[132px] p-5 max-[480px]:rounded-[14px]");
const summaryLabelClass = "text-xs font-black uppercase tracking-[0.04em] text-grey";
const summaryValueClass = "mt-2 text-[34px] font-[950] leading-none text-text-high";
const summaryHintClass = "mt-2 mb-0 text-[13px] font-bold text-grey";
const progressSummaryClass = "bg-[linear-gradient(135deg,rgba(0,135,154,0.08),rgba(0,135,154,0.02)),#ffffff]";
const miniTrackClass = "mt-4 h-[9px] overflow-hidden rounded-full bg-[#e8edf0]";
const progressGradientClass = "block h-full rounded-[inherit] bg-[linear-gradient(90deg,var(--primary),var(--primary-hover))]";
const panelClass = cn(cardShellClass, "p-[22px] max-[780px]:p-[18px] max-[480px]:rounded-[14px]");
const reviewPanelClass = cn(panelClass, "mb-[18px]");
const reviewHeaderClass = "mb-4 flex items-start justify-between gap-4";
const sectionTitleClass = "m-0 text-xl leading-[1.25] text-text-high";
const sectionDescriptionClass = "mt-1 mb-0 max-w-[640px] text-[13px] font-bold leading-[1.6] text-grey";
const reviewBtnClass = "min-h-10 shrink-0 cursor-pointer rounded-[10px] border-0 bg-primary px-[15px] font-black text-white shadow-[0_10px_24px_rgba(0,135,154,0.18)] transition-[transform,background,opacity] duration-150 ease-[ease] hover:not-disabled:-translate-y-px hover:not-disabled:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-[0.68]";
const reviewBodyClass = "grid gap-3";
const reviewMetaRowClass = "flex items-center justify-between gap-2.5";
const reviewMetaClass = "text-xs font-black text-grey";
const reviewStatusClass = "inline-flex min-h-7 items-center whitespace-nowrap rounded-full bg-[rgba(16,185,129,0.12)] px-[11px] text-xs font-[950] text-[#047857]";
const reviewStatusWarningClass = "bg-[rgba(252,95,0,0.1)] text-[#b94600]";
const assessmentClass = "m-0 text-[15px] font-bold leading-[1.7] text-text-high";
const suggestionListClass = "grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2.5";
const suggestionCardClass = "rounded-xl border border-[rgba(0,135,154,0.12)] bg-[rgba(0,135,154,0.04)] p-[13px]";
const suggestionTitleClass = "text-xs font-[950] uppercase tracking-[0.03em] text-primary";
const suggestionTextClass = "mt-1.5 mb-0 text-[13px] font-bold leading-[1.55] text-grey";
const adjustedBlockClass = "grid gap-2.5 rounded-[14px] bg-[#f8fafb] p-3.5";
const adjustedTitleClass = "text-[13px] font-[950] text-text-high";
const adjustedListClass = "grid gap-2";
const adjustedItemClass = "grid gap-[3px] rounded-[11px] border border-[#e7eef0] bg-white p-[11px]";
const adjustedSkillClass = "text-[11px] font-[950] uppercase tracking-[0.04em] text-primary";
const adjustedItemTitleClass = "text-sm leading-[1.35] text-text-high";
const adjustedMetaClass = "text-xs font-extrabold text-grey";
const reviewActionsClass = "flex flex-wrap justify-end gap-2.5";
const keepBtnClass = "min-h-10 cursor-pointer rounded-[10px] border border-[#dbe7ea] bg-white px-[15px] font-black text-text-high transition-[transform,border-color,color,opacity] duration-150 ease-[ease] hover:not-disabled:-translate-y-px hover:not-disabled:border-[rgba(0,135,154,0.35)] hover:not-disabled:text-primary disabled:cursor-not-allowed disabled:opacity-[0.68]";
const messageBoxBaseClass = "rounded-xl p-3.5 text-[13px] font-bold leading-[1.6]";
const reviewEmptyClass = cn(messageBoxBaseClass, "bg-[#f8fafb] text-grey");
const reviewErrorClass = cn(messageBoxBaseClass, "mb-3 bg-[rgba(252,95,0,0.1)] text-[#b94600]");
const applySuccessClass = cn(messageBoxBaseClass, "bg-[rgba(16,185,129,0.12)] text-[#047857]");
const panelHeaderClass = "mb-[18px] flex items-start justify-between gap-4 max-[780px]:flex-col";
const panelBadgesClass = "flex flex-wrap justify-end gap-2";
const pillBaseClass = "inline-flex items-center justify-center whitespace-nowrap rounded-full text-xs font-black";
const panelBadgeClass = cn(pillBaseClass, "min-h-[30px] bg-[rgba(0,135,154,0.08)] px-3 text-primary");
const fallbackBadgeClass = "bg-[rgba(252,95,0,0.1)] text-[#b94600]";
const taskListClass = "grid gap-3";
const taskCardClass = "rounded-[14px] border border-[#e7eef0] bg-white p-[18px] transition-[border-color,box-shadow,transform] duration-150 ease-[ease] hover:-translate-y-px hover:border-[rgba(0,135,154,0.28)] hover:shadow-[0_16px_32px_rgba(16,42,45,0.08)]";
const taskTopClass = "grid grid-cols-[52px_minmax(0,1fr)_auto] items-start gap-3.5 max-[780px]:flex max-[780px]:flex-wrap max-[780px]:items-start";
const iconClass = "inline-flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,rgba(0,135,154,0.12),rgba(0,135,154,0.04))] text-[23px]";
const taskInfoClass = "min-w-0 max-[780px]:flex-[1_1_220px]";
const taskLabelRowClass = "mb-1.5 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.04em] text-primary";
const taskTitleClass = "m-0 text-[17px] font-[950] leading-[1.35] text-text-high";
const taskMetaClass = "mt-[5px] mb-0 text-[13px] font-bold leading-normal text-grey";
const badgeClass = cn(pillBaseClass, "min-h-[30px] bg-[rgba(0,135,154,0.08)] px-2.5 text-primary max-[780px]:ml-[66px] max-[480px]:ml-0");
const badgeDoneClass = "bg-[rgba(16,185,129,0.12)] text-[#047857]";
const progressBlockClass = "mt-4 rounded-xl bg-[#f8fafb] p-[13px]";
const progressMetaClass = "mb-2 flex justify-between gap-3 text-xs font-black text-grey";
const progressTrackClass = "h-[9px] overflow-hidden rounded-full bg-[#e4ebee]";
const progressFillClass = "h-full rounded-[inherit] bg-[linear-gradient(90deg,var(--primary),var(--primary-hover))] transition-[width] duration-[240ms] ease-[ease]";
const progressFillDoneClass = "bg-[linear-gradient(90deg,#10b981,#34d399)]";
const taskActionsClass = "mt-3.5 flex justify-end max-[780px]:justify-stretch";
const startBtnClass = cn(baseButtonClass, "bg-primary text-white shadow-[0_10px_24px_rgba(0,135,154,0.18)] hover:bg-primary-hover max-[780px]:w-full");
const stateClass = "grid justify-items-center gap-2.5 rounded-2xl border border-dashed border-[#dce7e8] bg-[rgba(255,255,255,0.9)] px-[22px] py-[34px] text-center font-bold text-grey shadow-[0_14px_34px_rgba(16,42,45,0.06)]";
const emptyTasksClass = stateClass;
const stateTitleClass = "text-base text-text-high";
const stateTextClass = "m-0 max-w-[520px] leading-[1.6]";
const stateBtnClass = cn(baseButtonClass, "bg-primary text-white shadow-[0_10px_24px_rgba(0,135,154,0.18)] hover:bg-primary-hover");
const stateSpinnerClass = "h-[34px] w-[34px] animate-spin rounded-full border-[3px] border-[rgba(0,135,154,0.15)] border-t-primary";

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
    <main className={wrapperClass}>
      <div className={containerClass}>
        <header className={heroClass}>
          <div className={heroContentClass}>
            <div className={eyebrowClass}>Lộ trình cá nhân</div>
            <h1 className={titleClass}>Kế hoạch học tuần này</h1>
            <p className={subtitleClass}>
              Theo dõi các mục AI đã lên lịch, mức hoàn thành từng kỹ năng và bắt đầu bài học đúng nơi trong hệ thống.
            </p>
          </div>
          <button type="button" className={regenerateBtnClass} onClick={() => navigate("/onboarding")}>
            Tạo lại lộ trình
          </button>
        </header>

        {loading ? (
          <div className={stateClass}>
            <span className={stateSpinnerClass} />
            <strong className={stateTitleClass}>Đang tải tiến độ lộ trình...</strong>
            <p className={stateTextClass}>Chúng tôi đang lấy kế hoạch học mới nhất của bạn.</p>
          </div>
        ) : error ? (
          <div className={stateClass}>
            <strong className={stateTitleClass}>{error}</strong>
            <button type="button" className={stateBtnClass} onClick={loadProgress}>
              Thử lại
            </button>
          </div>
        ) : !data?.hasLearningPath ? (
          <div className={stateClass}>
            <strong className={stateTitleClass}>Bạn chưa có lộ trình học.</strong>
            <p className={stateTextClass}>Hãy tạo lộ trình cá nhân hóa để AI sắp xếp bài học phù hợp với mục tiêu của bạn.</p>
            <button type="button" className={stateBtnClass} onClick={() => navigate("/onboarding")}>
              Tạo lộ trình
            </button>
          </div>
        ) : (
          <>
            <section className={overviewClass}>
              <div className={summaryCardClass}>
                <div className={summaryLabelClass}>Tuần hiện tại</div>
                <div className={summaryValueClass}>{weekProgress.week || 1}</div>
                <p className={summaryHintClass}>Cấp độ {data.level || "N5"}</p>
              </div>
              <div className={summaryCardClass}>
                <div className={summaryLabelClass}>Bài hoàn thành</div>
                <div className={summaryValueClass}>
                  {weekProgress.completed || 0}/{weekProgress.total || 0}
                </div>
                <p className={summaryHintClass}>Theo kế hoạch tuần</p>
              </div>
              <div className={cn(summaryCardClass, progressSummaryClass)}>
                <div className={summaryLabelClass}>Tiến độ tuần</div>
                <div className={summaryValueClass}>{weekPercent}%</div>
                <div className={miniTrackClass}>
                  <span className={progressGradientClass} style={{ width: `${weekPercent}%` }} />
                </div>
              </div>
            </section>

            <section className={reviewPanelClass}>
              <div className={reviewHeaderClass}>
                <div>
                  <h2 className={sectionTitleClass}>Đánh giá lộ trình bằng AI</h2>
                  <p className={sectionDescriptionClass}>Cập nhật sau 7–14 ngày học để biết nên tăng tốc, giảm tải hoặc tập trung kỹ năng nào.</p>
                </div>
                <button
                  type="button"
                  className={reviewBtnClass}
                  onClick={handleReview}
                  disabled={reviewLoading}
                >
                  {reviewLoading ? "Đang đánh giá..." : data?.lastReview ? "Đánh giá lại" : "Tạo đánh giá"}
                </button>
              </div>

              {reviewError && <div className={reviewErrorClass}>{reviewError}</div>}

              {data?.lastReview ? (
                <div className={reviewBodyClass}>
                  <div className={reviewMetaRowClass}>
                    <div className={reviewMetaClass}>Lần đánh giá gần nhất: {formatReviewDate(data.lastReview.reviewedAt)}</div>
                    {typeof data.lastReview.onTrack === "boolean" && (
                      <span className={cn(reviewStatusClass, !data.lastReview.onTrack && reviewStatusWarningClass)}>
                        {data.lastReview.onTrack ? "Đúng tiến độ" : "Cần điều chỉnh"}
                      </span>
                    )}
                  </div>
                  <p className={assessmentClass}>{data.lastReview.assessment}</p>
                  {data.lastReview.suggestions?.length > 0 && (
                    <div className={suggestionListClass}>
                      {data.lastReview.suggestions.map((suggestion, index) => (
                        <article key={`${suggestion.type}-${suggestion.skill || index}`} className={suggestionCardClass}>
                          <div className={suggestionTitleClass}>
                            {suggestionTypeLabels[suggestion.type] || "Gợi ý"}
                            {suggestion.skill && skillMeta[suggestion.skill]?.label ? ` · ${skillMeta[suggestion.skill].label}` : ""}
                          </div>
                          <p className={suggestionTextClass}>{suggestion.reason}</p>
                        </article>
                      ))}
                    </div>
                  )}

                  {adjustedWeeklyItems.length > 0 && (
                    <div className={adjustedBlockClass}>
                      <div className={adjustedTitleClass}>Điều chỉnh đề xuất cho tuần tiếp theo</div>
                      <div className={adjustedListClass}>
                        {adjustedWeeklyItems.map((item, index) => (
                          <div key={`${item.skill}-${item.order || index}`} className={adjustedItemClass}>
                            <span className={adjustedSkillClass}>{skillMeta[item.skill]?.label || item.skill}</span>
                            <strong className={adjustedItemTitleClass}>{item.title}</strong>
                            <small className={adjustedMetaClass}>{item.targetCount || 1} mục · {item.estimatedMinutes || 15} phút</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {applyError && <div className={reviewErrorClass}>{applyError}</div>}
                  {applySuccess && <div className={applySuccessClass}>{applySuccess}</div>}

                  {canApplyReview && (
                    <div className={reviewActionsClass}>
                      <button
                        type="button"
                        className={reviewBtnClass}
                        onClick={handleApplyReview}
                        disabled={applyLoading}
                      >
                        {applyLoading ? "Đang áp dụng..." : "Áp dụng điều chỉnh"}
                      </button>
                      <button
                        type="button"
                        className={keepBtnClass}
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
                <div className={reviewEmptyClass}>
                  Chưa có đánh giá nào. Khi bạn đã học được vài ngày, hãy tạo đánh giá để AI đề xuất điều chỉnh phù hợp.
                </div>
              )}
            </section>

            <section className={panelClass}>
              <div className={panelHeaderClass}>
                <div>
                  <h2 className={sectionTitleClass}>Nhiệm vụ học tập</h2>
                  <p className="mt-1 mb-0 text-[13px] font-bold text-grey">{weekTasks.length} mục được AI đề xuất cho tuần này</p>
                </div>
                <div className={panelBadgesClass}>
                  <span className={cn(panelBadgeClass, generationSource === "fallback" && fallbackBadgeClass)}>
                    {generationSource === "ai" ? "Tạo bởi AI" : "Kế hoạch dự phòng"}
                  </span>
                  <span className={panelBadgeClass}>{weekPercent}% hoàn thành</span>
                </div>
              </div>

              {weekTasks.length === 0 ? (
                <div className={emptyTasksClass}>
                  Tuần này chưa có mục học nào trong lộ trình.
                </div>
              ) : (
                <div className={taskListClass}>
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
                      <article key={`${task.skill}-${task.order}`} className={taskCardClass}>
                        <div className={taskTopClass}>
                          <span className={iconClass}>{meta.icon}</span>
                          <div className={taskInfoClass}>
                            <div className={taskLabelRowClass}>
                              <span>{meta.label}</span>
                              <span>{task.estimatedMinutes || 15} phút</span>
                            </div>
                            <h3 className={taskTitleClass}>{task.title || meta.label}</h3>
                            <p className={taskMetaClass}>
                              {progress.requirement || progress.label}
                            </p>
                          </div>
                          <span className={cn(badgeClass, isDone && badgeDoneClass)}>
                            {isDone ? "Hoàn thành" : `${progressPercent}%`}
                          </span>
                        </div>

                        <div className={progressBlockClass}>
                          <div className={progressMetaClass}>
                            <span>{progress.label}</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <div className={progressTrackClass}>
                            <div
                              className={cn(progressFillClass, isDone && progressFillDoneClass)}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          {progress.latestScore !== null && progress.latestScore !== undefined && (
                            <p className={taskMetaClass}>Điểm cao nhất tuần này: {progress.latestScore}</p>
                          )}
                        </div>

                        {href && (
                          <div className={taskActionsClass}>
                            <button type="button" className={startBtnClass} onClick={() => navigate(href)}>
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
