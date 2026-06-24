import { useEffect, useState } from "react";

const overlayCls =
  "fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(16,42,45,0.45)] p-5";
const modalCls =
  "relative w-full max-w-[520px] rounded-[14px] bg-white p-7 shadow-[0_30px_60px_rgba(16,42,45,0.25)]";
const flashcardFaceBaseCls =
  "absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl border border-border [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";

function speak(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  } catch {
    // ignore
  }
}

function KanaFlashcardModal({
  title,
  subtitle,
  characters,
  isLearned,
  onToggleLearned,
  onClose,
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [characters]);

  useEffect(() => {
    setFlipped(false);
  }, [index]);

  const current = characters?.[index];
  if (!current) return null;

  const handlePrev = () => setIndex((i) => Math.max(i - 1, 0));
  const handleNext = () =>
    setIndex((i) => Math.min(i + 1, characters.length - 1));

  return (
    <div className={overlayCls} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={modalCls} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="Đóng"
          className="absolute right-3.5 top-3.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-xl text-grey hover:bg-black/5 hover:text-text-high"
          onClick={onClose}
        >
          ×
        </button>

        <div className="mb-4">
          <div className="text-lg font-bold text-text-high">{title}</div>
          {subtitle && (
            <div className="mt-1 text-[13px] text-grey">{subtitle}</div>
          )}
        </div>

        <div
          className="mb-4 h-[220px] w-full cursor-pointer [perspective:1000px]"
          onClick={() => setFlipped((f) => !f)}
        >
          <div
            className={[
              "relative h-full w-full transition-transform duration-[550ms] ease-in-out [transform-style:preserve-3d]",
              flipped ? "[transform:rotateY(180deg)]" : "",
            ].join(" ")}
          >
            <div
              className={[
                flashcardFaceBaseCls,
                "bg-[linear-gradient(180deg,#ffffff_0%,#e9fbfa_100%)]",
              ].join(" ")}
            >
              <div className="text-[96px] font-semibold leading-none text-text-high">
                {current.character}
              </div>
              <div className="mt-1.5 text-[11px] text-grey">
                Bấm để xem cách đọc
              </div>
            </div>
            <div
              className={[
                flashcardFaceBaseCls,
                "[transform:rotateY(180deg)] bg-[linear-gradient(180deg,#fff7ef_0%,#ffe1cc_100%)]",
              ].join(" ")}
            >
              <div className="text-5xl font-bold lowercase text-orange">
                {current.romaji}
              </div>
              <div className="mt-1.5 text-[11px] text-grey">
                Bấm để xem ký tự
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-border bg-white px-3.5 py-2 text-sm font-medium text-text-high transition-colors hover:border-primary hover:bg-primary-low disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handlePrev}
            disabled={index === 0}
          >
            ← Trước
          </button>
          <span className="text-[13px] font-medium text-grey">
            {index + 1} / {characters.length}
          </span>
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-border bg-white px-3.5 py-2 text-sm font-medium text-text-high transition-colors hover:border-primary hover:bg-primary-low disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleNext}
            disabled={index >= characters.length - 1}
          >
            Sau →
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
            onClick={() => speak(current.character)}
          >
            🔊 Phát âm
          </button>
          {onToggleLearned && (
            <button
              type="button"
              className={[
                "cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold",
                isLearned
                  ? "border border-orange bg-white text-orange"
                  : "border-0 bg-orange text-white hover:bg-[#e85500]",
              ].join(" ")}
              onClick={onToggleLearned}
            >
              {isLearned ? "✓ Đã thuộc" : "Đánh dấu đã thuộc"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default KanaFlashcardModal;
