import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import KanaStepper from "~/components/KanaStepper";
import { getKanaRadicals } from "~/services/kanaService";

const STORAGE_KEY = "kana_radicals_progress";

const wrapperCls =
  "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,135,154,0.10),transparent_28%),linear-gradient(180deg,#f6fbfb_0%,#eef6f7_100%)] px-5 pb-10 pt-5";
const shellCls = "mx-auto w-full max-w-[1100px]";

const toolbarCls =
  "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d6e4e7] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(16,42,45,0.04)]";

const sectionPanelCls =
  "rounded-xl border border-[#d6e4e7] bg-white p-3 shadow-[0_6px_18px_rgba(16,42,45,0.04)]";

const sectionHeadCls =
  "mb-2 flex items-baseline justify-between border-b border-[#eef3f4] pb-2";

const radicalRowBaseCls =
  "group flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors";

function loadProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProgress(keys) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // ignore
  }
}

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

function RadicalRow({ item, learned, onToggle }) {
  return (
    <div
      className={[
        radicalRowBaseCls,
        learned
          ? "border-orange/40 bg-[#fff7ef]"
          : "border-[#eef3f4] bg-white hover:border-primary hover:bg-primary-low/30",
      ].join(" ")}
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#f0f7f8] text-[26px] font-bold text-text-high">
        {item.radical}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold leading-tight text-text-high">
            {item.meaning}
          </span>
          <span className="shrink-0 text-[11px] lowercase text-orange">
            {item.reading}
          </span>
        </div>
        <div className="text-[11px] text-grey-low">
          {item.strokeCount} nét
        </div>
      </div>
      <button
        type="button"
        title="Phát âm"
        aria-label="Phát âm"
        className="shrink-0 rounded border-0 bg-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
        onClick={() => speak(item.reading)}
      >
        🔊
      </button>
      <button
        type="button"
        title={learned ? "Bỏ đánh dấu" : "Đánh dấu đã thuộc"}
        aria-label="Đánh dấu"
        className={[
          "shrink-0 rounded border px-2.5 py-1.5 text-xs font-semibold",
          learned
            ? "border-orange bg-white text-orange"
            : "border-border bg-white text-grey hover:border-orange hover:text-orange",
        ].join(" ")}
        onClick={onToggle}
      >
        {learned ? "✓" : "○"}
      </button>
    </div>
  );
}

function SectionPanel({ section, learnedKeys, onToggle }) {
  const completed = section.items.reduce(
    (sum, _, idx) =>
      learnedKeys.includes(`${section.sectionKey}:${idx}`) ? sum + 1 : sum,
    0
  );

  return (
    <section className={sectionPanelCls}>
      <div className={sectionHeadCls}>
        <div className="min-w-0">
          <h3 className="text-base font-bold uppercase tracking-wider text-primary">
            {section.sectionLabel}
          </h3>
          <p className="text-xs text-grey-low">{section.description}</p>
        </div>
        <span className="shrink-0 text-[11px] text-grey">
          {completed}/{section.items.length}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {section.items.map((item, index) => {
          const key = `${section.sectionKey}:${index}`;
          return (
            <RadicalRow
              key={key}
              item={item}
              learned={learnedKeys.includes(key)}
              onToggle={() => onToggle(key)}
            />
          );
        })}
      </div>
    </section>
  );
}

function KanaRadicals() {
  const [sections, setSections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [learnedKeys, setLearnedKeys] = useState(() => loadProgress());

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getKanaRadicals();
      setSections(data || []);
    } catch (err) {
      setError(err?.message || "Không tải được dữ liệu bộ thủ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const toggleLearned = (key) => {
    setLearnedKeys((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      saveProgress(next);
      return next;
    });
  };

  const renderBody = () => {
    if (loading) {
      return (
        <div className="rounded-xl border border-[#d6e4e7] bg-white p-6 text-center text-sm text-grey-low">
          Đang tải dữ liệu...
        </div>
      );
    }
    if (!sections?.length) {
      return (
        <div className="rounded-xl border border-[#d6e4e7] bg-white p-6 text-center text-sm text-grey-low">
          Chưa có dữ liệu.
        </div>
      );
    }
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {sections.map((section) => (
          <SectionPanel
            key={section.sectionKey}
            section={section}
            learnedKeys={learnedKeys}
            onToggle={toggleLearned}
          />
        ))}
      </div>
    );
  };

  return (
    <main className={wrapperCls}>
      <div className={shellCls}>
        <div className={toolbarCls}>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
            <KanaStepper active="radicals" />
            <div className="hidden h-5 w-px bg-[#d6e4e7] md:block" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-text-high">
                80 bộ thủ cơ bản
              </h1>
              <p className="text-xs text-grey-low">
                Nền tảng để nhận diện và ghi nhớ kanji.
              </p>
            </div>
          </div>
          <Link
            to="/onboarding"
            className="cursor-pointer rounded-md border-0 bg-orange px-3.5 py-2 text-[13px] font-semibold text-white no-underline hover:bg-[#e85500]"
          >
            Tới lộ trình N5 →
          </Link>
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-[#fecaca] bg-[#fff5f5] px-3 py-2 text-xs text-[var(--red)]">
            {error}
          </div>
        )}

        {renderBody()}
      </div>
    </main>
  );
}

export default KanaRadicals;
