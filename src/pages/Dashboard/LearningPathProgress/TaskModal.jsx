import React, { useState, useEffect, useCallback } from "react";
import { getJlptWords, getJlptKanji, getJlptGrammar } from "~/services/jlptService";
import { updateJlptCardStatus } from "~/services/learningPathService";
import FlipCard from "~/components/FlipCard";

const skillMeta = {
  vocab: { icon: "font_download", label: "Từ vựng" },
  grammar: { icon: "menu_book", label: "Ngữ pháp" },
  kanji: { icon: "translate", label: "Kanji" },
  conversation: { icon: "chat_bubble", label: "Hội thoại" },
  jlpt_exam: { icon: "assignment", label: "Đề JLPT" },
  reading: { icon: "library_books", label: "Đọc hiểu" },
  writing: { icon: "edit", label: "Viết" },
};

export default function TaskModal({ task, level, onClose, onComplete, onProgress, isCompleting }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  
  const isFlashcardTask = ["vocab", "kanji", "grammar"].includes(task.skill);
  const isCompleted = Boolean(task.completedAt || task.progress?.isComplete);

  const fetchData = useCallback(async () => {
    if (!isFlashcardTask) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Phân trang nội dung theo tuần: tuần W lấy trang W (mỗi trang = target/tuần),
      // nên nội dung đã học tuần trước không lặp lại. Sau đó cắt đúng phần của buổi.
      const page = Number(task.contentPage) || Number(task.order) || 1;
      const weeklyTarget =
        Number(task.contentLimit) ||
        Number(task.weeklyTarget) ||
        (task.skill === "kanji" ? 18 : 15);
      const offset = Number(task.cardOffset) || 0;
      const sliceLimit = Number(task.cardLimit) || weeklyTarget;

      let res;
      if (task.skill === "vocab") res = await getJlptWords(page, weeklyTarget, level);
      else if (task.skill === "kanji") res = await getJlptKanji(page, weeklyTarget, level);
      else if (task.skill === "grammar") res = await getJlptGrammar(page, weeklyTarget, level);
      
      if (res?.success) {
        const allItems = res.data.data || [];
        const items = allItems.slice(offset, offset + sliceLimit);
        const transformed = items.map(item => {
          if (task.skill === "vocab") return { id: item._id, name: item.word, phonetic: item.phonetic, mean: item.meanings, notes: item.example };
          if (task.skill === "kanji") return { id: item._id, name: item.kanji, phonetic: item.kun_reading || item.on_reading, mean: item.mean, notes: item.example };
          if (task.skill === "grammar") return { id: item._id, name: item.title, phonetic: item.structure, mean: item.mean, notes: item.example };
          return item;
        });
        setData(transformed);
      } else {
        setError("Không thể tải dữ liệu.");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [task, level, isFlashcardTask]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNext = () => {
    if (currentIndex < data.length - 1) {
      setCurrentIndex(i => i + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setIsFlipped(false);
    }
  };

  const normalizeDisplay = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean).join("; ");
    if (value && typeof value === "object") return Object.values(value).filter(Boolean).join("; ");
    return String(value || "").trim();
  };

  const playAudio = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const handleMarkStatus = async (status) => {
    const currentCard = data[currentIndex];
    if (!currentCard?.id || savingStatus) return;
    try {
      setSavingStatus(true);
      const res = await updateJlptCardStatus({
        refId: currentCard.id,
        skill: task.skill === "vocab" ? "vocab" : task.skill,
        level,
        status,
      });
      // Cập nhật roadmap ngay để node đánh dấu tiến độ / hoàn thành.
      onProgress?.(res);
      // Học xong thẻ cuối của buổi thì đóng modal, ngược lại sang thẻ kế.
      if (currentIndex >= data.length - 1) {
        onClose?.();
      } else {
        handleNext();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingStatus(false);
    }
  };

  const meta = skillMeta[task.skill] || { icon: "menu_book", label: task.skill };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-up">
      <div className="bg-surface-container-lowest w-full max-w-4xl h-[105vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-solid border-surface-variant/30">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-0 border-b border-solid border-surface-variant/30 bg-gradient-to-r from-surface-container-lowest to-surface-container-low">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-[24px]">{meta.icon}</span>
              </div>
              <div>
                 <div className="flex items-center gap-2 mb-1">
                   <span className="bg-primary/10 text-primary font-label-sm text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">
                     {meta.label} • {level}
                   </span>
                   {isCompleted && (
                     <span className="bg-secondary/10 text-secondary font-label-sm text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold flex items-center gap-1">
                       <span className="material-symbols-outlined text-[12px]">check_circle</span>
                       Đã học
                     </span>
                   )}
                 </div>
                 <h3 className="font-headline-sm text-headline-sm text-on-surface">{task.title || "Bài học"}</h3>
              </div>
           </div>
           <button onClick={onClose} className="w-10 h-10 hover:bg-surface-variant/50 rounded-full text-on-surface-variant flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-[24px]">close</span>
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative p-6 bg-surface-container-lowest flex flex-col items-center justify-center">
          {!isFlashcardTask ? (
            <div className="text-center max-w-md mx-auto">
               <div className="w-24 h-24 rounded-full bg-tertiary-container text-on-tertiary-container mx-auto flex items-center justify-center mb-6 shadow-lg">
                 <span className="material-symbols-outlined text-[48px]">{meta.icon}</span>
               </div>
               <h4 className="font-headline-sm text-on-surface mb-3">Bài tập dạng {meta.label}</h4>
               <p className="font-body-md text-on-surface-variant mb-6">
                 Dạng bài tập này cần thực hành ở trang chuyên dụng để có trải nghiệm tốt nhất. Hãy hoàn thành bài học ở trang tương ứng rồi quay lại đây nhé.
               </p>
               <div className="p-4 bg-surface-container rounded-2xl border border-solid border-surface-variant/30 text-left mb-6">
                  <div className="font-label-md text-on-surface mb-1">Mục tiêu:</div>
                  <div className="font-body-sm text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                    Dự kiến {task.estimatedMinutes || 15} phút
                  </div>
               </div>
            </div>
          ) : (
            loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin border-solid"></div>
                <p className="text-on-surface-variant font-label-md">Đang tải thẻ học...</p>
              </div>
            ) : error ? (
              <div className="text-error font-label-lg">{error}</div>
            ) : data.length === 0 ? (
              <div className="text-on-surface-variant font-label-lg">Chưa có dữ liệu thẻ học cho phần này.</div>
            ) : (
              <div className="w-full max-w-2xl mx-auto flex flex-col items-center h-full justify-center">
                 {/* Progress Bar */}
                 <div className="w-full flex items-center justify-between mb-8">
                    <div className="font-label-md text-on-surface-variant">Thẻ {currentIndex + 1} / {data.length}</div>
                    <div className="flex-1 mx-6 h-2 bg-surface-variant rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-primary rounded-full transition-all duration-300"
                         style={{ width: `${((currentIndex + 1) / data.length) * 100}%` }}
                       ></div>
                    </div>
                 </div>

                 {/* Flashcard */}
                 <FlipCard
                    flipped={isFlipped}
                    onFlip={() => setIsFlipped((f) => !f)}
                    className="relative w-full max-w-[500px] aspect-[4/3] mb-8 group"
                    faceClassName="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col items-center justify-center p-8"
                    frontClassName="bg-background border border-solid border-surface-variant/50"
                    backClassName="bg-primary-container/10 border border-solid border-primary/20 overflow-y-auto"
                    front={
                       <>
                          <h2 className="text-[4rem] font-bold text-on-surface mb-4 font-['Kosugi_Maru',_sans-serif]">{data[currentIndex].name}</h2>
                          {data[currentIndex].phonetic && (
                            <p className="text-2xl text-on-surface-variant font-medium">{data[currentIndex].phonetic}</p>
                          )}

                          <button
                             className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-surface-container hover:bg-surface-variant flex items-center justify-center text-primary transition-colors shadow-sm"
                             onClick={(e) => { e.stopPropagation(); playAudio(data[currentIndex].name || data[currentIndex].phonetic); }}
                          >
                             <span className="material-symbols-outlined text-[24px]">volume_up</span>
                          </button>

                          <div className="absolute bottom-6 text-on-surface-variant/50 font-label-sm text-[12px] flex items-center gap-1">
                             <span className="material-symbols-outlined text-[14px]">touch_app</span> Chạm để lật
                          </div>
                       </>
                    }
                    back={
                       <>
                          <p className="text-2xl font-bold text-on-surface text-center mb-6">{normalizeDisplay(data[currentIndex].mean)}</p>
                          {data[currentIndex].notes && (
                            <div className="w-full bg-background/50 rounded-xl p-4 text-center">
                              <span className="text-[10px] font-label-sm text-on-surface-variant uppercase tracking-wider mb-2 block">Ví dụ</span>
                              <p className="text-md text-on-surface font-medium italic">{normalizeDisplay(data[currentIndex].notes)}</p>
                            </div>
                          )}
                       </>
                    }
                 />

                 {/* Controls */}
                 <div className="flex items-center gap-6">
                    <button 
                       onClick={handlePrev} 
                       disabled={currentIndex === 0}
                       className="w-14 h-14 rounded-full bg-surface-container hover:bg-surface-variant disabled:opacity-30 flex items-center justify-center text-on-surface transition-colors shadow-sm"
                    >
                       <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                    </button>
                    
                    <div className="flex items-center gap-4 mx-4">
                       <button 
                          onClick={() => handleMarkStatus("unknown")}
                          disabled={savingStatus}
                          className="flex items-center gap-2 px-6 py-3 rounded-full bg-error-container text-on-error-container hover:bg-error hover:text-on-error font-label-lg transition-colors shadow-sm"
                       >
                          <span className="material-symbols-outlined text-[20px]">close</span> Chưa thuộc
                       </button>
                       <button 
                          onClick={() => handleMarkStatus("known")}
                          disabled={savingStatus}
                          className="flex items-center gap-2 px-6 py-3 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary font-label-lg transition-colors shadow-sm"
                       >
                          <span className="material-symbols-outlined text-[20px]">check</span> Đã thuộc
                       </button>
                    </div>

                    <button 
                       onClick={handleNext} 
                       disabled={currentIndex === data.length - 1}
                       className="w-14 h-14 rounded-full bg-surface-container hover:bg-surface-variant disabled:opacity-30 flex items-center justify-center text-on-surface transition-colors shadow-sm"
                    >
                       <span className="material-symbols-outlined text-[28px]">chevron_right</span>
                    </button>
                 </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-0 border-t border-solid border-surface-variant/30 bg-surface-container-lowest flex justify-between items-center">
           <div className="text-on-surface-variant font-label-md text-sm">
             {isCompleted
               ? "Bạn đã hoàn thành bài học này."
               : isFlashcardTask
                 ? "Đánh dấu Đã thuộc để cập nhật tiến độ lộ trình."
                 : "Đừng quên ấn Hoàn thành sau khi học xong nhé!"}
           </div>
           <div className="flex gap-4">
             <button 
                onClick={onClose} 
                className="bg-transparent hover:bg-surface-variant/50 text-on-surface font-label-lg px-6 py-2.5 rounded-full transition-colors"
             >
                Đóng
             </button>
             {/* Nút hoàn thành thủ công chỉ dành cho node không theo dõi tiến độ tự động.
                 Node flashcard hoàn thành qua đánh dấu Đã thuộc nên không hiển thị nút này. */}
             {!isCompleted && !isFlashcardTask && (
               <button 
                  onClick={() => onComplete(task)} 
                  disabled={isCompleting}
                  className="bg-primary hover:bg-primary-hover text-on-primary font-label-lg px-8 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 transform hover:-translate-y-0.5"
               >
                  {isCompleting ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">task_alt</span>
                  )}
                  Hoàn thành bài học
               </button>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
