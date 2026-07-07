const fs = require('fs');
const path = require('path');

const newCode = `import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  applyLearningPathReview,
  getLearningPathDashboard,
  reviewLearningPath,
} from "~/services/learningPathService";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const skillMeta = {
  vocab: { icon: "menu_book", label: "Từ vựng" },
  grammar: { icon: "menu_book", label: "Ngữ pháp" },
  kanji: { icon: "edit", label: "Kanji" },
  conversation: { icon: "chat_bubble", label: "Hội thoại" },
  jlpt_exam: { icon: "assignment", label: "Đề JLPT" },
  reading: { icon: "menu_book", label: "Đọc hiểu" },
  writing: { icon: "edit", label: "Viết" },
};

const getTaskHref = (task, level) => {
  const order = Number(task.order) || 1;
  const levelLower = String(level || "N5").toLowerCase();

  if (task.skill === "vocab") return \`/jlpt?type=word&level=\${level}&tour=flashcard&lpSkill=vocab&lpOrder=\${order}\`;
  if (task.skill === "kanji") return \`/jlpt?type=kanji&level=\${level}&tour=flashcard&lpSkill=kanji&lpOrder=\${order}\`;
  if (task.skill === "grammar") return \`/jlpt?type=grammar&level=\${level}&tour=flashcard&lpSkill=grammar&lpOrder=\${order}\`;
  if (task.skill === "jlpt_exam") return \`/practice/\${levelLower}?tour=exam\`;
  if (task.skill === "conversation") return "/conversation?tour=conversation";
  if (task.skill === "reading") return "/reading?tour=reading";
  if (task.skill === "writing") return \`/jlpt?type=kanji&level=\${level}&writing=1&tour=writing\`;
  return null;
};

function LearningPathProgress() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-container-padding py-lg flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
  const todayTasks = data?.todayTasks || [];
  const allTasks = [...todayTasks, ...weekTasks]; // Combine to draw the trail
  const weekProgress = data?.weekProgress || {};
  const weekPercent = Math.min(Math.max(Number(weekProgress.percent) || 0, 0), 100);
  const dailyMinutes = data?.goal?.dailyMinutes || 15;
  const currentLevel = data?.level || "N5";

  // Split tasks into chunks of 3 for the snake path
  const chunks = [];
  for (let i = 0; i < allTasks.length; i += 3) {
    chunks.push(allTasks.slice(i, i + 3));
  }
  
  // Find index of first active task to highlight
  let activeIndex = allTasks.findIndex((task) => {
     const isDone = Boolean(task.completedAt || task.progress?.isComplete);
     return !isDone;
  });
  if (activeIndex === -1) activeIndex = allTasks.length; // all done

  return (
    <div className="bg-background text-on-background min-h-screen">
      <main className="max-w-7xl mx-auto px-container-padding py-lg flex flex-col lg:flex-row gap-lg">
        {/* Left Column: The Learning Trail */}
        <div className="flex-1">
          {/* Overall Progress Header */}
          <div className="bg-surface-container-lowest rounded-xl p-sm shadow-[0_4px_20px_rgba(0,0,0,0.05)] mb-lg flex items-center gap-4">
            <div className="flex-1 h-2 bg-surface-variant rounded-full overflow-hidden relative">
              <div 
                 className="absolute top-0 left-0 h-full bg-secondary rounded-full transition-all duration-500"
                 style={{ width: \`\${weekPercent}%\` }}
              ></div>
            </div>
            <div className="flex gap-2 items-center">
              <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-label-sm text-label-sm shadow-md z-10">{currentLevel}</span>
            </div>
          </div>

          {/* The Trail Canvas */}
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-xl relative min-h-[600px] overflow-hidden flex flex-col items-center">
            {/* Section Title */}
            <h2 className="font-label-sm text-label-sm text-on-surface-variant mb-xl text-center uppercase tracking-widest">Nền tảng cơ bản</h2>

            {/* Node Path Container */}
            <div className="relative w-full max-w-[600px] mx-auto flex flex-col items-center gap-xl pb-lg">
              {/* SVG Path Background */}
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
                {chunks.map((_, i) => {
                   if (i >= chunks.length - 1 && chunks.length > 1) return null; // last row doesn't need curve down if there's no next
                   if (chunks.length <= 1) return null;
                   
                   const isEven = i % 2 === 0;
                   return (
                     <div 
                        key={i} 
                        className={cn(
                          "absolute left-[50px] right-[50px] h-[160px] border-secondary-container opacity-60",
                          isEven ? "border-t-4 border-r-4 border-l-4 rounded-t-[80px]" : "border-b-4 border-l-4 border-r-4 rounded-b-[80px]"
                        )}
                        style={{ top: \`\${40 + i * 160}px\` }}
                     ></div>
                   );
                })}
              </div>

              {/* Rows */}
              {chunks.map((chunk, rIndex) => {
                const isEven = rIndex % 2 === 0;
                return (
                  <div key={rIndex} className={cn("w-full flex justify-between px-[30px] relative z-10", !isEven ? "flex-row-reverse" : "", rIndex > 0 ? "mt-[20px]" : "")}>
                    {chunk.map((task, cIndex) => {
                      const absoluteIndex = rIndex * 3 + cIndex;
                      const isCompleted = absoluteIndex < activeIndex;
                      const isActive = absoluteIndex === activeIndex;
                      const isLocked = absoluteIndex > activeIndex;
                      
                      const meta = skillMeta[task.skill] || { icon: "menu_book", label: task.skill };
                      const href = getTaskHref(task, data.level);

                      return (
                        <div 
                          key={absoluteIndex} 
                          className={cn("flex flex-col items-center gap-2 group", !isLocked ? "cursor-pointer" : "opacity-60", (cIndex === 1 && rIndex % 2 === 0) ? "mt-[40px]" : (cIndex === 1 && rIndex % 2 !== 0) ? "mt-[40px]" : "")}
                          onClick={() => { if (!isLocked && href) navigate(href); }}
                        >
                          {isCompleted && (
                            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-md transform transition-transform group-hover:scale-105">
                              <span className="material-symbols-outlined text-[32px] fill">check_circle</span>
                            </div>
                          )}
                          
                          {isActive && (
                            <div className="w-20 h-20 rounded-full border-4 border-primary bg-surface-container-lowest flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-105 relative">
                              <div className="absolute -top-2 -right-2 bg-error text-on-error font-label-sm text-[10px] px-2 py-0.5 rounded-full shadow-sm">Mới</div>
                              <span className="material-symbols-outlined text-primary text-[40px] fill">{meta.icon}</span>
                            </div>
                          )}

                          {isLocked && (
                            <div className="w-16 h-16 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center shadow-inner">
                              <span className="material-symbols-outlined text-[32px]">lock</span>
                            </div>
                          )}

                          {(!isCompleted && !isActive && !isLocked) && (
                            <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-md transform transition-transform group-hover:scale-105">
                              <span className="material-symbols-outlined text-[32px]">{meta.icon}</span>
                            </div>
                          )}

                          <span className={cn("font-label-sm text-label-sm text-center", isActive ? "text-primary" : "text-on-surface-variant")}>
                            {task.title || meta.label}
                          </span>
                          
                          {isActive && task.progress && (
                            <div className="w-20 h-1.5 bg-surface-variant rounded-full mt-1">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: \`\${task.progress.percent || 0}%\` }}></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* End of Section Node */}
              {allTasks.length > 0 && (
                <div className="w-full flex justify-center mt-[40px] relative z-10">
                  <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => navigate(\`/practice/\${currentLevel.toLowerCase()}?tour=exam\`)}>
                    <div className="w-24 h-24 rounded-full bg-tertiary-container flex items-center justify-center shadow-lg border-4 border-surface-container-lowest transform transition-transform group-hover:scale-105">
                      <span className="material-symbols-outlined text-[48px] text-on-tertiary-container fill">emoji_events</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mt-2">Bài kiểm tra {currentLevel}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dashboard Cards */}
        <div className="w-full lg:w-[360px] flex flex-col gap-lg">
          {/* Nhiệm vụ hôm nay */}
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-container-padding">
            <div className="flex justify-between items-center mb-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Nhiệm vụ hôm nay</h3>
              <span className="bg-primary-container/20 text-primary font-label-sm text-label-sm px-2 py-1 rounded-full">{todayTasks.length} mục hôm nay</span>
            </div>
            <p className="font-body-sm text-sm text-on-surface-variant mb-lg">Ưu tiên các mục chưa hoàn thành theo thứ tự lộ trình, vừa với mục tiêu {dailyMinutes} phút/ngày.</p>
            
            {todayTasks.length === 0 ? (
               <div className="text-center py-4 text-on-surface-variant text-sm">Hôm nay bạn đã hoàn thành các mục gợi ý.</div>
            ) : (
              todayTasks.map((task, idx) => {
                const meta = skillMeta[task.skill] || { label: task.skill };
                const isDone = Boolean(task.completedAt || task.progress?.isComplete);
                const percent = Math.min(Math.max(Number(task.progress?.percent) || 0, 0), 100);
                const href = getTaskHref(task, data.level);

                return (
                  <div key={idx} className="mb-gutter pb-gutter border-b border-surface-variant last:border-0 last:mb-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="bg-surface-variant text-on-surface-variant font-label-sm text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-wider mb-1 inline-block">
                          {meta.label}
                        </span>
                        <h4 className="font-label-lg text-label-lg text-on-surface">{task.title || meta.label}</h4>
                      </div>
                      <span className="bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[10px] px-2 py-1 rounded-full">
                        {isDone ? "Hoàn thành" : \`\${task.estimatedMinutes || 15} phút\`}
                      </span>
                    </div>
                    <p className="font-body-sm text-xs text-on-surface-variant mb-3">Mục tiêu hôm nay: {task.progress?.label || "Hoàn thành nhiệm vụ"}</p>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: \`\${percent}%\` }}></div>
                      </div>
                      <span className="font-label-sm text-[10px] text-on-surface-variant">{percent}%</span>
                    </div>
                    {href && (
                      <div className="flex justify-end">
                        <button 
                          className="bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg px-4 py-1.5 rounded-full transition-colors"
                          onClick={() => navigate(href)}
                        >
                          {isDone ? "Tiếp tục" : "Bắt đầu"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
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
              <div className="p-2 border-l border-surface-variant">
                <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Xong</div>
                <div className="font-headline-md text-headline-md text-on-surface">{weekProgress.completed || 0}/{weekProgress.total || 0}</div>
              </div>
              <div className="p-2 border-l border-surface-variant">
                <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Tiến độ</div>
                <div className="font-headline-md text-headline-md text-on-surface">{weekPercent}%</div>
              </div>
            </div>
            <div className="font-body-sm text-xs text-on-surface-variant pt-3 border-t border-surface-variant">Cấp độ hiện tại: {currentLevel}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LearningPathProgress;
\`;

fs.writeFileSync(path.join(__dirname, 'src', 'pages', 'Dashboard', 'LearningPathProgress', 'index.jsx'), newCode);
console.log('Successfully replaced index.jsx');
