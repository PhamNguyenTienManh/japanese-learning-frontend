import { useEffect, useRef, useState } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faMicrophone,
  faCircleStop,
  faWandMagicSparkles,
  faUser,
  faFlagCheckered,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import { createSession, streamMessage } from "~/services/aiService";
import styles from "./AiConversation.module.scss";

const cx = classNames.bind(styles);

function getRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function buildScenarioPrompt(lesson) {
  const topic = lesson?.title || "giao tiếp hằng ngày";
  const level = lesson?.level || "N5";
  return (
    `Từ giờ hãy đóng vai bạn hội thoại tiếng Nhật để mình luyện nói về chủ đề "${topic}" ` +
    `(trình độ ${level}). Quy tắc: mỗi lượt bạn nói NGẮN (1-2 câu) bằng tiếng Nhật, ` +
    `kèm phiên âm hiragana trong ngoặc và nghĩa tiếng Việt ở dòng dưới. ` +
    `Luôn kết thúc bằng một câu hỏi để mình trả lời. Nếu mình viết sai, hãy sửa ngắn gọn rồi tiếp tục hội thoại. ` +
    `Bắt đầu bằng một lời chào và câu hỏi mở đầu về chủ đề này.`
  );
}

const SUMMARY_PROMPT =
  "Kết thúc buổi luyện hội thoại. Hãy tổng kết bằng tiếng Việt: " +
  "1) Những điểm mình làm tốt, 2) Các điểm cần cải thiện (ngữ pháp, từ vựng, cách diễn đạt) kèm ví dụ sửa lại đúng, " +
  "3) Một lời khuyên ngắn để luyện tiếp. Trình bày rõ ràng theo mục.";

function AiConversation({ lesson }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);

  const sessionIdRef = useRef(null);
  const recognitionRef = useRef(null);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const startedRef = useRef(false);

  const scrollToEnd = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(scrollToEnd, [messages, isLoading]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      recognitionRef.current?.abort();
    };
  }, []);

  // Gửi 1 lượt tới AI, stream phản hồi vào tin nhắn assistant mới.
  const sendTurn = async (content, { showUser = true } = {}) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId || isLoading) return;

    const assistantId = `ai-${Date.now()}`;
    let assistantCreated = false;

    setError("");
    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      ...(showUser
        ? [{ id: `me-${Date.now()}`, role: "user", content }]
        : []),
    ]);

    const ensureAssistant = (initial = "") => {
      if (assistantCreated) return;
      assistantCreated = true;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: initial },
      ]);
    };

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      await streamMessage(sessionId, content, {
        signal: abortController.signal,
        onChunk: (text) => {
          if (!text) return;
          ensureAssistant("");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + text } : m,
            ),
          );
        },
        onDone: (event) => {
          if (!assistantCreated) {
            ensureAssistant(event?.aiMessage || "…");
          } else if (event?.aiMessage) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: event.aiMessage } : m,
              ),
            );
          }
        },
        onError: (err) => {
          if (err?.name === "AbortError") return;
          if (err?.code === "DAILY_AI_LIMIT_EXCEEDED") {
            setError("Bạn đã dùng hết lượt AI hôm nay. Quay lại vào ngày mai.");
          } else {
            setError("Có lỗi khi kết nối AI. Vui lòng thử lại.");
          }
          if (!assistantCreated) {
            setMessages((prev) =>
              prev.filter((m) => m.id !== assistantId),
            );
          }
        },
      });
    } catch (err) {
      if (err?.name !== "AbortError") {
        setError("Có lỗi khi kết nối AI. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  // Khởi tạo session + lời mở đầu của AI
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        setIsStarting(true);
        const response = await createSession();
        const session = response?.success ? response.data : response;
        sessionIdRef.current = session?._id;
        setIsStarting(false);
        if (sessionIdRef.current) {
          await sendTurn(buildScenarioPrompt(lesson), { showUser: false });
        } else {
          setError("Không tạo được phiên trò chuyện với AI.");
        }
      } catch {
        setIsStarting(false);
        setError("Không tạo được phiên trò chuyện với AI.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading || finished) return;
    setInput("");
    recognitionRef.current?.abort();
    setListening(false);
    sendTurn(text);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleMic = () => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setError("Trình duyệt chưa hỗ trợ nhận diện giọng nói.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((r) => r[0]?.transcript || "")
        .join("");
      setInput(text);
    };
    recognition.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setError("Không nhận được giọng nói. Hãy kiểm tra quyền micro.");
      }
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setError("");
    setListening(true);
    recognition.start();
  };

  const handleFinish = async () => {
    if (isLoading || finished || !sessionIdRef.current) return;
    setFinished(true);
    recognitionRef.current?.abort();
    setListening(false);
    await sendTurn(SUMMARY_PROMPT, {
      showUser: false,
    });
  };

  return (
    <section className={cx("chat")}>
      <header className={cx("chatHead")}>
        <h1>
          <FontAwesomeIcon icon={faWandMagicSparkles} /> Luyện hội thoại với AI
        </h1>
        <span className={cx("topic")}>{lesson?.title}</span>
      </header>

      <div className={cx("messages")} ref={scrollRef}>
        {isStarting && (
          <p className={cx("systemNote")}>
            <FontAwesomeIcon icon={faSpinner} spin /> Đang kết nối với AI...
          </p>
        )}

        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              className={cx("bubbleRow", { user: isUser })}
            >
              {!isUser && (
                <span className={cx("avatar", "avatarAi")}>
                  <FontAwesomeIcon icon={faWandMagicSparkles} />
                </span>
              )}
              <div className={cx("bubble", { user: isUser })}>
                {message.content ? (
                  <p className={cx("bubbleText")}>{message.content}</p>
                ) : (
                  <p className={cx("bubbleText", "typing")}>
                    <FontAwesomeIcon icon={faSpinner} spin /> Đang soạn...
                  </p>
                )}
              </div>
              {isUser && (
                <span className={cx("avatar", "avatarUser")}>
                  <FontAwesomeIcon icon={faUser} />
                </span>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className={cx("error")}>{error}</p>}

      {finished ? (
        <p className={cx("finished")}>
          <FontAwesomeIcon icon={faFlagCheckered} /> Buổi luyện đã kết thúc.
          Xem nhận xét của AI ở trên.
        </p>
      ) : (
        <div className={cx("composer")}>
          <button
            type="button"
            className={cx("micButton", { active: listening })}
            onClick={handleMic}
            disabled={isStarting}
            aria-label="Nói bằng giọng nói"
          >
            <FontAwesomeIcon icon={listening ? faCircleStop : faMicrophone} />
          </button>
          <textarea
            className={cx("input")}
            placeholder="Nhập câu trả lời tiếng Nhật của bạn..."
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStarting}
          />
          <button
            type="button"
            className={cx("sendButton")}
            onClick={handleSend}
            disabled={isStarting || isLoading || !input.trim()}
            aria-label="Gửi"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
          <button
            type="button"
            className={cx("finishButton")}
            onClick={handleFinish}
            disabled={isStarting || isLoading || messages.length < 2}
          >
            <FontAwesomeIcon icon={faFlagCheckered} />
            <span>Kết thúc & nhận xét</span>
          </button>
        </div>
      )}
    </section>
  );
}

export default AiConversation;
