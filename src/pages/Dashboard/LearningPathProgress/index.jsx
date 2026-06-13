import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  applyLearningPathReview,
  getLearningPathDashboard,
  reviewLearningPath,
} from "~/services/learningPathService";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const wrapperClass = "min-h-screen bg-[radial-gradient(circle_at_14%_8%,rgba(0,135,154,0.14),transparent_30%),radial-gradient(circle_at_86%_10%,rgba(252,95,0,0.1),transparent_26%),linear-gradient(180deg,#f0fbf7_0%,#f8fbfb_54%,#ffffff_100%)] px-5 pt-8 pb-16 max-[780px]:px-3.5 max-[780px]:pt-5 max-[780px]:pb-11";
const containerClass = "mx-auto w-[min(1120px,100%)]";
const topBarClass = "mb-5 flex items-center justify-between gap-5 rounded-[24px] border border-white/70 bg-[rgba(255,255,255,0.78)] p-5 shadow-[0_18px_48px_rgba(16,42,45,0.08)] backdrop-blur-[14px] max-[780px]:flex-col max-[780px]:items-stretch max-[480px]:rounded-[18px]";
const eyebrowClass = "mb-2 inline-flex min-h-7 items-center rounded-full bg-[rgba(0,135,154,0.1)] px-3 text-xs font-black uppercase tracking-[0.08em] text-primary";
const titleClass = "m-0 text-[clamp(30px,4.8vw,48px)] font-[950] leading-[1.05] tracking-[-0.03em] text-text-high";
const subtitleClass = "mt-2 mb-0 max-w-[680px] text-[15px] font-bold leading-[1.7] text-grey";
const baseButtonClass = "min-h-[42px] cursor-pointer rounded-[12px] border-0 px-4 font-black transition-[transform,box-shadow,background,border-color,color,opacity] duration-150 ease-[ease] hover:not-disabled:-translate-y-px disabled:cursor-not-allowed disabled:opacity-[0.68]";
const regenerateBtnClass = cn(baseButtonClass, "shrink-0 bg-white text-primary shadow-[0_12px_28px_rgba(0,135,154,0.12)] ring-1 ring-[rgba(0,135,154,0.12)] hover:bg-[rgba(0,135,154,0.06)] max-[780px]:w-full");
const mainGridClass = "grid grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)] gap-5 max-[980px]:grid-cols-1";
const cardShellClass = "rounded-[24px] border border-[#edf2f4] bg-[rgba(255,255,255,0.94)] shadow-[0_18px_46px_rgba(16,42,45,0.08)] max-[480px]:rounded-[18px]";
const todayCardClass = cn(cardShellClass, "relative overflow-hidden p-6 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-[linear-gradient(90deg,var(--primary),var(--orange))] max-[780px]:p-5");
const sideStackClass = "grid content-start gap-5";
const panelClass = cn(cardShellClass, "p-5 max-[780px]:p-[18px]");
const sectionHeaderClass = "mb-4 flex items-start justify-between gap-4 max-[640px]:flex-col";
const sectionTitleClass = "m-0 text-[22px] font-[950] leading-[1.2] tracking-[-0.01em] text-text-high";
const sectionDescriptionClass = "mt-1.5 mb-0 max-w-[640px] text-[13px] font-bold leading-[1.65] text-grey";
const pillBaseClass = "inline-flex min-h-[30px] items-center justify-center whitespace-nowrap rounded-full px-3 text-xs font-black";
const panelBadgeClass = cn(pillBaseClass, "bg-[rgba(0,135,154,0.08)] text-primary");
const fallbackBadgeClass = "bg-[rgba(252,95,0,0.1)] text-[#b94600]";
const todayListClass = "grid gap-3.5";
const weekListClass = "grid gap-3";
const todayTaskClass = "rounded-[20px] border border-[rgba(0,135,154,0.12)] bg-[linear-gradient(135deg,#ffffff_0%,#f7fcfb_100%)] p-5 shadow-[0_14px_30px_rgba(16,42,45,0.07)] transition-[border-color,box-shadow,transform] duration-150 ease-[ease] hover:-translate-y-px hover:border-[rgba(0,135,154,0.28)] hover:shadow-[0_18px_38px_rgba(16,42,45,0.1)]";
const weekTaskClass = "rounded-[16px] border border-[#e7eef0] bg-white p-4 transition-[border-color,box-shadow,transform] duration-150 ease-[ease] hover:-translate-y-px hover:border-[rgba(0,135,154,0.24)] hover:shadow-[0_14px_28px_rgba(16,42,45,0.07)]";
const taskTopClass = "flex items-start justify-between gap-4 max-[640px]:flex-col";
const taskSkillClass = "mb-2 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.05em] text-primary";
const skillMarkClass = "text-lg leading-none";
const taskTitleClass = "m-0 text-[18px] font-[950] leading-[1.35] text-text-high";
const weekTaskTitleClass = "m-0 text-base font-[950] leading-[1.35] text-text-high";
const taskMetaClass = "mt-1.5 mb-0 text-[13px] font-bold leading-[1.55] text-grey";
const timeBadgeClass = cn(pillBaseClass, "bg-[rgba(252,95,0,0.1)] text-[#b94600]");
const doneBadgeClass = "bg-[rgba(16,185,129,0.12)] text-[#047857]";
const progressBlockClass = "mt-4 rounded-[14px] bg-[#f8fafb] p-3.5";
const progressMetaClass = "mb-2 flex justify-between gap-3 text-xs font-black text-grey";
const progressTrackClass = "h-[9px] overflow-hidden rounded-full bg-[#e4ebee]";
const progressFillClass = "h-full rounded-[inherit] bg-[linear-gradient(90deg,var(--primary),var(--primary-hover))] transition-[width] duration-[240ms] ease-[ease]";
const progressFillDoneClass = "bg-[linear-gradient(90deg,#10b981,#34d399)]";
const taskActionsClass = "mt-4 flex justify-end max-[640px]:justify-stretch";
const startBtnClass = cn(baseButtonClass, "bg-primary text-white shadow-[0_10px_24px_rgba(0,135,154,0.18)] hover:bg-primary-hover max-[640px]:w-full");
const progressPanelClass = cn(panelClass, "bg-[linear-gradient(135deg,rgba(0,135,154,0.08),rgba(252,95,0,0.04)),#ffffff]");
const statsGridClass = "grid grid-cols-3 gap-2.5";
const statBoxClass = "rounded-[16px] bg-white/80 p-3 text-center ring-1 ring-[#edf2f4]";
const statLabelClass = "text-[11px] font-black uppercase tracking-[0.05em] text-grey";
const statValueClass = "mt-1 text-2xl font-[950] leading-none text-text-high";
const weeklyTrackClass = "mt-4 h-3 overflow-hidden rounded-full bg-white ring-1 ring-[#e1ecee]";
const weeklyFillClass = "block h-full rounded-[inherit] bg-[linear-gradient(90deg,var(--primary),var(--orange))]";
const reviewPanelClass = cn(panelClass, "grid gap-3.5");
const reviewBtnClass = cn(baseButtonClass, "bg-primary text-white shadow-[0_10px_24px_rgba(0,135,154,0.18)] hover:bg-primary-hover");
const reviewMetaRowClass = "flex items-center justify-between gap-2.5 max-[640px]:items-start max-[640px]:flex-col";
const reviewMetaClass = "text-xs font-black text-grey";
const reviewStatusClass = cn(pillBaseClass, "bg-[rgba(16,185,129,0.12)] text-[#047857]");
const reviewStatusWarningClass = "bg-[rgba(252,95,0,0.1)] text-[#b94600]";
const assessmentClass = "m-0 text-[14px] font-bold leading-[1.7] text-text-high";
const suggestionListClass = "grid gap-2";
const suggestionCardClass = "rounded-[14px] border border-[rgba(0,135,154,0.12)] bg-[rgba(0,135,154,0.04)] p-3";
const suggestionTitleClass = "text-xs font-[950] uppercase tracking-[0.03em] text-primary";
const suggestionTextClass = "mt-1.5 mb-0 text-[13px] font-bold leading-[1.55] text-grey";
const adjustedBlockClass = "grid gap-2.5 rounded-[16px] bg-[#f8fafb] p-3.5";
const adjustedTitleClass = "text-[13px] font-[950] text-text-high";
const adjustedListClass = "grid gap-2";
const adjustedItemClass = "grid gap-[3px] rounded-[12px] border border-[#e7eef0] bg-white p-3";
const adjustedSkillClass = "text-[11px] font-[950] uppercase tracking-[0.04em] text-primary";
const adjustedItemTitleClass = "text-sm leading-[1.35] text-text-high";
const adjustedMetaClass = "text-xs font-extrabold text-grey";
const reviewActionsClass = "flex flex-wrap justify-end gap-2.5";
const keepBtnClass = cn(baseButtonClass, "border border-[#dbe7ea] bg-white text-text-high hover:border-[rgba(0,135,154,0.35)] hover:text-primary");
const messageBoxBaseClass = "rounded-[16px] p-3.5 text-[13px] font-bold leading-[1.6]";
const reviewEmptyClass = cn(messageBoxBaseClass, "bg-[#f8fafb] text-grey");
const reviewErrorClass = cn(messageBoxBaseClass, "bg-[rgba(252,95,0,0.1)] text-[#b94600]");
const applySuccessClass = cn(messageBoxBaseClass, "bg-[rgba(16,185,129,0.12)] text-[#047857]");
const lowerSectionClass = "mt-5";
const panelBadgesClass = "flex flex-wrap justify-end gap-2";
const stateClass = "grid justify-items-center gap-2.5 rounded-[22px] border border-dashed border-[#dce7e8] bg-[rgba(255,255,255,0.9)] px-[22px] py-[34px] text-center font-bold text-grey shadow-[0_14px_34px_rgba(16,42,45,0.06)]";
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
  const todayTasks = data?.todayTasks || [];
  const weekProgress = data?.weekProgress || {};
  const weekPercent = Math.min(Math.max(Number(weekProgress.percent) || 0, 0), 100);
  const generationSource = data?.generationSource === "ai" ? "ai" : "fallback";
  const adjustedWeeklyItems = data?.lastReview?.adjustedWeeklyItems || [];
  const canApplyReview = adjustedWeeklyItems.length > 0 && !reviewDismissed;
  const dailyMinutes = data?.goal?.dailyMinutes || 30;

  const renderTaskCard = (task, keyPrefix = "task", variant = "week") => {
    const meta = skillMeta[task.skill] || { icon: "", label: task.skill };
    const progress = task.progress || {
      count: task.completedAt ? task.targetCount || 1 : 0,
      target: task.targetCount || 1,
      percent: task.completedAt ? 100 : 0,
      label: `${task.completedAt ? task.targetCount || 1 : 0}/${task.targetCount || 1} mục`,
    };
    const progressPercent = Math.min(Math.max(Number(progress.percent) || 0, 0), 100);
    const href = getTaskHref(task, data.level);
    const isDone = Boolean(task.completedAt || progress.isComplete);
    const isToday = variant === "today";

    return (
      <article key={`${keyPrefix}-${task.skill}-${task.order}`} className={isToday ? todayTaskClass : weekTaskClass}>
        <div className={taskTopClass}>
          <div>
            <div className={taskSkillClass}>
              {meta.icon && <span className={skillMarkClass}>{meta.icon}</span>}
              <span>{meta.label}</span>
            </div>
            <h3 className={isToday ? taskTitleClass : weekTaskTitleClass}>{task.title || meta.label}</h3>
            <p className={taskMetaClass}>{progress.requirement || progress.label}</p>
          </div>
          <span className={cn(timeBadgeClass, isDone && doneBadgeClass)}>
            {isDone ? "Hoàn thành" : `${task.estimatedMinutes || 15} phút`}
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
              {isDone ? "Tiếp tục luyện" : "Bắt đầu"}
            </button>
          </div>
        )}
      </article>
    );
  };

  return (
    <main className={wrapperClass}>
      <div className={containerClass}>
        <header className={topBarClass}>
          <div>
            <div className={eyebrowClass}>Lộ trình cá nhân</div>
            <h1 className={titleClass}>Hôm nay học gì?</h1>
            <p className={subtitleClass}>
              Tập trung vào các nhiệm vụ quan trọng nhất trong khoảng {dailyMinutes} phút học hôm nay, rồi xem phần còn lại của tuần ở bên dưới.
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
            <section className={mainGridClass}>
              <div className={todayCardClass}>
                <div className={sectionHeaderClass}>
                  <div>
                    <h2 className={sectionTitleClass}>Nhiệm vụ hôm nay</h2>
                    <p className={sectionDescriptionClass}>
                      Ưu tiên các mục chưa hoàn thành theo thứ tự lộ trình, vừa với mục tiêu {dailyMinutes} phút/ngày.
                    </p>
                  </div>
                  <span className={panelBadgeClass}>{todayTasks.length} mục hôm nay</span>
                </div>

                {todayTasks.length === 0 ? (
                  <div className={emptyTasksClass}>
                    <strong className={stateTitleClass}>Hôm nay bạn đã hoàn thành các mục gợi ý.</strong>
                    <p className={stateTextClass}>Bạn có thể ôn lại bài cũ hoặc xem kế hoạch tuần bên dưới để học trước.</p>
                  </div>
                ) : (
                  <div className={todayListClass}>
                    {todayTasks.map((task) => renderTaskCard(task, "today", "today"))}
                  </div>
                )}
              </div>

              <aside className={sideStackClass}>
                <section className={progressPanelClass}>
                  <div className={sectionHeaderClass}>
                    <div>
                      <h2 className={sectionTitleClass}>Nhịp học tuần này</h2>
                      <p className={sectionDescriptionClass}>Theo dõi nhanh để biết hôm nay cần giữ nhịp hay tăng tốc.</p>
                    </div>
                  </div>
                  <div className={statsGridClass}>
                    <div className={statBoxClass}>
                      <div className={statLabelClass}>Tuần</div>
                      <div className={statValueClass}>{weekProgress.week || 1}</div>
                    </div>
                    <div className={statBoxClass}>
                      <div className={statLabelClass}>Xong</div>
                      <div className={statValueClass}>{weekProgress.completed || 0}/{weekProgress.total || 0}</div>
                    </div>
                    <div className={statBoxClass}>
                      <div className={statLabelClass}>Tiến độ</div>
                      <div className={statValueClass}>{weekPercent}%</div>
                    </div>
                  </div>
                  <div className={weeklyTrackClass}>
                    <span className={weeklyFillClass} style={{ width: `${weekPercent}%` }} />
                  </div>
                  <p className={sectionDescriptionClass}>Cấp độ hiện tại: {data.level || "N5"}</p>
                </section>

                <section className={reviewPanelClass}>
                  <div className={sectionHeaderClass}>
                    <div>
                      <h2 className={sectionTitleClass}>AI coach</h2>
                      <p className={sectionDescriptionClass}>Đánh giá lộ trình và đề xuất điều chỉnh khi nhịp học thay đổi.</p>
                    </div>
                    <button type="button" className={reviewBtnClass} onClick={handleReview} disabled={reviewLoading}>
                      {reviewLoading ? "Đang đánh giá..." : data?.lastReview ? "Đánh giá lại" : "Tạo đánh giá"}
                    </button>
                  </div>

                  {reviewError && <div className={reviewErrorClass}>{reviewError}</div>}

                  {data?.lastReview ? (
                    <>
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
                          <button type="button" className={reviewBtnClass} onClick={handleApplyReview} disabled={applyLoading}>
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
                    </>
                  ) : (
                    <div className={reviewEmptyClass}>
                      Chưa có đánh giá nào. Khi bạn đã học được vài ngày, hãy tạo đánh giá để AI đề xuất điều chỉnh phù hợp.
                    </div>
                  )}
                </section>
              </aside>
            </section>

            <section className={cn(panelClass, lowerSectionClass)}>
              <div className={sectionHeaderClass}>
                <div>
                  <h2 className={sectionTitleClass}>Kế hoạch tuần</h2>
                  <p className={sectionDescriptionClass}>{weekTasks.length} mục được AI đề xuất cho tuần này, dùng để học tiếp sau nhiệm vụ hôm nay.</p>
                </div>
                <div className={panelBadgesClass}>
                  <span className={cn(panelBadgeClass, generationSource === "fallback" && fallbackBadgeClass)}>
                    {generationSource === "ai" ? "Tạo bởi AI" : "Kế hoạch dự phòng"}
                  </span>
                  <span className={panelBadgeClass}>{weekPercent}% hoàn thành</span>
                </div>
              </div>

              {weekTasks.length === 0 ? (
                <div className={emptyTasksClass}>Tuần này chưa có mục học nào trong lộ trình.</div>
              ) : (
                <div className={weekListClass}>
                  {weekTasks.map((task) => renderTaskCard(task, "week", "week"))}
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
