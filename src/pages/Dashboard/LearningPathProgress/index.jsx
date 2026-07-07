import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  getLearningPathDashboard,
  completeLearningPathItem,
  reviewLearningPath
} from "~/services/learningPathService";
import TaskModal from "./TaskModal";
import PracticePanel from "./PracticePanel";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// Skill dạng flashcard học ngay trong TaskModal (flip-card).
// Các skill còn lại mở PracticePanel nhúng trang thực hành chuyên dụng.
const FLASHCARD_SKILLS = ["vocab", "kanji", "grammar"];

// Nhãn tiếng Việt cho các loại gợi ý của AI review.
const SUGGESTION_META = {
  speed_up: { icon: "trending_up", label: "Tăng tốc" },
  slow_down: { icon: "trending_down", label: "Giảm nhịp" },
  focus_skill: { icon: "target", label: "Tập trung" },
  add_review: { icon: "history", label: "Ôn lại" },
};

const skillMeta = {
  vocab: { icon: "font_download", label: "Từ vựng" },
  grammar: { icon: "menu_book", label: "Ngữ pháp" },
  kanji: { icon: "translate", label: "Kanji" },
  conversation: { icon: "chat_bubble", label: "Hội thoại" },
  jlpt_exam: { icon: "assignment", label: "Đề JLPT" },
  reading: { icon: "library_books", label: "Đọc hiểu" },
  writing: { icon: "edit", label: "Viết" },
};

// Chữ kanji mờ trang trí nền roadmap (vị trí theo % của khung trail).
const KANJI_WATERMARKS = [
  { char: "大", top: "2%", left: "4%" },
  { char: "涧", top: "4%", left: "88%" },
  { char: "字", top: "24%", left: "90%" },
  { char: "玩", top: "26%", left: "6%" },
  { char: "枚", top: "48%", left: "88%" },
  { char: "日", top: "50%", left: "4%" },
  { char: "学", top: "70%", left: "88%" },
  { char: "字", top: "68%", left: "6%" },
  { char: "語", top: "90%", left: "6%" },
  { char: "又", top: "90%", left: "88%" },
];

// Số mục học mỗi buổi theo mục tiêu phút/ngày.
// Phản chiếu getGenericTaskCounts ở backend để tách WeeklyItem thành các node/buổi.
const getDailyCaps = (dailyMinutes) => {
  if (dailyMinutes <= 15)
    return { vocab: 5, kanji: 5, grammar: 5, reading: 1, writing: 1, conversation: 1, jlpt_exam: 1 };
  if (dailyMinutes <= 30)
    return { vocab: 10, kanji: 10, grammar: 10, reading: 2, writing: 1, conversation: 1, jlpt_exam: 1 };
  if (dailyMinutes <= 45)
    return { vocab: 15, kanji: 12, grammar: 12, reading: 3, writing: 2, conversation: 1, jlpt_exam: 1 };
  return { vocab: 20, kanji: 15, grammar: 15, reading: 4, writing: 2, conversation: 2, jlpt_exam: 1 };
};

const sessionTitle = (skill, count, level) => {
  const l = level ? ` ${level}` : "";
  switch (skill) {
    case "vocab": return `Học ${count} từ vựng${l}`;
    case "kanji": return `Học ${count} kanji${l}`;
    case "grammar": return `Học ${count} mẫu ngữ pháp${l}`;
    case "reading": return `Đọc ${count} bài luyện đọc`;
    case "writing": return `Tải ${count} PDF luyện viết${l}`;
    case "conversation": return `Luyện ${count} bài hội thoại${l}`;
    case "jlpt_exam": return `Luyện ${count} đề thi${l}`;
    default: return `Học ${count} mục`;
  }
};

// Chẻ 1 WeeklyItem (target cả tuần) thành nhiều node theo buổi học.
// Tiến độ mỗi buổi tính dồn từ số mục đã hoàn thành trong tuần (progress.count).
// week dùng để phân trang nội dung: tuần W lấy trang W của kỹ năng đó,
// đảm bảo nội dung không lặp lại giữa các tuần.
const splitTaskIntoSessions = (task, caps, level, week) => {
  const weeklyTarget = Number(task.progress?.target ?? task.targetCount) || 1;
  const doneCount = Number(task.progress?.count) || 0;
  const cap = Math.max(1, caps[task.skill] || weeklyTarget);
  const sessions = Math.max(1, Math.ceil(weeklyTarget / cap));
  const perMinutes = Math.max(
    1,
    Math.round((Number(task.estimatedMinutes) || sessions) / sessions)
  );

  return Array.from({ length: sessions }, (_, d) => {
    const startAt = d * cap;
    const nodeTarget = Math.min(cap, weeklyTarget - startAt);
    const nodeCount = Math.max(0, Math.min(nodeTarget, doneCount - startAt));
    const percent = nodeTarget ? Math.round((nodeCount / nodeTarget) * 100) : 0;
    const isComplete = doneCount >= startAt + nodeTarget;

    return {
      ...task,
      title: sessionTitle(task.skill, nodeTarget, level),
      sessionIndex: d,
      sessionTotal: sessions,
      weeklyTarget,
      // Trang nội dung = số tuần → mỗi tuần lấy phần nội dung kế tiếp, không lặp.
      contentPage: week,
      contentLimit: weeklyTarget,
      cardOffset: startAt,
      cardLimit: nodeTarget,
      targetCount: nodeTarget,
      estimatedMinutes: perMinutes,
      completedAt: isComplete ? task.completedAt || null : undefined,
      progress: {
        ...(task.progress || {}),
        count: nodeCount,
        target: nodeTarget,
        percent,
        isComplete,
      },
    };
  });
};

function LearningPathProgress() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Track container width for SVG curves
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(600); // Default to max-w

  // Node flashcard mở trong TaskModal; node còn lại mở trong PracticePanel.
  const [selectedTask, setSelectedTask] = useState(null);
  const [panelTask, setPanelTask] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  // Index node vừa hoàn thành để chạy animation chúc mừng.
  const [celebrateIndex, setCelebrateIndex] = useState(null);
  // Trạng thái AI đánh giá lộ trình.
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState("");

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

  // Refresh dữ liệu roadmap mà không hiện spinner toàn trang.
  // Dùng khi cập nhật tiến độ flashcard để trail đánh dấu node ngay.
  const refreshProgress = useCallback(async () => {
    try {
      const result = await getLearningPathDashboard();
      setData(result);
    } catch (err) {
      console.error("Failed to refresh learning path progress:", err);
    }
  }, []);

  // Số node đã hoàn thành trong tuần (để phát hiện node mới xong sau khi refresh).
  const countCompleted = useCallback((dashboard) => {
    return Number(dashboard?.weekProgress?.completed) || 0;
  }, []);

  // Refresh sau khi học ở panel; nếu có node mới hoàn thành thì chạy animation.
  const refreshWithCelebration = useCallback(async () => {
    const before = countCompleted(data);
    try {
      const result = await getLearningPathDashboard();
      setData(result);
      const after = countCompleted(result);
      if (after > before) {
        // Node vừa hoàn thành = node hoàn thành cuối cùng theo thứ tự.
        setCelebrateIndex(after - 1);
        setTimeout(() => setCelebrateIndex(null), 1800);
      }
    } catch (err) {
      console.error("Failed to refresh learning path progress:", err);
    }
  }, [data, countCompleted]);

  // Quyết định mở TaskModal (flashcard) hay PracticePanel (skill còn lại).
  const openTask = useCallback((task) => {
    if (FLASHCARD_SKILLS.includes(task.skill)) {
      setSelectedTask(task);
    } else {
      setPanelTask(task);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    setContainerWidth(containerRef.current.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, [loading]);

  const handleCompleteTask = async (task) => {
    try {
      setIsCompleting(true);
      await completeLearningPathItem({ skill: task.skill, order: task.order });
      setSelectedTask(null);
      setPanelTask(null);
      await refreshWithCelebration(); // Cập nhật UI + animation node vừa xong
    } catch (err) {
      console.error("Failed to complete task", err);
      alert(err?.message || "Lỗi khi hoàn thành bài học");
    } finally {
      setIsCompleting(false);
    }
  };

  // Đóng PracticePanel: refresh để bắt tiến độ auto-track (đọc/viết/đề thi).
  const handlePanelClose = async () => {
    setPanelTask(null);
    await refreshWithCelebration();
  };

  // Gọi AI đánh giá lại lộ trình rồi refresh để hiển thị nhận xét mới.
  const handleRunReview = async () => {
    try {
      setReviewing(true);
      setReviewError("");
      await reviewLearningPath();
      await refreshProgress();
    } catch (err) {
      console.error("Failed to review learning path", err);
      setReviewError(err?.message || "Không thể chạy đánh giá AI.");
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-container-padding py-lg flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin border-solid"></div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="max-w-7xl mx-auto px-container-padding py-lg">
        <div className="bg-error-container text-on-error-container p-4 rounded-xl text-center">
          {error || "Không có dữ liệu"}
        </div>
      </main>
    );
  }

  const weekTasks = data?.weekTasks || [];
  const weekProgress = data?.weekProgress || {};
  const weekPercent = Math.min(Math.max(Number(weekProgress.percent) || 0, 0), 100);
  const dailyMinutes = data?.goal?.dailyMinutes || 15;
  const currentLevel = data?.level || "N5";
  const lastReview = data?.lastReview || null;

  // Roadmap = toàn bộ bài học của tuần hiện tại, tách thành từng buổi học (node).
  // Mỗi WeeklyItem (target cả tuần) được chẻ theo daily-cap để mỗi node là 1 buổi.
  const dailyCaps = getDailyCaps(dailyMinutes);
  const currentWeek = Number(weekProgress.week) || 1;
  const allTasks = [...weekTasks]
    // Bỏ node đề JLPT: node cúp cuối tuần đã là bài thi rồi nên bị trùng.
    .filter((task) => task.skill !== "jlpt_exam")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .flatMap((task) => splitTaskIntoSessions(task, dailyCaps, currentLevel, currentWeek));
  
  // Find index of first active task to highlight
  let activeIndex = allTasks.findIndex((task) => {
     const isDone = Boolean(task.completedAt || task.progress?.isComplete);
     return !isDone;
  });
  if (activeIndex === -1) activeIndex = allTasks.length; // all done

  // --- Path Coordinates Generation ---
  const rowHeight = 220; 
  const getPoint = (index) => {
    const rIndex = Math.floor(index / 3);
    const cIndex = index % 3;
    const isEven = rIndex % 2 === 0;
    
    let x = 0;
    // 70px from edge to center of outer nodes
    if (isEven) {
      if (cIndex === 0) x = 70;
      if (cIndex === 1) x = containerWidth / 2;
      if (cIndex === 2) x = containerWidth - 70;
    } else {
      if (cIndex === 0) x = containerWidth - 70;
      if (cIndex === 1) x = containerWidth / 2;
      if (cIndex === 2) x = 70;
    }
    
    // Node giữa hàng võng xuống tạo hiệu ứng sóng
    const y = rIndex * rowHeight + (cIndex === 1 ? 70 : 0) + 48; 
    return { x, y };
  };

  let pathD = "";
  const totalRows = Math.ceil((allTasks.length || 0) / 3);
  const finalNodeY = totalRows * rowHeight + 48;
  const finalNodeX = containerWidth / 2;

  if (allTasks.length > 0) {
    pathD = `M ${getPoint(0).x} ${getPoint(0).y}`;
    for (let i = 1; i < allTasks.length; i++) {
      const prev = getPoint(i - 1);
      const curr = getPoint(i);
      const prevR = Math.floor((i - 1) / 3);
      const currR = Math.floor(i / 3);
      
      if (prevR === currR) {
        // S-curve horizontally to connect nodes in the same row
        const midX = (prev.x + curr.x) / 2;
        pathD += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
      } else {
        // C-loop vertically to avoid text block when moving to next row
        const isRight = prev.x > containerWidth / 2;
        const offset = isRight ? 80 : -80; 
        pathD += ` C ${prev.x + offset} ${prev.y}, ${curr.x + offset} ${curr.y}, ${curr.x} ${curr.y}`;
      }
    }
    
    // Connect to final node
    const last = getPoint(allTasks.length - 1);
    pathD += ` C ${last.x} ${last.y + 60}, ${finalNodeX} ${finalNodeY - 60}, ${finalNodeX} ${finalNodeY}`;
  }

  const pathContainerHeight = finalNodeY + 140; // Pad bottom for final node

  return (
    <div className="bg-background text-on-background min-h-screen font-['Be_Vietnam_Pro',_sans-serif]">
      <main className="max-w-7xl mx-auto px-container-padding py-lg flex flex-col lg:flex-row gap-lg">
        {/* Left Column: The Learning Trail */}
        <div className="flex-1">
          {/* Overall Progress Header */}
          <div className="bg-surface-container-lowest rounded-xl p-sm shadow-[0_4px_20px_rgba(0,0,0,0.05)] mb-lg flex items-center gap-4">
            <div className="flex-1 h-2 bg-surface-variant rounded-full overflow-hidden relative">
              <div 
                 className="absolute top-0 left-0 h-full bg-secondary rounded-full transition-all duration-500"
                 style={{ width: `${weekPercent}%` }}
              ></div>
            </div>
            <div className="flex gap-2 items-center">
              <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-label-sm text-label-sm shadow-md z-10">{currentLevel}</span>
            </div>
          </div>

          {/* The Trail Canvas */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-xl relative min-h-[600px] overflow-hidden flex flex-col items-center">
            {/* Section Title */}
            <h2 className="font-label-sm text-label-sm text-on-surface-variant mb-xl text-center uppercase tracking-widest z-10">
              Tuần {weekProgress.week || 1} · {weekProgress.completed || 0}/{weekProgress.total || 0} bài
            </h2>

            {/* Node Path Container */}
            <div 
               ref={containerRef}
               className="relative w-full max-w-[600px] mx-auto pb-lg"
               style={{ height: `${pathContainerHeight}px` }}
            >
              {/* Kanji watermark nền */}
              {KANJI_WATERMARKS.map((wm, idx) => (
                <span
                  key={idx}
                  aria-hidden="true"
                  className="absolute select-none pointer-events-none text-[80px] font-bold text-on-surface/[0.04] leading-none font-['Kosugi_Maru',_sans-serif]"
                  style={{ top: wm.top, left: wm.left, transform: "translate(-50%, -50%)" }}
                >
                  {wm.char}
                </span>
              ))}

              <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, width: '100%', height: '100%', overflow: 'visible' }}>
                 <defs>
                   <linearGradient id="trailGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#a8e86a" />
                     <stop offset="55%" stopColor="#6fdca0" />
                     <stop offset="100%" stopColor="#3ec9c4" />
                   </linearGradient>
                 </defs>
                 <path d={pathD} stroke="url(#trailGradient)" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              
              {allTasks.map((task, i) => {
                 const p = getPoint(i);
                 const isCompleted = Boolean(task.completedAt || task.progress?.isComplete);
                 const isActive = !isCompleted && i === activeIndex;
                 const isLocked = !isCompleted && i > activeIndex;
                 
                 const meta = skillMeta[task.skill] || { icon: "menu_book", label: task.skill };

                 return (
                    <div 
                       key={i} 
                       className={cn("absolute flex flex-col items-center gap-2 group w-[130px] z-10", !isLocked ? "cursor-pointer" : "")}
                       style={{ left: p.x, top: p.y, transform: 'translate(-50%, -48px)' }}
                       onClick={() => { if (!isLocked) openTask(task); }}
                    >
                       {/* Node tròn trắng có bóng đổ */}
                       {isCompleted && (
                         <div className={cn(
                           "w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.12)] transform transition-transform group-hover:scale-105 relative",
                           celebrateIndex === i && "animate-bounce"
                         )}>
                           {celebrateIndex === i && (
                             <span className="absolute inset-0 rounded-full ring-4 ring-secondary/40 animate-ping"></span>
                           )}
                           <span className="material-symbols-outlined text-[38px] text-secondary fill">check_circle</span>
                         </div>
                       )}

                       {isActive && (
                         <div className="w-[84px] h-[84px] rounded-full border-[5px] border-primary border-solid bg-white flex items-center justify-center shadow-[0_8px_22px_rgba(0,0,0,0.15)] transform transition-transform group-hover:scale-105 relative">
                           <div className="absolute -top-1 -right-1 bg-error text-on-error font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-md">Mới</div>
                           <span className="material-symbols-outlined text-primary text-[42px] fill">{meta.icon}</span>
                         </div>
                       )}

                       {isLocked && (
                         <div className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.1)]">
                           <span className="material-symbols-outlined text-[34px] text-on-surface-variant/60">lock</span>
                         </div>
                       )}

                       {(!isCompleted && !isActive && !isLocked) && (
                         <div className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.12)] transform transition-transform group-hover:scale-105">
                           <span className="material-symbols-outlined text-[36px] text-primary">{meta.icon}</span>
                         </div>
                       )}

                       <span className={cn(
                         "font-label-md text-center leading-tight mt-1",
                         isActive ? "text-primary font-bold" : "text-on-surface-variant"
                       )}>
                         {task.title || meta.label}
                       </span>

                       {isActive && task.progress && (
                         <div className="w-20 h-1.5 bg-surface-variant rounded-full">
                           <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${task.progress.percent || 0}%` }}></div>
                         </div>
                       )}
                    </div>
                 );
              })}
              
              {/* End of Section Node — Bài kiểm tra */}
              {allTasks.length > 0 && (
                 <div 
                    className="absolute flex flex-col items-center gap-2 group cursor-pointer z-10" 
                    style={{ left: finalNodeX, top: finalNodeY, width: '160px', transform: 'translate(-50%, -56px)' }}
                    onClick={() => navigate(`/practice/${currentLevel.toLowerCase()}?tour=exam`)}
                 >
                    <div className="w-[104px] h-[104px] rounded-full bg-[#a67c1a] flex items-center justify-center shadow-[0_10px_26px_rgba(166,124,26,0.35)] transform transition-transform group-hover:scale-105">
                      <span className="material-symbols-outlined text-[52px] text-white fill">emoji_events</span>
                    </div>
                    <span className="font-label-md font-bold text-on-surface-variant uppercase tracking-wider mt-2 text-center">Bài kiểm tra {currentLevel}</span>
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dashboard Cards */}
        <div className="w-full lg:w-[360px] flex flex-col gap-lg">
          {/* AI đánh giá lộ trình */}
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-container-padding">
            <div className="flex justify-between items-center mb-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                AI đánh giá
              </h3>
              <button
                className="bg-primary hover:bg-primary-hover text-on-primary font-label-sm text-label-sm px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50"
                onClick={handleRunReview}
                disabled={reviewing}
              >
                {reviewing ? (
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                )}
                {reviewing ? "Đang đánh giá" : "Đánh giá lại"}
              </button>
            </div>

            {reviewError && (
              <div className="bg-error-container text-on-error-container text-xs rounded-lg p-2 mb-3">{reviewError}</div>
            )}

            {!lastReview ? (
              <div className="text-center py-6 text-on-surface-variant text-sm">
                Chưa có đánh giá. Bấm "Đánh giá lại" để AI phân tích tiến độ và gợi ý cho tuần tới.
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn(
                    "font-label-sm text-[10px] px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1",
                    lastReview.onTrack
                      ? "bg-secondary/15 text-secondary"
                      : "bg-error/15 text-error"
                  )}>
                    <span className="material-symbols-outlined text-[14px]">
                      {lastReview.onTrack ? "check_circle" : "warning"}
                    </span>
                    {lastReview.onTrack ? "Đúng tiến độ" : "Cần điều chỉnh"}
                  </span>
                </div>

                <p className="font-body-sm text-sm text-on-surface mb-4 leading-relaxed">{lastReview.assessment}</p>

                {Array.isArray(lastReview.suggestions) && lastReview.suggestions.length > 0 && (
                  <div className="flex flex-col gap-2 mb-3">
                    {lastReview.suggestions.map((s, idx) => {
                      const sm = SUGGESTION_META[s.type] || { icon: "lightbulb", label: s.type };
                      const skillLabel = s.skill ? (skillMeta[s.skill]?.label || s.skill) : null;
                      return (
                        <div key={idx} className="flex gap-3 bg-surface-container rounded-lg p-3">
                          <span className="material-symbols-outlined text-[20px] text-primary shrink-0">{sm.icon}</span>
                          <div>
                            <div className="font-label-md text-label-md text-on-surface flex items-center gap-2">
                              {sm.label}
                              {skillLabel && (
                                <span className="bg-primary-container/30 text-primary font-label-sm text-[10px] px-1.5 py-0.5 rounded-sm">{skillLabel}</span>
                              )}
                            </div>
                            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">{s.reason}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {lastReview.reviewedAt && (
                  <div className="font-body-sm text-xs text-on-surface-variant pt-3 border-0 border-t border-solid border-surface-variant">
                    Đánh giá lúc: {new Date(lastReview.reviewedAt).toLocaleString("vi-VN")}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Nhịp học tuần này */}
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-container-padding">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Nhịp học tuần này</h3>
            <p className="font-body-sm text-sm text-on-surface-variant mb-4">Theo dõi nhanh để biết hôm nay cần giữ nhịp hay tăng tốc.</p>
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="p-2">
                <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Tuần</div>
                <div className="font-headline-md text-headline-md text-primary">{weekProgress.week || 1}</div>
              </div>
              <div className="p-2 border-0 border-l border-solid border-surface-variant">
                <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Xong</div>
                <div className="font-headline-md text-headline-md text-on-surface">{weekProgress.completed || 0}/{weekProgress.total || 0}</div>
              </div>
              <div className="p-2 border-0 border-l border-solid border-surface-variant">
                <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Tiến độ</div>
                <div className="font-headline-md text-headline-md text-on-surface">{weekPercent}%</div>
              </div>
            </div>
            <div className="font-body-sm text-xs text-on-surface-variant pt-3 border-0 border-t border-solid border-surface-variant">Cấp độ hiện tại: {currentLevel}</div>
          </div>
        </div>
      </main>

      {/* Node flashcard: học flip-card ngay trong TaskModal */}
      {selectedTask && (
        <TaskModal 
           task={selectedTask} 
           level={data.level}
           onClose={() => setSelectedTask(null)}
           onComplete={handleCompleteTask}
           onProgress={refreshProgress}
           isCompleting={isCompleting}
        />
      )}

      {/* Node còn lại: ngăn kéo trượt nhúng trang thực hành */}
      {panelTask && (
        <PracticePanel
           task={panelTask}
           level={data.level}
           onClose={handlePanelClose}
           onComplete={handleCompleteTask}
           isCompleting={isCompleting}
        />
      )}
    </div>
  );
}

export default LearningPathProgress;
