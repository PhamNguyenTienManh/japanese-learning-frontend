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
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  getConversationGroups,
  getConversationLesson,
} from "~/services/conversationService";
import GuidedCoachmark from "~/components/GuidedCoachmark";
import { useAuth } from "~/context/AuthContext";
import PremiumGate from "~/components/PremiumGate";
import styles from "./ConversationPractice.module.scss";

const cx = classNames.bind(styles);

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

function ConversationPractice() {
  const location = useLocation();
  const [conversationGroups, setConversationGroups] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [speakingLineIndex, setSpeakingLineIndex] = useState(null);
  const [listeningLineIndex, setListeningLineIndex] = useState(null);
  const [speechResults, setSpeechResults] = useState({});
  const [speechError, setSpeechError] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [loadError, setLoadError] = useState("");
  const recognitionRef = useRef(null);
  const conversationTourRef = useRef(null);
  const tourParam = useMemo(
    () => new URLSearchParams(location.search).get("tour"),
    [location.search],
  );

  const { isPremium } = useAuth();

  const dialogueLines = selectedLesson?.lines || [];
  const conversationTourLesson = useMemo(() => {
    const firstGroupWithLessons = conversationGroups.find(
      (group) => Array.isArray(group.lessons) && group.lessons.length > 0,
    );
    return firstGroupWithLessons?.lessons?.[0] || null;
  }, [conversationGroups]);

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
    handlePlayLine(dialogueLines[activeLineIndex], activeLineIndex);
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

          <section className={cx("detailHero")}>
            <div className={cx("detailContent")}>
              <nav className={cx("breadcrumb")} aria-label="Đường dẫn">
                <span>Hội thoại</span>
                <span>/</span>
                <span>{selectedLesson.category?.title || "Chủ đề"}</span>
                <span>/</span>
                <strong>{selectedLesson.title}</strong>
              </nav>

              <div className={cx("lessonHeader")}>
                <div>
                  <span
                    className={cx("level", selectedLevelClass)}
                  >
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
                  {speechResults[index] && (
                    <div className={cx("speechCompare")}>
                      <FontAwesomeIcon
                        className={cx("compareIcon")}
                        icon={faReply}
                      />
                      <div>
                        <p className={cx("expectedSpeech")}>{line.kana}</p>
                        <p className={cx("recognizedSpeech")}>
                          {speechResults[index]}
                        </p>
                      </div>
                    </div>
                  )}
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
            <input disabled placeholder="Tìm kiếm" type="search" />
          </label>
        </header>

        {loadError && <p className={cx("speechError")}>{loadError}</p>}

        <div className={cx("sectionStack")}>
          {isLoadingList || isLoadingDetail ? (
            <section className={cx("group")}>
              <p className={cx("emptyState")}>Đang tải hội thoại...</p>
            </section>
          ) : conversationGroups.length > 0 ? conversationGroups.map((group) => (
            <section className={cx("group")} key={group.id || group.title}>
              <div className={cx("groupHead")}>
                <h2>
                  {group.title} <span>({group.lessons.length})</span>
                </h2>
                <button type="button">Xem thêm</button>
              </div>

              <div className={cx("cardRow")}>
                {group.lessons.map((lesson) => (
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
            </section>
          )) : (
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
