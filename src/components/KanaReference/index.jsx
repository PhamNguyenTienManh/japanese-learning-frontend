import { useCallback, useEffect, useState } from "react";
import {
  getKanaCombinations,
  getKanaGroups,
} from "~/services/kanaService";

const columnCls =
  "rounded-xl border border-[#d6e4e7] bg-white p-3 shadow-[0_6px_18px_rgba(16,42,45,0.04)]";

const columnHeadCls =
  "mb-2 flex items-baseline justify-between border-b border-[#eef3f4] pb-2";

const blockHeadCls = "mb-1.5 mt-3 first:mt-0 flex items-baseline gap-2";

const rowCls =
  "grid grid-cols-[32px_repeat(5,1fr)] items-center gap-1 rounded px-2 py-1.5 transition-colors hover:bg-primary-low/30";

const rowLabelCls =
  "text-[11px] font-semibold uppercase tracking-wider text-grey";

const cellBaseCls =
  "flex cursor-pointer flex-col items-center justify-center gap-0 rounded py-1.5 transition-colors hover:bg-white";

const cellCharCls = "text-[22px] font-semibold leading-none text-text-high";
const cellRomajiCls = "text-[10px] lowercase text-grey";

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

function CharCell({ char }) {
  return (
    <button
      type="button"
      className={cellBaseCls}
      onClick={() => speak(char.character)}
      title={`Bấm để nghe phát âm ${char.romaji}`}
    >
      <span className={cellCharCls}>{char.character}</span>
      <span className={cellRomajiCls}>{char.romaji}</span>
    </button>
  );
}

function GroupRow({ group, cols }) {
  return (
    <div
      className={rowCls}
      style={{
        gridTemplateColumns: `32px repeat(${cols}, 1fr)`,
      }}
    >
      <span className={rowLabelCls}>{group.groupKey}</span>
      {group.characters.map((char) => (
        <CharCell key={char.character} char={char} />
      ))}
    </div>
  );
}

function BasicBlock({ groups }) {
  return (
    <div className="flex flex-col gap-0.5">
      {groups.map((group) => (
        <GroupRow key={group.groupKey} group={group} cols={5} />
      ))}
    </div>
  );
}

function CombinationsBlock({ sections }) {
  return (
    <div>
      {sections.map((section) => (
        <div key={section.sectionKey}>
          <div className={blockHeadCls}>
            <h4 className="text-sm font-bold text-text-high">
              {section.sectionLabel}
            </h4>
            <span className="text-[11px] text-grey">{section.description}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {section.groups.map((group) => (
              <GroupRow
                key={group.groupKey}
                group={group}
                cols={section.sectionKey === "yoon" ? 3 : 5}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SyllabaryColumn({ label, groups, combinations, showCombinations, loading }) {
  return (
    <div className={columnCls}>
      <div className={columnHeadCls}>
        <h3 className="text-base font-bold uppercase tracking-wider text-primary">
          {label}
        </h3>
        <span className="text-xs text-grey">Bấm ký tự để nghe</span>
      </div>
      {loading && !groups?.length ? (
        <div className="px-3 py-6 text-center text-xs text-grey-low">
          Đang tải...
        </div>
      ) : groups?.length ? (
        <>
          <BasicBlock groups={groups} />
          {showCombinations && combinations?.length > 0 && (
            <div className="mt-3 border-t border-[#eef3f4] pt-2">
              <CombinationsBlock sections={combinations} />
            </div>
          )}
        </>
      ) : (
        <div className="px-3 py-6 text-center text-xs text-grey-low">
          Chưa có dữ liệu.
        </div>
      )}
    </div>
  );
}

function KanaReference() {
  const [showCombinations, setShowCombinations] = useState(false);
  const [groupsBy, setGroupsBy] = useState({ hiragana: null, katakana: null });
  const [combinationsBy, setCombinationsBy] = useState({
    hiragana: null,
    katakana: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBasics = useCallback(async () => {
    try {
      const [hira, kata] = await Promise.all([
        getKanaGroups("hiragana"),
        getKanaGroups("katakana"),
      ]);
      setGroupsBy({ hiragana: hira || [], katakana: kata || [] });
    } catch (err) {
      throw err;
    }
  }, []);

  const fetchCombinations = useCallback(async () => {
    try {
      const [hira, kata] = await Promise.all([
        getKanaCombinations("hiragana"),
        getKanaCombinations("katakana"),
      ]);
      setCombinationsBy({ hiragana: hira || [], katakana: kata || [] });
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const tasks = [];
        if (groupsBy.hiragana == null) tasks.push(fetchBasics());
        if (showCombinations && combinationsBy.hiragana == null) {
          tasks.push(fetchCombinations());
        }
        if (tasks.length) await Promise.all(tasks);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Không tải được bảng chữ cái.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [
    showCombinations,
    groupsBy.hiragana,
    combinationsBy.hiragana,
    fetchBasics,
    fetchCombinations,
  ]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-grey-low">
          Tra cứu nhanh khi quên — bấm bất kỳ ký tự nào để nghe phát âm.
        </p>
        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-grey-low">
          <input
            type="checkbox"
            checked={showCombinations}
            onChange={(e) => setShowCombinations(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-primary"
          />
          Hiện ghép âm (dakuten / yoon)
        </label>
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
          combinations={combinationsBy.hiragana}
          showCombinations={showCombinations}
          loading={loading}
        />
        <SyllabaryColumn
          label="Katakana"
          groups={groupsBy.katakana}
          combinations={combinationsBy.katakana}
          showCombinations={showCombinations}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default KanaReference;
