import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Tabs, { TabsList, TabsTrigger, TabsContent } from "~/components/Tabs";
import KanaFlashcardModal from "~/components/KanaFlashcardModal";
import KanaStepper from "~/components/KanaStepper";
import { getKanaCombinations } from "~/services/kanaService";

const STORAGE_KEY = "kana_combinations_progress";

const wrapperCls =
  "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,135,154,0.10),transparent_28%),linear-gradient(180deg,#f6fbfb_0%,#eef6f7_100%)] px-5 pb-10 pt-6";
const shellCls = "mx-auto w-full max-w-[960px]";

const heroCls =
  "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d6e4e7] bg-[linear-gradient(120deg,#ffffff_0%,#e9fbfa_100%)] px-5 py-4 shadow-[0_10px_28px_rgba(16,42,45,0.06)]";
const titleCls = "text-xl font-bold text-text-high";
const subtitleCls = "mt-0.5 text-[13px] text-grey-low";

const sectionPanelCls =
  "mb-3 rounded-xl border border-[#d6e4e7] bg-white p-4 shadow-[0_6px_18px_rgba(16,42,45,0.04)]";
const sectionHeadCls = "mb-3";
const sectionTitleCls = "text-[15px] font-bold text-text-high";
const sectionDescCls = "mt-0.5 text-xs text-grey-low";

const gridCls =
  "grid gap-2 grid-cols-[repeat(auto-fill,minmax(110px,1fr))]";

const groupCardBaseCls =
  "relative flex cursor-pointer flex-col gap-0.5 rounded-md border bg-white p-2.5 text-left transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_8px_18px_rgba(0,135,154,0.10)]";

const ctaCls =
  "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ffd2a8] bg-[linear-gradient(120deg,#fff5e6_0%,#ffe1cc_100%)] px-5 py-3";

function loadProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { hiragana: [], katakana: [] };
    const parsed = JSON.parse(raw);
    return {
      hiragana: Array.isArray(parsed?.hiragana) ? parsed.hiragana : [],
      katakana: Array.isArray(parsed?.katakana) ? parsed.katakana : [],
    };
  } catch {
    return { hiragana: [], katakana: [] };
  }
}

function saveProgress(progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

function KanaCombinations() {
  const [syllabary, setSyllabary] = useState("hiragana");
  const [sectionsBySyllabary, setSectionsBySyllabary] = useState({
    hiragana: null,
    katakana: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openGroupKey, setOpenGroupKey] = useState(null);
  const [progress, setProgress] = useState(() => loadProgress());

  const sections = sectionsBySyllabary[syllabary];
  const learnedKeys = progress[syllabary] || [];

  const openGroup = useMemo(() => {
    if (!sections || !openGroupKey) return null;
    for (const section of sections) {
      const found = section.groups.find((g) => g.groupKey === openGroupKey);
      if (found) return { ...found, sectionLabel: section.sectionLabel };
    }
    return null;
  }, [sections, openGroupKey]);

  const fetchSections = useCallback(async (target) => {
    setLoading(true);
    setError("");
    try {
      const data = await getKanaCombinations(target);
      setSectionsBySyllabary((prev) => ({ ...prev, [target]: data || [] }));
    } catch (err) {
      setError(err?.message || "Không tải được dữ liệu ghép âm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sectionsBySyllabary[syllabary] == null) {
      fetchSections(syllabary);
    }
  }, [syllabary, sectionsBySyllabary, fetchSections]);

  const toggleLearned = (groupKey) => {
    setProgress((prev) => {
      const current = prev[syllabary] || [];
      const next = current.includes(groupKey)
        ? current.filter((k) => k !== groupKey)
        : [...current, groupKey];
      const updated = { ...prev, [syllabary]: next };
      saveProgress(updated);
      return updated;
    });
  };

  const renderSections = () => {
    if (loading) {
      return (
        <div className="px-5 py-10 text-center text-grey-low">
          Đang tải dữ liệu ghép âm...
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
        <div className={sectionHeadCls}>
          <h3 className={sectionTitleCls}>{section.sectionLabel}</h3>
          <p className={sectionDescCls}>{section.description}</p>
        </div>
        <div className={gridCls}>
          {section.groups.map((group) => {
            const learned = learnedKeys.includes(group.groupKey);
            return (
              <button
                key={group.groupKey}
                type="button"
                className={[
                  groupCardBaseCls,
                  learned
                    ? "border-orange bg-[linear-gradient(180deg,#fff_0%,#fff7ef_100%)]"
                    : "border-border",
                ].join(" ")}
                onClick={() => setOpenGroupKey(group.groupKey)}
              >
                <span className="text-2xl font-semibold leading-none text-text-high">
                  {group.label}
                </span>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11px] text-grey">
                    {group.characters.length} âm
                  </span>
                  {learned && (
                    <span className="rounded-full bg-orange px-1.5 py-0 text-[10px] font-semibold text-white">
                      ✓
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    ));
  };

  return (
    <main className={wrapperCls}>
      <div className={shellCls}>
        <KanaStepper active="combinations" />

        <header className={heroCls}>
          <div className="min-w-0">
            <h1 className={titleCls}>Dakuten, Handakuten &amp; Yoon</h1>
            <p className={subtitleCls}>
              Các âm "biến thể" cực kỳ phổ biến trong N5.
            </p>
          </div>
        </header>

        <div className="mb-4">
          <Tabs active={syllabary} onChange={setSyllabary}>
            <TabsList>
              <TabsTrigger value="hiragana">Hiragana</TabsTrigger>
              <TabsTrigger value="katakana">Katakana</TabsTrigger>
            </TabsList>

            <TabsContent value="hiragana">{renderSections()}</TabsContent>
            <TabsContent value="katakana">{renderSections()}</TabsContent>
          </Tabs>
        </div>

        <section className={ctaCls}>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-text-high">
              Đã ghép được âm?
            </h3>
            <p className="m-0 text-xs text-grey-low">
              Tiếp theo: chào hỏi, số đếm, câu giao tiếp.
            </p>
          </div>
          <Link
            to="/kana/basics"
            className="cursor-pointer rounded-md border-0 bg-orange px-3.5 py-2 text-[13px] font-semibold text-white no-underline hover:bg-[#e85500]"
          >
            Sang bước Câu cơ bản →
          </Link>
        </section>
      </div>

      {openGroup && (
        <KanaFlashcardModal
          title={`${openGroup.sectionLabel} · Nhóm ${openGroup.label}`}
          subtitle={`${syllabary === "hiragana" ? "Hiragana" : "Katakana"} · ${openGroup.characters.length} âm`}
          characters={openGroup.characters}
          isLearned={learnedKeys.includes(openGroup.groupKey)}
          onToggleLearned={() => toggleLearned(openGroup.groupKey)}
          onClose={() => setOpenGroupKey(null)}
        />
      )}
    </main>
  );
}

export default KanaCombinations;
