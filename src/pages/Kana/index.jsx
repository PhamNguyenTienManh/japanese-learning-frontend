import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import KanaFlashcardModal from "~/components/KanaFlashcardModal";
import KanaStepper from "~/components/KanaStepper";
import { getKanaGroups } from "~/services/kanaService";

const STORAGE_KEY = "kana_progress";

const wrapperCls =
  "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,135,154,0.10),transparent_28%),linear-gradient(180deg,#f6fbfb_0%,#eef6f7_100%)] px-5 pb-10 pt-5";
const shellCls = "mx-auto w-full max-w-[1100px]";

const toolbarCls =
  "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#d6e4e7] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(16,42,45,0.04)]";

const columnCls =
  "rounded-xl border border-[#d6e4e7] bg-white p-3 shadow-[0_6px_18px_rgba(16,42,45,0.04)]";

const columnHeadCls =
  "mb-2 flex items-baseline justify-between border-b border-[#eef3f4] pb-2";

const rowBaseCls =
  "group flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors";

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

function GroupRow({ group, learned, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        rowBaseCls,
        learned
          ? "border-orange/40 bg-[#fff7ef]"
          : "border-[#eef3f4] bg-white hover:border-primary hover:bg-primary-low/30",
      ].join(" ")}
    >
      <span className="w-8 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-grey">
        {group.groupKey}
      </span>
      <span className="flex flex-1 items-center gap-1.5">
        {group.characters.map((char) => (
          <span
            key={char.character}
            className="w-9 text-center text-[26px] font-semibold leading-none text-text-high"
          >
            {char.character}
          </span>
        ))}
      </span>
      <span
        className={[
          "shrink-0 text-[11px]",
          learned ? "text-orange" : "text-grey opacity-0 group-hover:opacity-100",
        ].join(" ")}
      >
        {learned ? "✓" : "→"}
      </span>
    </button>
  );
}

function SyllabaryColumn({ label, groups, learnedKeys, onOpen, loading }) {
  return (
    <div className={columnCls}>
      <div className={columnHeadCls}>
        <h2 className="text-base font-bold uppercase tracking-wider text-primary">
          {label}
        </h2>
        <span className="text-[11px] text-grey">
          {learnedKeys.length}/{groups?.length || 0} hàng
        </span>
      </div>
      {loading && !groups?.length ? (
        <div className="px-3 py-6 text-center text-xs text-grey-low">
          Đang tải...
        </div>
      ) : groups?.length ? (
        <div className="flex flex-col gap-1">
          {groups.map((group) => (
            <GroupRow
              key={group.groupKey}
              group={group}
              learned={learnedKeys.includes(group.groupKey)}
              onClick={() => onOpen(group)}
            />
          ))}
        </div>
      ) : (
        <div className="px-3 py-6 text-center text-xs text-grey-low">
          Chưa có dữ liệu.
        </div>
      )}
    </div>
  );
}

function Kana() {
  const [groupsBy, setGroupsBy] = useState({ hiragana: null, katakana: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openGroup, setOpenGroup] = useState(null);
  const [openSyllabary, setOpenSyllabary] = useState("hiragana");
  const [progress, setProgress] = useState(() => loadProgress());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [hira, kata] = await Promise.all([
        getKanaGroups("hiragana"),
        getKanaGroups("katakana"),
      ]);
      setGroupsBy({ hiragana: hira || [], katakana: kata || [] });
    } catch (err) {
      setError(err?.message || "Không tải được bảng chữ cái.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleOpen = (syllabary) => (group) => {
    setOpenSyllabary(syllabary);
    setOpenGroup(group);
  };

  const toggleLearned = (groupKey) => {
    setProgress((prev) => {
      const current = prev[openSyllabary] || [];
      const next = current.includes(groupKey)
        ? current.filter((k) => k !== groupKey)
        : [...current, groupKey];
      const updated = { ...prev, [openSyllabary]: next };
      saveProgress(updated);
      return updated;
    });
  };

  const currentLearned = progress[openSyllabary] || [];
  const isLearned = useMemo(
    () => (openGroup ? currentLearned.includes(openGroup.groupKey) : false),
    [openGroup, currentLearned]
  );

  return (
    <main className={wrapperCls}>
      <div className={shellCls}>
        <div className={toolbarCls}>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
            <KanaStepper active="alphabet" />
            <div className="hidden h-5 w-px bg-[#d6e4e7] md:block" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-text-high">
                Hiragana &amp; Katakana
              </h1>
              <p className="text-xs text-grey-low">
                Click 1 hàng để mở flashcard và phát âm.
              </p>
            </div>
          </div>
          <Link
            to="/kana/combinations"
            className="cursor-pointer rounded-md border-0 bg-orange px-3.5 py-2 text-[13px] font-semibold text-white no-underline hover:bg-[#e85500]"
          >
            Sang Ghép âm →
          </Link>
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-[#fecaca] bg-[#fff5f5] px-3 py-2 text-xs text-[var(--red)]">
            {error}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <SyllabaryColumn
            label="Hiragana"
            groups={groupsBy.hiragana}
            learnedKeys={progress.hiragana}
            onOpen={handleOpen("hiragana")}
            loading={loading}
          />
          <SyllabaryColumn
            label="Katakana"
            groups={groupsBy.katakana}
            learnedKeys={progress.katakana}
            onOpen={handleOpen("katakana")}
            loading={loading}
          />
        </div>
      </div>

      {openGroup && (
        <KanaFlashcardModal
          title={`Nhóm ${openGroup.label}`}
          subtitle={`${openSyllabary === "hiragana" ? "Hiragana" : "Katakana"} · ${openGroup.characters.length} ký tự`}
          characters={openGroup.characters}
          isLearned={isLearned}
          onToggleLearned={() => toggleLearned(openGroup.groupKey)}
          onClose={() => setOpenGroup(null)}
        />
      )}
    </main>
  );
}

export default Kana;
