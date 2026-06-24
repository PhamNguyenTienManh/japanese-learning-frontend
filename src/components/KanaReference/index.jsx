import { useCallback, useEffect, useState } from "react";
import Tabs, { TabsList, TabsTrigger, TabsContent } from "~/components/Tabs";
import {
  getKanaCombinations,
  getKanaGroups,
} from "~/services/kanaService";

const sectionPanelCls =
  "mb-3 rounded-xl border border-[#d6e4e7] bg-white p-3 shadow-[0_6px_18px_rgba(16,42,45,0.04)]";

const sectionHeadCls = "mb-2 flex items-center justify-between gap-3";
const sectionTitleCls = "text-sm font-bold text-text-high";
const sectionDescCls = "text-[11px] text-grey";

const groupRowCls =
  "mb-1.5 grid gap-1 grid-cols-[repeat(auto-fill,minmax(58px,1fr))]";

const cellBaseCls =
  "flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded border border-border bg-white py-1.5 transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 hover:border-primary hover:bg-primary-low";

const cellCharCls = "text-base font-semibold leading-none text-text-high";
const cellRomajiCls = "text-[9px] lowercase text-grey";

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

function BasicGrid({ groups }) {
  return (
    <div>
      {groups.map((group) => (
        <div key={group.groupKey} className={groupRowCls}>
          {group.characters.map((char) => (
            <CharCell key={char.character} char={char} />
          ))}
        </div>
      ))}
    </div>
  );
}

function CombinationsBlock({ sections }) {
  return (
    <div>
      {sections.map((section) => (
        <div key={section.sectionKey} className="mb-3 last:mb-0">
          <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
            <h4 className="text-[13px] font-semibold text-text-high">
              {section.sectionLabel}
            </h4>
            <span className="text-[11px] text-grey">{section.description}</span>
          </div>
          {section.groups.map((group) => (
            <div key={group.groupKey} className={groupRowCls}>
              {group.characters.map((char) => (
                <CharCell key={char.character} char={char} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function KanaReference() {
  const [syllabary, setSyllabary] = useState("hiragana");
  const [showCombinations, setShowCombinations] = useState(false);
  const [groupsBy, setGroupsBy] = useState({ hiragana: null, katakana: null });
  const [combinationsBy, setCombinationsBy] = useState({
    hiragana: null,
    katakana: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchGroups = useCallback(async (target) => {
    try {
      const data = await getKanaGroups(target);
      setGroupsBy((prev) => ({ ...prev, [target]: data || [] }));
    } catch (err) {
      throw err;
    }
  }, []);

  const fetchCombinations = useCallback(async (target) => {
    try {
      const data = await getKanaCombinations(target);
      setCombinationsBy((prev) => ({ ...prev, [target]: data || [] }));
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
        if (groupsBy[syllabary] == null) tasks.push(fetchGroups(syllabary));
        if (showCombinations && combinationsBy[syllabary] == null) {
          tasks.push(fetchCombinations(syllabary));
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
    syllabary,
    showCombinations,
    groupsBy,
    combinationsBy,
    fetchGroups,
    fetchCombinations,
  ]);

  const groups = groupsBy[syllabary];
  const combinations = combinationsBy[syllabary];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Tabs active={syllabary} onChange={setSyllabary}>
          <TabsList>
            <TabsTrigger value="hiragana">Hiragana</TabsTrigger>
            <TabsTrigger value="katakana">Katakana</TabsTrigger>
          </TabsList>
          <TabsContent value="hiragana" />
          <TabsContent value="katakana" />
        </Tabs>

        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-grey-low">
          <input
            type="checkbox"
            checked={showCombinations}
            onChange={(e) => setShowCombinations(e.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer accent-primary"
          />
          Hiện ghép âm
        </label>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[var(--red)]">
          {error}
        </div>
      )}

      <section className={sectionPanelCls}>
        <div className={sectionHeadCls}>
          <h3 className={sectionTitleCls}>
            {syllabary === "hiragana" ? "Hiragana cơ bản" : "Katakana cơ bản"}
          </h3>
          <span className={sectionDescCls}>Bấm vào ký tự để nghe phát âm</span>
        </div>
        {loading && !groups ? (
          <div className="px-5 py-8 text-center text-sm text-grey-low">
            Đang tải...
          </div>
        ) : groups?.length ? (
          <BasicGrid groups={groups} />
        ) : (
          <div className="px-5 py-8 text-center text-sm text-grey-low">
            Chưa có dữ liệu.
          </div>
        )}
      </section>

      {showCombinations && (
        <section className={sectionPanelCls}>
          <div className={sectionHeadCls}>
            <h3 className={sectionTitleCls}>Ghép âm</h3>
            <span className={sectionDescCls}>
              Dakuten · Handakuten · Yoon
            </span>
          </div>
          {loading && !combinations ? (
            <div className="px-5 py-8 text-center text-sm text-grey-low">
              Đang tải...
            </div>
          ) : combinations?.length ? (
            <CombinationsBlock sections={combinations} />
          ) : (
            <div className="px-5 py-8 text-center text-sm text-grey-low">
              Chưa có dữ liệu.
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default KanaReference;
