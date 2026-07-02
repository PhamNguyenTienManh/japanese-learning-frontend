import { useCallback, useEffect, useRef, useState } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
  faLightbulb,
  faMicrophone,
  faCircleStop,
  faWandMagicSparkles,
  faArrowTurnDown,
  faUserGroup,
  faCircleCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./ConversationChat.module.scss";

const cx = classNames.bind(styles);

function getRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function sideOf(index) {
  return index % 2 === 0 ? "B" : "A";
}

function ChatBubble({ line, side }) {
  const isUser = side === "A";
  return (
    <div className={cx("bubbleRow", { user: isUser })}>
      {!isUser && <span className={cx("avatar", "avatarB")}>B</span>}
      <div className={cx("bubble", { user: isUser })}>
        <p className={cx("bubbleLine", "japanese")}>
          <FontAwesomeIcon className={cx("lineIcon")} icon={isUser ? faUserGroup : faWandMagicSparkles} />
          <span>{line.japanese}</span>
        </p>
        {line.kana && (
          <p className={cx("bubbleLine", "kana")}>
            <FontAwesomeIcon className={cx("lineIcon")} icon={faArrowTurnDown} />
            <span>{line.kana}</span>
          </p>
        )}
        {line.vietnamese && (
          <p className={cx("bubbleLine", "meaning")}>
            <FontAwesomeIcon className={cx("lineIcon")} icon={faArrowTurnDown} />
            <span>{line.vietnamese}</span>
          </p>
        )}
      </div>
      {isUser && <span className={cx("avatar", "avatarA")}>A</span>}
    </div>
  );
}

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().replace(/[\s\u3000、。！？…　・「」『』（）?.,!]/g, '');
  const s2 = str2.toLowerCase().replace(/[\s\u3000、。！？…　・「」『』（）?.,!]/g, '');
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

function SpeechResult({ expectedLine, transcript, kuroshiro }) {
  const [kanaTranscript, setKanaTranscript] = useState("");

  useEffect(() => {
    let isMounted = true;
    if (kuroshiro && transcript) {
      kuroshiro.convert(transcript, { to: "hiragana" })
        .then(res => {
          if (isMounted) setKanaTranscript(res);
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [transcript, kuroshiro]);

  const expectedText = expectedLine?.japanese || "";
  const expectedKana = expectedLine?.kana || "";

  const score1 = calculateSimilarity(expectedText, transcript);
  const score2 = calculateSimilarity(expectedKana, transcript);
  const score3 = calculateSimilarity(expectedKana, kanaTranscript || transcript);

  const similarity = Math.max(score1, score2, score3);
  const passed = similarity >= 60;

  return (
    <div className={cx("speechResult")}>
      <div className={cx("srRow")}>
        <span className={cx("srLabel")}>Bạn đã nói:</span>
        <span className={cx("srText")}>{transcript}</span>
      </div>
      <div className={cx("srRow")}>
        <span className={cx("srLabel")}>Mẫu:</span>
        <span className={cx("srMuted")}>{expectedKana}</span>
      </div>
      <div className={cx("srScore", { passed, failed: !passed })}>
        <FontAwesomeIcon icon={passed ? faCircleCheck : faTriangleExclamation} />
        <span>Độ khớp: {similarity}%</span>
      </div>
    </div>
  );
}

function ConversationChat({ lesson, lines, kuroshiro }) {
  const [revealed, setRevealed] = useState(0);
  const [userTurn, setUserTurn] = useState(false);
  const [finished, setFinished] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const rateRef = useRef(0.9);
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);
  const spokenRef = useRef(-1);

  const speak = useCallback((line, onDone) => {
    const text = line?.japanese || "";

    if (!("speechSynthesis" in window) || !text) {
      setTimeout(onDone, 600);
      return () => {};
    }

    window.speechSynthesis.cancel();

    const sentences = text.split(/(?<=[。])/).filter(Boolean);
    let cancelled = false;
    let currentIdx = 0;

    const speakNext = () => {
      if (cancelled) return;
      if (currentIdx >= sentences.length) {
        onDone();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentences[currentIdx]);
      utterance.lang = "ja-JP";
      utterance.rate = rateRef.current;
      utterance.pitch = 1;
      utterance.volume = 1;

      let resolved = false;
      const next = () => {
        if (resolved) return;
        resolved = true;
        currentIdx++;
        setTimeout(speakNext, 120);
      };

      utterance.onend = next;
      utterance.onerror = next;

      window.speechSynthesis.speak(utterance);

      const fallbackMs = Math.max(3000, sentences[currentIdx].length * 180);
      setTimeout(next, fallbackMs);
    };

    speakNext();

    return () => {
      cancelled = true;
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (finished) return undefined;

    if (revealed === 0) {
      if (lines.length > 0) setRevealed(1);
      return undefined;
    }

    const idx = revealed - 1;
    const line = lines[idx];
    if (!line) return undefined;

    if (spokenRef.current === idx) return undefined;
    spokenRef.current = idx;

    const isB = sideOf(idx) === "B";

    const cleanup = speak(line, () => {
      if (isB) {
        if (idx + 1 < lines.length) {
          setRevealed(idx + 2);
        } else {
          setFinished(true);
        }
      } else {
        setUserTurn(true);
      }
    });

    return cleanup;
  }, [revealed, lines, finished, speak]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [revealed, transcript, userTurn]);

  const handleMic = useCallback(() => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setError("Trình duyệt chưa hỗ trợ nhận diện giọng nói.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    window.speechSynthesis?.cancel();
    const recognition = new Recognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join("");
      setTranscript(text);
    };

    recognition.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") {
        setListening(false);
        return;
      }
      setError("Không nhận được giọng nói. Hãy kiểm tra quyền micro.");
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setError("");
    setTranscript("");
    setListening(true);
    recognition.start();
  }, [listening]);

  const handleSkip = useCallback(() => {
    recognitionRef.current?.abort();
    setListening(false);
    setTranscript("");
    setUserTurn(false);
    if (revealed < lines.length) {
      setRevealed(revealed + 1);
    } else {
      setFinished(true);
    }
  }, [revealed, lines.length]);

  const handleNext = useCallback(() => {
    setListening(false);
    setTranscript("");
    setUserTurn(false);
    if (revealed < lines.length) {
      setRevealed(revealed + 1);
    } else {
      setFinished(true);
    }
  }, [revealed, lines.length]);

  const visibleLines = lines.slice(0, revealed);

  const currentUserLine = userTurn ? lines[revealed - 1] : null;

  const setRate = (val) => {
    rateRef.current = val;
  };

  return (
    <section className={cx("chat")}>
      <header className={cx("chatHead")}>
        <h1>{lesson?.title}</h1>
        <div className={cx("headActions")}>
          <button type="button" aria-label="Cài đặt" onClick={() => setShowSettings((v) => !v)}>
            <FontAwesomeIcon icon={faGear} />
          </button>
          <button type="button" aria-label="Gợi ý" className={cx("hintBtn")} onClick={() => setShowHint(true)}>
            <FontAwesomeIcon icon={faLightbulb} />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className={cx("settingsPanel")}>
          <label>
            Tốc độ đọc: <strong>{rateRef.current}x</strong>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              defaultValue={0.9}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </label>
        </div>
      )}

      {showHint && (
        <div className={cx("hintOverlay")} onClick={() => setShowHint(false)}>
          <div className={cx("hintPopup")} onClick={(e) => e.stopPropagation()}>
            <h4>Gợi ý luyện nói</h4>
            <ul>
              <li>Nhấn mic để đọc lại câu của người học (A), nhấn lần nữa để dừng</li>
              <li>Hệ thống so sánh giọng nói với câu mẫu và hiển thị độ khớp</li>
              <li>Đạt từ 60% là khá tốt — không cần giống 100%</li>
              <li>Nếu thấy khó, giảm tốc độ đọc trong Cài đặt</li>
            </ul>
            <button type="button" onClick={() => setShowHint(false)}>Đã hiểu</button>
          </div>
        </div>
      )}

      <div className={cx("messages")} ref={scrollRef}>
        {visibleLines.map((line, index) => (
          <ChatBubble key={`${line.japanese}-${index}`} line={line} side={sideOf(index)} />
        ))}
      </div>

      {error && <p className={cx("error")}>{error}</p>}

      {finished ? (
        <p className={cx("finished")}>Hoàn thành hội thoại 🎉</p>
      ) : userTurn ? (
        <div className={cx("micWrap")}>
          {transcript ? (
            <>
              <SpeechResult expectedLine={currentUserLine} transcript={transcript} kuroshiro={kuroshiro} />
              {!listening && (
                <button type="button" className={cx("nextButton")} onClick={handleNext}>
                  Tiếp tục
                </button>
              )}
            </>
          ) : (
            <p className={cx("micHint")}>Tới lượt bạn — bấm mic để nói lại</p>
          )}
          <div className={cx("micRow")}>
            <button
              type="button"
              className={cx("micButton", { active: listening })}
              onClick={handleMic}
              aria-label="Ghi âm luyện nói"
            >
              <FontAwesomeIcon icon={listening ? faCircleStop : faMicrophone} />
            </button>
            <button type="button" className={cx("skipButton")} onClick={handleSkip}>
              Bỏ qua
            </button>
          </div>
        </div>
      ) : (
        <div className={cx("micWrap")}>
          <p className={cx("micHint")}>Đang nói...</p>
        </div>
      )}
    </section>
  );
}

export default ConversationChat;
