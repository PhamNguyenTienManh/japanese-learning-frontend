import { useCallback, useEffect, useMemo, useState } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVolumeHigh,
  faPlus,
  faPlay,
  faShuffle,
  faClone,
  faTableCells,
  faMicrophoneLines,
  faClipboardList,
  faChevronLeft,
  faChevronRight,
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faCircleCheck,
  faCircleStop,
  faXmark,
  faSquarePlus,
  faList,
} from "@fortawesome/free-solid-svg-icons";

import handlePlayAudio from "~/services/handlePlayAudio";
import notebookService from "~/services/notebookService";
import styles from "./VocabGrammarStudy.module.scss";

const cx = classNames.bind(styles);

const PAGE_SIZE = 10;

const TOP_TABS = [
  { key: "list", label: "Danh sách", icon: faList },
  { key: "flashcard", label: "FlashCard", icon: faClone },
  { key: "quiz", label: "Quiz", icon: faTableCells },
  { key: "speakWrite", label: "Luyện nói, viết", icon: faMicrophoneLines },
  { key: "miniTest", label: "Mini Test", icon: faClipboardList },
];

function shuffleArray(arr) {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/* -------------------------- Add to Notebook Modal ------------------------- */
function AddToNotebookModal({ open, word, onClose }) {
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setDone(false);
    setSelectedId("");
    notebookService
      .getNotebooks()
      .then((data) => setNotebooks(data || []))
      .catch(() => setNotebooks([]))
      .finally(() => setLoading(false));
  }, [open]);

  const handleSave = async () => {
    if (!selectedId || saving) return;
    setSaving(true);
    try {
      await notebookService.addWord(selectedId, {
        name: word.word,
        phonetic: word.furigana,
        mean: word.meaning,
        type: "word",
      });
      setDone(true);
    } catch {
      setDone(true);
    }
  };

  const handleCloseAndReset = () => {
    onClose();
    setTimeout(() => {
      setDone(false);
      setSelectedId("");
    }, 200);
  };

  if (!open) return null;

  return (
    <div className={cx("nbkOverlay")} onClick={handleCloseAndReset}>
      <div className={cx("nbkModal")} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={cx("nbkClose")} onClick={handleCloseAndReset}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
        {done ? (
          <div className={cx("nbkDone")}>
            <FontAwesomeIcon icon={faCircleCheck} className={cx("nbkDoneIcon")} />
            <p>Đã thêm vào sổ tay!</p>
            <button type="button" className={cx("nbkBtn")} onClick={handleCloseAndReset}>Đóng</button>
          </div>
        ) : (
          <>
            <h3 className={cx("nbkTitle")}>Thêm vào sổ tay</h3>
            <p className={cx("nbkWord")}>{word?.word}</p>
            {loading ? (
              <p className={cx("nbkLoading")}>Đang tải sổ tay...</p>
            ) : notebooks.length === 0 ? (
              <p className={cx("nbkEmpty")}>Bạn chưa có sổ tay nào. Hãy tạo sổ tay trước.</p>
            ) : (
              <>
                <select
                  className={cx("nbkSelect")}
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  <option value="">Chọn sổ tay</option>
                  {notebooks.map((nb) => (
                    <option key={nb._id} value={nb._id}>{nb.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className={cx("nbkBtn")}
                  disabled={!selectedId || saving}
                  onClick={handleSave}
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- FlashCard tab ----------------------------- */
function FlashcardTab({ vocabulary, grammar }) {
  const [subTab, setSubTab] = useState("vocab");
  const [shuffled, setShuffled] = useState(null);
  const [addModal, setAddModal] = useState(null);
  const [fcIndex, setFcIndex] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);

  const baseList = subTab === "vocab" ? vocabulary : grammar;
  const list = shuffled || baseList;
  const total = list.length;
  const fcCurrent = list[fcIndex];
  const fcProgress = total > 0 ? Math.round(((fcIndex + 1) / total) * 100) : 0;
  const isGrammar = subTab === "grammar";
  const fcFrontLabel = isGrammar ? (fcCurrent?.title || fcCurrent?.word || "") : (fcCurrent?.word || "");

  const fcGoNext = useCallback(() => {
    if (fcIndex < total - 1) { setFcIndex((i) => i + 1); setFcFlipped(false); }
  }, [fcIndex, total]);
  const fcGoPrev = useCallback(() => {
    if (fcIndex > 0) { setFcIndex((i) => i - 1); setFcFlipped(false); }
  }, [fcIndex]);
  const fcFlip = useCallback(() => setFcFlipped((f) => !f), []);

  const handleSubTab = (key) => {
    setSubTab(key);
    setShuffled(null);
    setFcIndex(0);
    setFcFlipped(false);
  };

  const handleShuffle = () => {
    setShuffled(shuffleArray(baseList));
    setFcIndex(0);
    setFcFlipped(false);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); fcFlip(); } else if (e.code === "ArrowRight") fcGoNext(); else if (e.code === "ArrowLeft") fcGoPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [fcFlip, fcGoNext, fcGoPrev]);

  const renderCardControls = () => (
    <>
      <button type="button" className={cx("cardNav", "cardNavPrev")} onClick={(e) => { e.stopPropagation(); fcGoPrev(); }} disabled={fcIndex === 0}><FontAwesomeIcon icon={faChevronLeft} /></button>
      <button type="button" className={cx("cardNav", "cardNavNext")} onClick={(e) => { e.stopPropagation(); fcGoNext(); }} disabled={fcIndex >= total - 1}><FontAwesomeIcon icon={faChevronRight} /></button>
    </>
  );

  const renderAddBtn = () => {
    if (subTab !== "vocab") return null;
    return (
      <button type="button" className={cx("cardAddBtn")} onClick={(e) => { e.stopPropagation(); setAddModal(fcCurrent); }} aria-label="Thêm vào sổ tay">
        <FontAwesomeIcon icon={faSquarePlus} /> <span>Thêm vào sổ tay</span>
      </button>
    );
  };

  return (
    <div className={cx("flashcardPanel")}>
      <div className={cx("panelHead")}>
        <div className={cx("subTabs")}>
          <button className={cx("subTab", { active: subTab === "vocab" })} type="button" onClick={() => handleSubTab("vocab")}>Từ vựng</button>
          <button className={cx("subTab", { active: subTab === "grammar" })} type="button" onClick={() => handleSubTab("grammar")}>Ngữ pháp</button>
        </div>
        <div className={cx("panelTools")}>
          <button className={cx("toolBtn")} type="button" onClick={handleShuffle} title="Xáo trộn"><FontAwesomeIcon icon={faShuffle} /></button>
        </div>
      </div>
      {total === 0 ? <p className={cx("emptyState")}>Chưa có dữ liệu.</p> : (
        <div className={cx("flipArea")}>
          <div className={cx("flipProgress")}><div className={cx("flipProgressBar")} style={{ width: `${fcProgress}%` }} /></div>
          <div className={cx("flipStage", { flipped: fcFlipped })} onClick={fcFlip} role="button" tabIndex={0}>
            <div className={cx("flipInner")}>
              <div className={cx("flipFace", "flipFront")}>
                <div className={cx("flipTop")}>
                  <span className={cx("flipBadge", isGrammar ? "grammar" : "vocab")}>{isGrammar ? "Ngữ pháp" : "Từ vựng"}</span>
                  <button type="button" className={cx("flipAudio")} onClick={(e) => { e.stopPropagation(); handlePlayAudio(fcFrontLabel); }}><FontAwesomeIcon icon={faVolumeHigh} /></button>
                </div>
                {renderCardControls()}
                <div className={cx("flipCenter")}>
                  <h2 className={cx("flipMainText")}>{fcFrontLabel}</h2>
                  {fcCurrent?.furigana && <p className={cx("flipSubText")}>{fcCurrent.furigana}</p>}
                </div>
                <div className={cx("flipBottom")}>{renderAddBtn()}<span className={cx("flipHint")}>Nhấn hoặc Space để xem nghĩa</span></div>
              </div>
              <div className={cx("flipFace", "flipBack")}>
                <div className={cx("flipTop")}>
                  <span className={cx("flipBadge", "meaning")}>{isGrammar ? "Nghĩa & Ví dụ" : "Nghĩa"}</span>
                  <button type="button" className={cx("flipAudio")} onClick={(e) => { e.stopPropagation(); handlePlayAudio(fcFrontLabel); }}><FontAwesomeIcon icon={faVolumeHigh} /></button>
                </div>
                {renderCardControls()}
                <div className={cx("flipCenter")}>
                  {fcCurrent?.furigana && <p className={cx("flipBackFurigana")}>{fcCurrent.furigana}</p>}
                  <p className={cx("flipMeaning")}>{fcCurrent.meaning}</p>
                  {isGrammar && fcCurrent.example && (
                    <div className={cx("flipExample")}>
                      <p className={cx("flipExampleText")}>{fcCurrent.example}</p>
                      {fcCurrent.exampleMeaning && <p className={cx("flipExampleMeaning")}>{fcCurrent.exampleMeaning}</p>}
                    </div>
                  )}
                </div>
                <div className={cx("flipBottom")}>{renderAddBtn()}<span className={cx("flipHint")}>Nhấn hoặc Space để quay lại</span></div>
              </div>
            </div>
          </div>
          <div className={cx("flipDots")}>
            {total <= 30 && list.map((_, i) => <button key={i} type="button" className={cx("flipDot", { active: i === fcIndex })} onClick={() => { setFcIndex(i); setFcFlipped(false); }} aria-label={`Thẻ ${i + 1}`} />)}
          </div>
          <p className={cx("flipCount")}>{fcIndex + 1} / {total}</p>
        </div>
      )}
      <AddToNotebookModal open={!!addModal} word={addModal} onClose={() => setAddModal(null)} />
    </div>
  );
}

/* ------------------------------ List tab ------------------------------ */
function ListTab({ vocabulary, grammar }) {
  const [subTab, setSubTab] = useState("vocab");
  const [page, setPage] = useState(1);
  const [shuffled, setShuffled] = useState(null);
  const [addModal, setAddModal] = useState(null);

  const baseList = subTab === "vocab" ? vocabulary : grammar;
  const list = shuffled || baseList;

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = list.slice(start, start + PAGE_SIZE);
  const leftCol = pageItems.filter((_, i) => i % 2 === 0);
  const rightCol = pageItems.filter((_, i) => i % 2 === 1);

  const handleSubTab = (key) => {
    setSubTab(key);
    setShuffled(null);
    setPage(1);
  };

  const handleShuffle = () => {
    setShuffled(shuffleArray(baseList));
    setPage(1);
  };

  const handlePlayAll = () => { pageItems.forEach((item) => handlePlayAudio(item.word)); };

  const renderListCard = (item) => (
    <div className={cx("vocabCard")} key={item.id}>
      <button className={cx("audioBtn")} type="button" aria-label="Phát âm" onClick={() => handlePlayAudio(item.word)}><FontAwesomeIcon icon={faVolumeHigh} /></button>
      <div className={cx("vocabBody")}>
        <p className={cx("vocabWord")}>{item.word}</p>
        <p className={cx("vocabFurigana")}>{item.furigana}</p>
        <p className={cx("vocabMeaning")}>{item.meaning}</p>
      </div>
      <button className={cx("addBtn")} type="button" aria-label="Thêm vào sổ tay" onClick={() => setAddModal(item)}><FontAwesomeIcon icon={faPlus} /></button>
    </div>
  );

  return (
    <div className={cx("flashcardPanel")}>
      <div className={cx("panelHead")}>
        <div className={cx("subTabs")}>
          <button className={cx("subTab", { active: subTab === "vocab" })} type="button" onClick={() => handleSubTab("vocab")}>Từ vựng</button>
          <button className={cx("subTab", { active: subTab === "grammar" })} type="button" onClick={() => handleSubTab("grammar")}>Ngữ pháp</button>
        </div>
        <div className={cx("panelTools")}>
          <button className={cx("toolBtn")} type="button" aria-label="Phát âm tất cả" onClick={handlePlayAll}><FontAwesomeIcon icon={faPlay} /></button>
          <button className={cx("toolBtn")} type="button" aria-label="Xáo trộn" onClick={handleShuffle}><FontAwesomeIcon icon={faShuffle} /></button>
        </div>
      </div>

      {list.length === 0 ? <p className={cx("emptyState")}>Chưa có dữ liệu.</p> : (
        <div className={cx("vocabGrid")}>
          <div className={cx("vocabCol")}>{leftCol.map(renderListCard)}</div>
          <div className={cx("vocabCol")}>{rightCol.map(renderListCard)}</div>
        </div>
      )}

      {totalPages > 1 && (
        <div className={cx("pagination")}>
          <button type="button" onClick={() => setPage(1)} disabled={safePage === 1}><FontAwesomeIcon icon={faAngleDoubleLeft} /></button>
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}><FontAwesomeIcon icon={faChevronLeft} /></button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} type="button" className={cx("pageNum", { active: p === safePage })} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}><FontAwesomeIcon icon={faChevronRight} /></button>
          <button type="button" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}><FontAwesomeIcon icon={faAngleDoubleRight} /></button>
        </div>
      )}

      <AddToNotebookModal open={!!addModal} word={addModal} onClose={() => setAddModal(null)} />
    </div>
  );
}

/* -------------------------------- Quiz tab -------------------------------- */
function buildQuestions(vocabulary) {
  if (vocabulary.length < 4) return [];
  return shuffleArray(vocabulary).map((item) => {
    const distractors = shuffleArray(vocabulary.filter((v) => v.id !== item.id)).slice(0, 3);
    const options = shuffleArray([item, ...distractors]);
    return { prompt: item.word, furigana: item.furigana, answerId: item.id, options };
  });
}

function QuizTab({ vocabulary }) {
  const [questions, setQuestions] = useState(() => buildQuestions(vocabulary));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return <p className={cx("emptyState")}>Cần ít nhất 4 từ vựng để tạo Quiz.</p>;
  }

  const restart = () => {
    setQuestions(buildQuestions(vocabulary));
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className={cx("resultPanel")}>
        <FontAwesomeIcon className={cx("resultIcon")} icon={faCircleCheck} />
        <h3>Hoàn thành Quiz!</h3>
        <p className={cx("resultScore")}>
          {score}/{questions.length} câu đúng
        </p>
        <button className={cx("primaryBtn")} type="button" onClick={restart}>
          Làm lại
        </button>
      </div>
    );
  }

  const q = questions[index];

  const handlePick = (optId) => {
    if (selected) return;
    setSelected(optId);
    if (optId === q.answerId) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  return (
    <div className={cx("quizPanel")}>
      <div className={cx("quizProgress")}>
        Câu {index + 1}/{questions.length}
      </div>
      <div className={cx("quizPrompt")}>
        <p className={cx("quizWord")}>{q.prompt}</p>
        <p className={cx("quizFurigana")}>{q.furigana}</p>
        <span className={cx("quizHint")}>Chọn nghĩa đúng</span>
      </div>
      <div className={cx("quizOptions")}>
        {q.options.map((opt) => {
          const isAnswer = opt.id === q.answerId;
          const isPicked = opt.id === selected;
          return (
            <button
              key={opt.id}
              type="button"
              className={cx("quizOption", {
                correct: selected && isAnswer,
                wrong: selected && isPicked && !isAnswer,
              })}
              onClick={() => handlePick(opt.id)}
              disabled={Boolean(selected)}
            >
              {opt.meaning}
            </button>
          );
        })}
      </div>
      {selected && (
        <button className={cx("primaryBtn")} type="button" onClick={handleNext}>
          {index + 1 >= questions.length ? "Xem kết quả" : "Câu tiếp theo"}
        </button>
      )}
    </div>
  );
}

/* --------------------------- Luyện nói, viết tab -------------------------- */
function getRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function SpeakWriteTab({ vocabulary }) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const [listening, setListening] = useState(false);
  const [recognized, setRecognized] = useState("");
  const [error, setError] = useState("");

  if (vocabulary.length === 0) {
    return <p className={cx("emptyState")}>Chưa có dữ liệu.</p>;
  }

  const item = vocabulary[index];
  const writingCorrect = checked && typed.trim() === item.word.trim();

  const goTo = (next) => {
    setIndex(next);
    setTyped("");
    setChecked(false);
    setRecognized("");
    setError("");
    window.speechSynthesis?.cancel();
  };

  const handleMic = () => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setError("Trình duyệt chưa hỗ trợ nhận diện giọng nói.");
      return;
    }
    if (listening) return;

    const recognition = new Recognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((r) => r[0]?.transcript || "")
        .join("");
      setRecognized(text);
    };
    recognition.onerror = () => {
      setError("Không nhận được giọng nói. Kiểm tra quyền micro.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    setError("");
    setRecognized("");
    setListening(true);
    recognition.start();
  };

  const speechMatch =
    recognized && (recognized.includes(item.word) || recognized.includes(item.furigana));

  return (
    <div className={cx("speakPanel")}>
      <div className={cx("speakProgress")}>
        {index + 1}/{vocabulary.length}
      </div>

      <div className={cx("speakCard")}>
        <p className={cx("speakWord")}>{item.word}</p>
        <p className={cx("speakFurigana")}>{item.furigana}</p>
        <p className={cx("speakMeaning")}>{item.meaning}</p>
        <button
          className={cx("speakPlay")}
          type="button"
          onClick={() => handlePlayAudio(item.word)}
        >
          <FontAwesomeIcon icon={faVolumeHigh} />
          <span>Nghe mẫu</span>
        </button>
      </div>

      <div className={cx("speakSection")}>
        <h4>Luyện nói</h4>
        <button
          className={cx("micBtn", { active: listening })}
          type="button"
          onClick={handleMic}
        >
          <FontAwesomeIcon icon={listening ? faCircleStop : faMicrophoneLines} />
          <span>{listening ? "Đang nghe..." : "Nói thử"}</span>
        </button>
        {recognized && (
          <p className={cx("recognized", { match: speechMatch })}>
            Bạn đã nói: <strong>{recognized}</strong>{" "}
            {speechMatch ? "✓ Chính xác" : "✗ Thử lại"}
          </p>
        )}
      </div>

      <div className={cx("speakSection")}>
        <h4>Luyện viết</h4>
        <input
          className={cx("writeInput")}
          type="text"
          value={typed}
          placeholder="Gõ lại từ bằng tiếng Nhật"
          onChange={(e) => {
            setTyped(e.target.value);
            setChecked(false);
          }}
        />
        <button className={cx("checkBtn")} type="button" onClick={() => setChecked(true)}>
          Kiểm tra
        </button>
        {checked && (
          <p className={cx("writeResult", { match: writingCorrect })}>
            {writingCorrect ? "✓ Chính xác" : `✗ Đáp án: ${item.word}`}
          </p>
        )}
      </div>

      {error && <p className={cx("speechError")}>{error}</p>}

      <div className={cx("speakNav")}>
        <button
          type="button"
          onClick={() => goTo(Math.max(0, index - 1))}
          disabled={index === 0}
        >
          <FontAwesomeIcon icon={faChevronLeft} /> Trước
        </button>
        <button
          type="button"
          onClick={() => goTo(Math.min(vocabulary.length - 1, index + 1))}
          disabled={index === vocabulary.length - 1}
        >
          Sau <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ Mini Test tab ----------------------------- */
function MiniTestTab({ vocabulary }) {
  const questions = useMemo(() => buildQuestions(vocabulary).slice(0, 5), [vocabulary]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (questions.length < 4) {
    return <p className={cx("emptyState")}>Cần ít nhất 4 từ vựng để tạo Mini Test.</p>;
  }

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.answerId ? 1 : 0),
    0,
  );

  return (
    <div className={cx("miniTestPanel")}>
      <h3 className={cx("miniTitle")}>Mini Test — Chọn nghĩa đúng</h3>
      {questions.map((q, i) => (
        <div className={cx("miniQuestion")} key={i}>
          <div className={cx("miniPrompt")}>
            <span className={cx("miniNum")}>{i + 1}</span>
            <div>
              <p className={cx("miniWord")}>{q.prompt}</p>
              <p className={cx("miniFurigana")}>{q.furigana}</p>
            </div>
          </div>
          <div className={cx("miniOptions")}>
            {q.options.map((opt) => {
              const picked = answers[i] === opt.id;
              const isAnswer = opt.id === q.answerId;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={cx("miniOption", {
                    picked: picked && !submitted,
                    correct: submitted && isAnswer,
                    wrong: submitted && picked && !isAnswer,
                  })}
                  disabled={submitted}
                  onClick={() => setAnswers((a) => ({ ...a, [i]: opt.id }))}
                >
                  {opt.meaning}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {submitted ? (
        <div className={cx("miniResult")}>
          <p className={cx("resultScore")}>
            Kết quả: {score}/{questions.length}
          </p>
          <button
            className={cx("primaryBtn")}
            type="button"
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
          >
            Làm lại
          </button>
        </div>
      ) : (
        <button
          className={cx("primaryBtn")}
          type="button"
          disabled={Object.keys(answers).length < questions.length}
          onClick={() => setSubmitted(true)}
        >
          Nộp bài
        </button>
      )}
    </div>
  );
}

/* -------------------------------- Wrapper --------------------------------- */
function normalizeVocab(list) {
  return (list || []).map((item, index) => ({
    id: item.id || `v${item.order ?? index}`,
    word: item.word || "",
    furigana: item.furigana || "",
    meaning: item.meaning || "",
  }));
}

function normalizeGrammar(list) {
  return (list || []).map((item, index) => ({
    id: item.id || `g${item.order ?? index}`,
    word: item.word || item.title || "",
    furigana: item.furigana || "",
    meaning: item.meaning || "",
    example: item.example || "",
    exampleMeaning: item.exampleMeaning || "",
  }));
}

function VocabGrammarStudy({ vocabulary, grammar }) {
  const [activeTab, setActiveTab] = useState("list");

  const vocab = normalizeVocab(vocabulary);
  const gram = normalizeGrammar(grammar);

  return (
    <div className={cx("wrapper")}>
      <div className={cx("topTabs")}>
        {TOP_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={cx("topTab", { active: activeTab === tab.key })}
            onClick={() => setActiveTab(tab.key)}
          >
            <FontAwesomeIcon icon={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className={cx("tabContent")}>
        {activeTab === "list" && <ListTab vocabulary={vocab} grammar={gram} />}
        {activeTab === "flashcard" && <FlashcardTab vocabulary={vocab} grammar={gram} />}
        {activeTab === "quiz" && <QuizTab vocabulary={vocab} />}
        {activeTab === "speakWrite" && <SpeakWriteTab vocabulary={vocab} />}
        {activeTab === "miniTest" && <MiniTestTab vocabulary={vocab} />}
      </div>
    </div>
  );
}

export default VocabGrammarStudy;
