import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import classNames from "classnames/bind";
import {
  faArrowLeft,
  faCircleStop,
  faMicrophone,
  faMagnifyingGlass,
  faPlay,
  faReply,
  faBookOpen,
  faComments,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  getConversationGroups,
  getConversationLesson,
} from "~/services/conversationService";
import GuidedCoachmark from "~/components/GuidedCoachmark";
import { useAuth } from "~/context/AuthContext";
import PremiumGate from "~/components/PremiumGate";

import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

import VocabGrammarStudy from "./VocabGrammarStudy";
import ConversationChat from "./ConversationChat";
import AiConversation from "./AiConversation";
import styles from "./ConversationPractice.module.scss";

const cx = classNames.bind(styles);

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().replace(/[\s。、！？?.,!]/g, '');
  const s2 = str2.toLowerCase().replace(/[\s。、！？?.,!]/g, '');
  const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(track[j][i - 1] + 1, track[j - 1][i] + 1, track[j - 1][i - 1] + indicator);
    }
  }
  return Math.round((1 - track[s2.length][s1.length] / Math.max(s1.length, s2.length)) * 100);
}

function getRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function ConversationCard({ lesson, onSelect, tourRef }) {
  const levelClass = (lesson.level || "").toLowerCase();

  return (
    <button
      ref={tourRef}
      className={cx("card")}
      type="button"
      onClick={() => onSelect(lesson)}
    >
      <img src={lesson.image} alt="" loading="lazy" />
      <span className={cx("imageShade")} />
      <span className={cx("playIcon")}>
        <FontAwesomeIcon icon={faPlay} />
      </span>
      <span className={cx("caption")}>
        <span className={cx("level", levelClass)}>
          {lesson.level}
        </span>
        <span className={cx("lessonTitle")}>{lesson.title}</span>
      </span>
    </button>
  );
}

function ModeRail({ lesson, studyMode, onChangeMode }) {
  const levelClass = (lesson.level || "").toLowerCase();

  return (
    <aside className={cx("modeRail")}>
      <div className={cx("railCard")}>
        {lesson.image && <img src={lesson.image} alt="" loading="lazy" />}
        <span className={cx("railShade")} />
        <span className={cx("railCaption")}>
          <span className={cx("level", levelClass)}>{lesson.level}</span>
          <span className={cx("railTitle")}>{lesson.title}</span>
        </span>
      </div>

      <button
        className={cx("modeButton", { active: studyMode === "vocab" })}
        type="button"
        onClick={() => onChangeMode("vocab")}
      >
        <span className={cx("modeIcon")}>
          <FontAwesomeIcon icon={faBookOpen} />
        </span>
        <span>Từ vựng và ngữ pháp</span>
      </button>

      <button
        className={cx("modeButton", { active: studyMode === "speaking" })}
        type="button"
        onClick={() => onChangeMode("speaking")}
      >
        <span className={cx("modeIcon")}>
          <FontAwesomeIcon icon={faComments} />
        </span>
        <span>Luyện nói với phụ đề</span>
      </button>

      <button
        className={cx("modeButton", { active: studyMode === "ai" })}
        type="button"
        onClick={() => onChangeMode("ai")}
      >
        <span className={cx("modeIcon")}>
          <FontAwesomeIcon icon={faWandMagicSparkles} />
        </span>
        <span>Luyện hội thoại với AI</span>
      </button>
    </aside>
  );
}

function ConversationPractice() {
  const location = useLocation();
  const [conversationGroups, setConversationGroups] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [studyMode, setStudyMode] = useState("vocab");
  const [chatStarted, setChatStarted] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [speakingLineIndex, setSpeakingLineIndex] = useState(null);
  const [listeningLineIndex, setListeningLineIndex] = useState(null);
  const [speechResults, setSpeechResults] = useState({});
  const [speechError, setSpeechError] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [kuroshiro, setKuroshiro] = useState(null);
  const [translatedSpeech, setTranslatedSpeech] = useState({});
  const recognitionRef = useRef(null);
  const conversationTourRef = useRef(null);
  const tourParam = useMemo(
    () => new URLSearchParams(location.search).get("tour"),
    [location.search],
  );

  useEffect(() => {
    let isMounted = true;
    const initKuroshiro = async () => {
      try {
        const k = new Kuroshiro();
        await k.init(new KuromojiAnalyzer({ dictPath: "/dict" }));
        if (isMounted) setKuroshiro(k);
      } catch (e) {
        console.error("Failed to init kuroshiro", e);
      }
    };
    initKuroshiro();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!kuroshiro) return;
    
    const translateSpeech = async () => {
      const newTranslated = { ...translatedSpeech };
      let changed = false;
      
      for (const [index, text] of Object.entries(speechResults)) {
        if (!text) continue;
        const currentTranslation = newTranslated[index];
        
        if (!currentTranslation || currentTranslation.original !== text) {
          try {
            const kana = await kuroshiro.convert(text, { to: "hiragana" });
            newTranslated[index] = { original: text, kana };
            changed = true;
          } catch (e) {
            console.error("Kuroshiro convert error", e);
          }
        }
      }
      
      if (changed) {
        setTranslatedSpeech(newTranslated);
      }
    };
    
    translateSpeech();
  }, [speechResults, kuroshiro]);

  const { isPremium } = useAuth();

  const dialogueLines = selectedLesson?.lines || [];
  const conversationTourLesson = useMemo(() => {
    const firstGroupWithLessons = conversationGroups.find(
      (group) => Array.isArray(group.lessons) && group.lessons.length > 0,
    );
    return firstGroupWithLessons?.lessons?.[0] || null;
  }, [conversationGroups]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversationGroups;
    return conversationGroups
      .map((group) => ({
        ...group,
        lessons: (group.lessons || []).filter(
          (lesson) =>
            (lesson.title || "").toLowerCase().includes(q) ||
            (lesson.level || "").toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.lessons.length > 0);
  }, [conversationGroups, searchQuery]);

  const toggleExpandGroup = (groupId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.abort();
    };
  }, []);



  useEffect(() => {
    let active = true;

    async function loadGroups() {
      try {
        setIsLoadingList(true);
        setLoadError("");
        const groups = await getConversationGroups();
        if (active) setConversationGroups(groups);
      } catch (error) {
        console.error("Load conversation groups error:", error);
        if (active) setLoadError("Không tải được danh sách hội thoại.");
      } finally {
        if (active) setIsLoadingList(false);
      }
    }

    loadGroups();

    return () => {
      active = false;
    };
  }, []);

  const handleSelectLesson = async (lesson) => {
    const lessonKey = lesson.slug || lesson.id;
    if (!lessonKey) return;

    setActiveLineIndex(0);
    setSpeechResults({});
    setSpeechError("");
    setLoadError("");
    setIsLoadingDetail(true);

    try {
      const detail = await getConversationLesson(lessonKey);
      setSelectedLesson(detail);
      setStudyMode("vocab");
    } catch (error) {
      console.error("Load conversation lesson error:", error);
      setLoadError("Không tải được nội dung bài hội thoại.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleBackToList = () => {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.abort();
    setSelectedLesson(null);
    setStudyMode("vocab");
    setChatStarted(false);
    setSpeakingLineIndex(null);
    setListeningLineIndex(null);
    setSpeechError("");
  };

  const handleChangeMode = (mode) => {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.abort();
    setStudyMode(mode);
    setChatStarted(false);
    setSpeakingLineIndex(null);
    setListeningLineIndex(null);
    setSpeechError("");
  };

  const handlePlayLine = (line, index) => {
    if (!("speechSynthesis" in window)) {
      setSpeechError("Trình duyệt chưa hỗ trợ phát âm tự động.");
      return;
    }

    if (speakingLineIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingLineIndex(null);
      return;
    }

    recognitionRef.current?.abort();
    setListeningLineIndex(null);
    setActiveLineIndex(index);
    setSpeechError("");
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(line.japanese);
    utterance.lang = "ja-JP";
    utterance.rate = 0.88;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingLineIndex(null);
    utterance.onerror = () => {
      setSpeakingLineIndex(null);
      setSpeechError("Không phát được câu mẫu. Vui lòng thử lại.");
    };

    setSpeakingLineIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const handleStartLesson = () => {
    if (!dialogueLines.length) return;
    setChatStarted(true);
  };

  const handleToggleMic = (index) => {
    const Recognition = getRecognitionConstructor();

    if (!Recognition) {
      setSpeechError("Trình duyệt chưa hỗ trợ nhận diện giọng nói.");
      return;
    }

    if (listeningLineIndex === index) {
      recognitionRef.current?.stop();
      return;
    }

    window.speechSynthesis?.cancel();
    recognitionRef.current?.abort();
    setSpeakingLineIndex(null);
    setActiveLineIndex(index);
    setSpeechError("");

    const recognition = new Recognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join("");

      setSpeechResults((current) => ({
        ...current,
        [index]: text,
      }));
    };

    recognition.onerror = () => {
      setSpeechError("Không nhận được giọng nói. Hãy kiểm tra quyền micro.");
      setListeningLineIndex(null);
    };

    recognition.onend = () => {
      setListeningLineIndex(null);
    };

    recognitionRef.current = recognition;
    setListeningLineIndex(index);
    recognition.start();
  };

  if (!isPremium) {
    return (
      <PremiumGate
        title="Luyện hội thoại dành cho gói Pro"
        description="Nâng cấp gói Pro để luyện hội thoại tiếng Nhật với AI, cải thiện phát âm và phản xạ giao tiếp."
      />
    );
  }

  if (selectedLesson) {
    const selectedLevelClass = (selectedLesson.level || "").toLowerCase();

    return (
      <main className={cx("root")}>
        <div className={cx("container")}>
          <button
            className={cx("backButton")}
            type="button"
            onClick={handleBackToList}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Quay lại hội thoại</span>
          </button>

          <nav className={cx("breadcrumb")} aria-label="Đường dẫn">
            <span>Hội thoại</span>
            <span>/</span>
            <span>{selectedLesson.category?.title || "Chủ đề"}</span>
            <span>/</span>
            <strong>{selectedLesson.title}</strong>
            {studyMode === "speaking" && chatStarted && (
              <>
                <span>/</span>
                <span>Hội thoại</span>
                <span>/</span>
                <strong>Chat</strong>
              </>
            )}
          </nav>

          <div className={cx("detailLayout")}>
            <div className={cx("detailMain")}>
              {studyMode === "vocab" ? (
                <VocabGrammarStudy
                  lesson={selectedLesson}
                  vocabulary={selectedLesson.vocabulary}
                  grammar={selectedLesson.grammar}
                />
              ) : studyMode === "ai" ? (
                <AiConversation key={selectedLesson.slug || selectedLesson.id} lesson={selectedLesson} />
              ) : chatStarted ? (
                <ConversationChat lesson={selectedLesson} lines={dialogueLines} kuroshiro={kuroshiro} />
              ) : (
                <>
                  <section className={cx("detailHero")}>
                    <div className={cx("detailContent")}>
                      <div className={cx("lessonHeader")}>
                        <div>
                          <span className={cx("level", selectedLevelClass)}>
                            {selectedLesson.level}
                          </span>
                          <h1>{selectedLesson.title}</h1>
                        </div>
                        <button
                          className={cx("startButton")}
                          type="button"
                          onClick={handleStartLesson}
                          disabled={dialogueLines.length === 0}
                        >
                          <FontAwesomeIcon icon={faPlay} />
                          <span>Bắt đầu</span>
                        </button>
                      </div>
                    </div>
                  </section>

                  {speechError && <p className={cx("speechError")}>{speechError}</p>}
                  {loadError && <p className={cx("speechError")}>{loadError}</p>}

                  <section className={cx("dialoguePanel")}>
                    {dialogueLines.length > 0 ? dialogueLines.map((line, index) => (
                      <article
                        className={cx("lineCard", {
                          active: activeLineIndex === index,
                          listening: listeningLineIndex === index,
                        })}
                        key={`${line.japanese}-${index}`}
                        onClick={() => setActiveLineIndex(index)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setActiveLineIndex(index);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <span className={cx("lineNumber")}>{index + 1}</span>
                        <div className={cx("lineBody")}>
                          <h2>{line.japanese}</h2>
                          <p className={cx("kana")}>{line.kana}</p>
                          <p className={cx("meaning")}>{line.vietnamese}</p>
                          {speechResults[index] && (() => {
                            const recognized = speechResults[index];
                            const recognizedKana = translatedSpeech[index]?.kana || recognized;
                            
                            const expectedText = line.japanese || "";
                            const expectedKana = line.kana || "";
                            
                            const score1 = calculateSimilarity(expectedText, recognized);
                            const score2 = calculateSimilarity(expectedKana, recognized);
                            const score3 = calculateSimilarity(expectedKana, recognizedKana);
                            
                            const bestScore = Math.max(score1, score2, score3);
                            
                            let scoreColor = "#ef4444"; // Đỏ
                            let scoreLabel = "Chưa chính xác";
                            if (bestScore >= 80) {
                              scoreColor = "#10b981"; // Xanh lá
                              scoreLabel = "Tuyệt vời!";
                            } else if (bestScore >= 50) {
                              scoreColor = "#f59e0b"; // Vàng
                              scoreLabel = "Tạm được";
                            }
                          
                            return (
                              <div className={cx("speechCompare")} style={{ borderColor: scoreColor + "40", backgroundColor: scoreColor + "08" }}>
                                <FontAwesomeIcon
                                  className={cx("compareIcon")}
                                  icon={faReply}
                                  style={{ color: scoreColor }}
                                />
                                <div style={{ width: "100%" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: "bold", padding: "2px 8px", borderRadius: "10px", backgroundColor: scoreColor, color: "#fff", lineHeight: 1 }}>
                                      {scoreLabel} ({bestScore}%)
                                    </span>
                                  </div>
                                  <p className={cx("expectedSpeech")}>{line.kana}</p>
                                  <p className={cx("recognizedSpeech")} style={{ color: scoreColor, marginTop: "4px" }}>
                                    {recognized}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        {activeLineIndex === index && (
                          <div className={cx("lineActions")}>
                            <button
                              type="button"
                              aria-label="Nghe câu mẫu"
                              onClick={(event) => {
                                event.stopPropagation();
                                handlePlayLine(line, index);
                              }}
                            >
                              <FontAwesomeIcon
                                icon={speakingLineIndex === index ? faCircleStop : faPlay}
                              />
                            </button>
                            <button
                              type="button"
                              aria-label="Ghi âm luyện nói"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleToggleMic(index);
                              }}
                            >
                              <FontAwesomeIcon
                                icon={
                                  listeningLineIndex === index ? faCircleStop : faMicrophone
                                }
                              />
                            </button>
                          </div>
                        )}
                      </article>
                    )) : (
                      <p className={cx("emptyState")}>Bài này chưa có câu hội thoại.</p>
                    )}
                  </section>
                </>
              )}
            </div>

            <ModeRail
              lesson={selectedLesson}
              studyMode={studyMode}
              onChangeMode={handleChangeMode}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={cx("root")}>
      <div className={cx("container")}>
        <header className={cx("pageHead")}>
          <div>
            <span className={cx("eyebrow")}>Luyện tập</span>
            <h1>Hội thoại</h1>
          </div>
          <label className={cx("searchBox")}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input
              placeholder="Tìm kiếm"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
        </header>

        {loadError && <p className={cx("speechError")}>{loadError}</p>}

        <div className={cx("sectionStack")}>
          {isLoadingList || isLoadingDetail ? (
            <section className={cx("group")}>
              <p className={cx("emptyState")}>Đang tải hội thoại...</p>
            </section>
          ) : conversationGroups.length > 0 ? conversationGroups.map((group) => {
          const groupId = group.id || group.title;
          const isExpanded = expandedGroups.has(groupId);
          const visibleLessons = isExpanded ? group.lessons : group.lessons.slice(0, 3);
          const hasMore = group.lessons.length > 3;
          const isFiltered = searchQuery.trim().length > 0;
          const filteredGroup = isFiltered
            ? filteredGroups.find((g) => g.id === group.id || g.title === group.title)
            : null;
          const displayLessons = isFiltered ? (filteredGroup?.lessons || []) : visibleLessons;

          return (
            <section className={cx("group")} key={groupId}>
              <div className={cx("groupHead")}>
                <h2>
                  {group.title} <span>({group.lessons.length})</span>
                </h2>
                {!isFiltered && hasMore && (
                  <button type="button" onClick={() => toggleExpandGroup(groupId)}>
                    {isExpanded ? "Thu gọn" : "Xem thêm"}
                  </button>
                )}
              </div>

              <div className={cx("cardRow")}>
                {displayLessons.map((lesson) => (
                  <ConversationCard
                    lesson={lesson}
                    key={lesson.title}
                    onSelect={handleSelectLesson}
                    tourRef={
                      conversationTourLesson &&
                      (conversationTourLesson.slug || conversationTourLesson.id || conversationTourLesson.title) ===
                        (lesson.slug || lesson.id || lesson.title)
                        ? conversationTourRef
                        : undefined
                    }
                  />
                ))}
              </div>
              {isFiltered && filteredGroup && displayLessons.length === 0 && (
                <p className={cx("emptyState")}>Không tìm thấy bài phù hợp trong chủ đề này.</p>
              )}
            </section>
          );
        }) : (
            <section className={cx("group")}>
              <p className={cx("emptyState")}>Chưa có dữ liệu hội thoại.</p>
            </section>
          )}
        </div>
        {tourParam === "conversation" && conversationTourLesson && !selectedLesson && !isLoadingList && (
          <GuidedCoachmark
            targetRef={conversationTourRef}
            tourKey="conversation"
            message="Chọn bài hội thoại này để bắt đầu luyện nói theo lộ trình."
            placement="top"
          />
        )}
      </div>
    </main>
  );
}

export default ConversationPractice;
