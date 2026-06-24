import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import KanaStepper from "~/components/KanaStepper";
import { getKanaBasics } from "~/services/kanaService";

const STORAGE_KEY = "kana_basics_progress";

const wrapperCls =
  "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,135,154,0.10),transparent_28%),linear-gradient(180deg,#f6fbfb_0%,#eef6f7_100%)] px-5 pb-10 pt-6";
const shellCls = "mx-auto w-full max-w-[960px]";

const heroCls =
  "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d6e4e7] bg-[linear-gradient(120deg,#ffffff_0%,#e9fbfa_100%)] px-5 py-4 shadow-[0_10px_28px_rgba(16,42,45,0.06)]";
const titleCls = "text-xl font-bold text-text-high";
const subtitleCls = "mt-0.5 text-[13px] text-grey-low";

const sectionPanelCls =
  "mb-3 rounded-xl border border-[#d6e4e7] bg-white p-4 shadow-[0_6px_18px_rgba(16,42,45,0.04)]";
const sectionTitleCls = "text-[15px] font-bold text-text-high";
const sectionDescCls = "mt-0.5 mb-3 text-xs text-grey-low";

const gridCls =
  "grid gap-2 grid-cols-[repeat(auto-fill,minmax(210px,1fr))]";

const phraseCardCls =
  "flex flex-col gap-1 rounded-md border border-border bg-white p-3 transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_8px_18px_rgba(0,135,154,0.10)]";

const phraseCardLearnedCls =
  "border-orange bg-[linear-gradient(180deg,#fff_0%,#fff7ef_100%)]";

const ctaCls =
  "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ffd2a8] bg-[linear-gradient(120deg,#fff5e6_0%,#ffe1cc_100%)] px-5 py-3";

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

function KanaBasics() {
  const [sections, setSections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [learnedKeys, setLearnedKeys] = useState(() => loadProgress());

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getKanaBasics();
      setSections(data || []);
    } catch (err) {
      setError(err?.message || "Không tải được dữ liệu câu cơ bản.");
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

  const renderSections = () => {
    if (loading) {
      return (
        <div className="px-5 py-10 text-center text-grey-low">
          Đang tải dữ liệu...
        </div>
      );
    }
    if (error) {
      return (
        <div className="px-5 py-10 text-center text-[var(--red)]">{error}</div>
      );
    }
    if (!sections?.length) {
      return (
        <div className="px-5 py-10 text-center text-grey-low">
          Chưa có dữ liệu.
        </div>
      );
    }
    return sections.map((section) => (
      <section key={section.sectionKey} className={sectionPanelCls}>
        <h3 className={sectionTitleCls}>{section.sectionLabel}</h3>
        <p className={sectionDescCls}>{section.description}</p>
        <div className={gridCls}>
          {section.items.map((item, index) => {
            const itemKey = `${section.sectionKey}:${index}`;
            const learned = learnedKeys.includes(itemKey);
            return (
              <article
                key={itemKey}
                className={[
                  phraseCardCls,
                  learned ? phraseCardLearnedCls : "",
                ].join(" ")}
              >
                <div className="text-base font-semibold leading-snug text-text-high">
                  {item.japanese}
                </div>
                <div className="text-[12px] lowercase text-orange">
                  {item.romaji}
                </div>
                <div className="text-[12px] text-grey-low">{item.meaning}</div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1 rounded border-0 bg-primary px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-primary-hover"
                    onClick={() => speak(item.japanese)}
                  >
                    🔊 Nghe
                  </button>
                  <button
                    type="button"
                    className={[
                      "cursor-pointer rounded px-2.5 py-1 text-[11px] font-semibold",
                      learned
                        ? "border border-orange bg-white text-orange"
                        : "border border-border bg-white text-grey hover:border-orange hover:text-orange",
                    ].join(" ")}
                    onClick={() => toggleLearned(itemKey)}
                  >
                    {learned ? "✓ Đã thuộc" : "Đánh dấu"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    ));
  };

  return (
    <main className={wrapperCls}>
      <div className={shellCls}>
        <KanaStepper active="basics" />

        <header className={heroCls}>
          <div className="min-w-0">
            <h1 className={titleCls}>Chào hỏi, số đếm &amp; giao tiếp</h1>
            <p className={subtitleCls}>
              Bước cuối trước khi sang N5.
            </p>
          </div>
        </header>

        {renderSections()}

        <section className={ctaCls}>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-text-high">
              Hoàn tất chuẩn bị!
            </h3>
            <p className="m-0 text-xs text-grey-low">
              Quay lại Onboarding, chọn "Hoàn toàn mới" để bắt đầu lộ trình N5.
            </p>
          </div>
          <Link
            to="/onboarding"
            className="cursor-pointer rounded-md border-0 bg-orange px-3.5 py-2 text-[13px] font-semibold text-white no-underline hover:bg-[#e85500]"
          >
            Tới lộ trình N5 →
          </Link>
        </section>
      </div>
    </main>
  );
}

export default KanaBasics;
