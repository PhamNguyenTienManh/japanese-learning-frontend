import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ChatAI.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faRobot,
  faUser,
  faStar,
  faBookOpen,
  faComments,
  faLightbulb,
  faArrowRight,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import config from "~/config";

// Import API functions
import {
  streamMessage,
  getUserLastSession,
  createSession,
} from "~/services/aiService";
import { useAuth } from "~/context/AuthContext";

const cx = classNames.bind(styles);

const suggestedPrompts = [
  "Giải thích ngữ pháp て形 cho tôi",
  "Cho tôi 5 câu ví dụ với から",
  "Sự khác biệt giữa は và が là gì?",
  "Luyện hội thoại đặt món ăn ở nhà hàng",
];

const easeOut = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

function ChatAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const { isLoggedIn, isPremium } = useAuth();
  const navigate = useNavigate();

  const messagesEndRef = useRef(null);

  const handleActionClick = (action) => {
    if (!action) return;
    if (action.type === "view_notebook" && action.notebookId) {
      navigate(`${config.routes.notebook}/${action.notebookId}`);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [messages, isLoading]);

  useEffect(() => {
    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeSession = async () => {
    try {
      setIsInitializing(true);
      if (!isLoggedIn) {
        setMessages([
          {
            id: "login-required",
            role: "assistant",
            content:
              "⚠️ Bạn cần đăng nhập để sử dụng tính năng chat với AI.\nVui lòng đăng nhập để tiếp tục.",
            timestamp: new Date(),
          },
        ]);
        setIsInitializing(false);
        return;
      }
      const sessionResponse = await getUserLastSession();

      if (sessionResponse && sessionResponse.success && sessionResponse.data) {
        const sessionData = sessionResponse.data;
        setSessionId(sessionData._id);

        if (sessionData.messages && sessionData.messages.length > 0) {
          const formattedMessages = sessionData.messages
            .filter((msg) => msg && msg.content)
            .map((msg, index) => ({
              id: msg._id || index.toString(),
              role: msg.role === "ai" ? "assistant" : msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              actions: Array.isArray(msg.actions) ? msg.actions : [],
            }));
          setMessages(formattedMessages);
        } else {
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content:
                "こんにちは！Xin chào! Tôi là trợ lý AI học tiếng Nhật của bạn. Tôi có thể giúp bạn:\n\n• Giải thích ngữ pháp và từ vựng\n• Luyện hội thoại tiếng Nhật\n• Trả lời câu hỏi về JLPT\n• Kiểm tra và sửa lỗi câu văn\n\nBạn muốn học gì hôm nay?",
              timestamp: new Date(),
            },
          ]);
        }
      } else {
        const newSessionResponse = await createSession();

        if (
          newSessionResponse &&
          newSessionResponse.success &&
          newSessionResponse.data
        ) {
          const newSessionData = newSessionResponse.data;
          setSessionId(newSessionData._id);

          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content:
                "こんにちは！Xin chào! Tôi là trợ lý AI học tiếng Nhật của bạn. Tôi có thể giúp bạn:\n\n• Giải thích ngữ pháp và từ vựng\n• Luyện hội thoại tiếng Nhật\n• Trả lời câu hỏi về JLPT\n• Kiểm tra và sửa lỗi câu văn\n\nBạn muốn học gì hôm nay?",
              timestamp: new Date(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error initializing session:", error);

      if (error.message.includes("404") || error.message.includes("null")) {
        try {
          const newSessionResponse = await createSession();

          if (
            newSessionResponse &&
            newSessionResponse.success &&
            newSessionResponse.data
          ) {
            setSessionId(newSessionResponse.data._id);

            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content:
                  "こんにちは！Xin chào! Tôi là trợ lý AI học tiếng Nhật của bạn. Tôi có thể giúp bạn:\n\n• Giải thích ngữ pháp và từ vựng\n• Luyện hội thoại tiếng Nhật\n• Trả lời câu hỏi về JLPT\n• Kiểm tra và sửa lỗi câu văn\n\nBạn muốn học gì hôm nay?",
                timestamp: new Date(),
              },
            ]);
          }
        } catch (createError) {
          console.error("Error creating session:", createError);
          setSessionId(`temp-${Date.now()}`);

          setMessages([
            {
              id: "error",
              role: "assistant",
              content:
                "⚠️ Không thể kết nối với server. Vui lòng kiểm tra kết nối và thử lại.",
              timestamp: new Date(),
            },
          ]);
        }
      } else {
        setSessionId(`temp-${Date.now()}`);

        setMessages([
          {
            id: "error",
            role: "assistant",
            content:
              "⚠️ Không thể kết nối với server. Vui lòng kiểm tra kết nối và thử lại.",
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;

    if (!textToSend.trim() || isLoading || !sessionId) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setTimeout(() => scrollToBottom(), 150);

    const assistantId = `${Date.now() + 1}`;
    let assistantCreated = false;
    let streamErrored = false;

    const ensureAssistantMessage = (initialContent) => {
      if (assistantCreated) return;
      assistantCreated = true;
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: initialContent,
          timestamp: new Date(),
          actions: [],
        },
      ]);
    };

    const appendChunk = (text) => {
      if (!text) return;
      if (!assistantCreated) {
        ensureAssistantMessage(text);
        return;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: m.content + text } : m,
        ),
      );
    };

    const appendAction = (action) => {
      if (!action) return;
      if (!assistantCreated) {
        ensureAssistantMessage("");
      }
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantId) return m;
          const existing = m.actions || [];
          if (
            existing.some(
              (a) =>
                a.type === action.type && a.notebookId === action.notebookId,
            )
          ) {
            return m;
          }
          return { ...m, actions: [...existing, action] };
        }),
      );
    };

    try {
      await streamMessage(sessionId, textToSend, {
        onChunk: (text) => appendChunk(text),
        onAction: (action) => appendAction(action),
        onDone: (event) => {
          if (!assistantCreated && event?.aiMessage) {
            ensureAssistantMessage(event.aiMessage);
          }
          if (event?.timestamp) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, timestamp: new Date(event.timestamp) }
                  : m,
              ),
            );
          }
          if (Array.isArray(event?.actions) && event.actions.length > 0) {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantId) return m;
                const merged = [...(m.actions || [])];
                event.actions.forEach((a) => {
                  if (
                    !merged.some(
                      (x) =>
                        x.type === a.type && x.notebookId === a.notebookId,
                    )
                  ) {
                    merged.push(a);
                  }
                });
                return { ...m, actions: merged };
              }),
            );
          }
        },
        onError: (err) => {
          streamErrored = true;
          console.error("Stream error:", err);
          if (!assistantCreated) {
            ensureAssistantMessage(
              "Xin lỗi, đã có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại.",
            );
          }
        },
      });

      if (!assistantCreated && !streamErrored) {
        ensureAssistantMessage("Xin lỗi, mình chưa có phản hồi phù hợp.");
      }
    } catch (error) {
      console.error("Error streaming message:", error);
      if (!assistantCreated) {
        ensureAssistantMessage(
          "Xin lỗi, đã có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = async () => {
    try {
      setIsInitializing(true);
      setMessages([]);

      const newSessionResponse = await createSession();

      if (
        newSessionResponse &&
        newSessionResponse.success &&
        newSessionResponse.data
      ) {
        setSessionId(newSessionResponse.data._id);

        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "こんにちは！Xin chào! Tôi là trợ lý AI học tiếng Nhật của bạn. Tôi có thể giúp bạn:\n\n• Giải thích ngữ pháp và từ vựng\n• Luyện hội thoại tiếng Nhật\n• Trả lời câu hỏi về JLPT\n• Kiểm tra và sửa lỗi câu văn\n\nBạn muốn học gì hôm nay?",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  if (isInitializing) {
    return (
      <div className={cx("wrapper")}>
        <div className={cx("blob1")} />
        <div className={cx("blob2")} />
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("header")}>
              <div className={cx("header-title")}>
                <span className={cx("header-icon-wrap")}>
                  <FontAwesomeIcon icon={faRobot} className={cx("header-icon")} />
                </span>
                <h1>AI Chat</h1>
              </div>
              <p className={cx("header-subtitle")}>Đang khởi tạo phiên...</p>
              <div className={cx("loaderBar")}>
                <span />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isLoggedIn && !isPremium) {
    return (
      <div className={cx("wrapper")}>
        <div className={cx("blob1")} />
        <div className={cx("blob2")} />
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("header")}>
              <div className={cx("header-title")}>
                <span className={cx("header-icon-wrap")}>
                  <FontAwesomeIcon icon={faRobot} className={cx("header-icon")} />
                </span>
                <h1>AI Chat</h1>
              </div>
              <p className={cx("header-subtitle")}>
                Tính năng nâng cao. Nâng cấp để sử dụng không giới hạn.
              </p>
            </div>

            <Card className={cx("upgrade-card")}>
              <p>Bạn chưa mở khoá tính năng Chat AI nâng cao.</p>
              <div className={cx("upgrade-actions")}>
                <Button to={`/payment?plan=Pro`} primary>
                  Nâng cấp lên Pro
                </Button>
                <Button to="/" outline>
                  Quay lại
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={cx("wrapper")}>
      <motion.div
        className={cx("blob1")}
        animate={{ y: [0, -22, 0], x: [0, 14, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={cx("blob2")}
        animate={{ y: [0, 18, 0], x: [0, -12, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Header */}
          <motion.div
            className={cx("header")}
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.div className={cx("header-title")} variants={fadeUp}>
              <motion.span
                className={cx("header-icon-wrap")}
                animate={{ y: [0, -3, 0] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <FontAwesomeIcon icon={faRobot} className={cx("header-icon")} />
              </motion.span>
              <h1>
                AI <span className={cx("title-accent")}>Chat</span>
              </h1>
            </motion.div>
            <motion.p className={cx("header-subtitle")} variants={fadeUp}>
              Trợ lý AI học tiếng Nhật của bạn — học, hỏi, trò chuyện 24/7
            </motion.p>
            <motion.div className={cx("header-actions")} variants={fadeUp}>
              <button
                type="button"
                className={cx("newChatBtn")}
                onClick={handleNewChat}
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Cuộc trò chuyện mới</span>
              </button>
            </motion.div>
          </motion.div>

          {/* Chat */}
          <motion.div
            className={cx("chat-shell")}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut, delay: 0.1 }}
          >
            <div className={cx("chat-card")}>
              {/* Messages */}
              <div className={cx("messages")}>
                <AnimatePresence initial={false}>
                  {messages.map((message) => {
                    const isUser = message.role === "user";

                    return (
                      <motion.div
                        key={message.id}
                        layout
                        className={cx("message-row", { user: isUser })}
                        initial={{
                          opacity: 0,
                          y: 12,
                          x: isUser ? 18 : -18,
                        }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35, ease: easeOut }}
                      >
                        <div
                          className={cx("avatar", {
                            "avatar-user": isUser,
                            "avatar-assistant": !isUser,
                          })}
                        >
                          <FontAwesomeIcon
                            icon={isUser ? faUser : faRobot}
                            className={cx("avatar-icon")}
                          />
                        </div>

                        <div
                          className={cx("message-body", {
                            "message-body-user": isUser,
                            "message-body-assistant": !isUser,
                          })}
                        >
                          <div
                            className={cx("bubble", {
                              "bubble-user": isUser,
                              "bubble-assistant": !isUser,
                            })}
                          >
                            <p className={cx("bubble-text")}>
                              {(message.content || "")
                                .split("\n")
                                .map((line, i) => (
                                  <span key={i}>
                                    {line}
                                    {i <
                                      (message.content || "").split("\n")
                                        .length -
                                        1 && <br />}
                                  </span>
                                ))}
                            </p>
                          </div>
                          {!isUser &&
                            Array.isArray(message.actions) &&
                            message.actions.length > 0 && (
                              <div className={cx("message-actions")}>
                                {message.actions.map((action, idx) => (
                                  <motion.button
                                    key={`${action.type}-${action.notebookId || idx}`}
                                    type="button"
                                    className={cx("message-action-btn")}
                                    onClick={() => handleActionClick(action)}
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                  >
                                    <FontAwesomeIcon icon={faBookOpen} />
                                    <span>
                                      {action.label || "Xem sổ tay"}
                                    </span>
                                    <FontAwesomeIcon icon={faArrowRight} />
                                  </motion.button>
                                ))}
                              </div>
                            )}
                          <span className={cx("timestamp")}>
                            {(() => {
                              const now = new Date();
                              const msgDate = new Date(message.timestamp);

                              const isToday =
                                now.getFullYear() === msgDate.getFullYear() &&
                                now.getMonth() === msgDate.getMonth() &&
                                now.getDate() === msgDate.getDate();

                              if (isToday) {
                                return msgDate.toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });
                              } else {
                                return msgDate.toLocaleString("vi-VN", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });
                              }
                            })()}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {isLoading && (
                  <motion.div
                    className={cx("message-row")}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className={cx("avatar", "avatar-assistant")}>
                      <FontAwesomeIcon
                        icon={faRobot}
                        className={cx("avatar-icon")}
                      />
                    </div>
                    <div className={cx("typing-bubble")}>
                      <div className={cx("typing-dots")}>
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggested prompts */}
              <AnimatePresence>
                {messages.length <= 1 && (
                  <motion.div
                    className={cx("suggestions")}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4, ease: easeOut }}
                  >
                    <p className={cx("suggestions-title")}>
                      <FontAwesomeIcon
                        icon={faLightbulb}
                        className={cx("suggestions-icon")}
                      />
                      Gợi ý câu hỏi
                    </p>
                    <motion.div
                      className={cx("suggestions-grid")}
                      variants={stagger}
                      initial="hidden"
                      animate="show"
                    >
                      {suggestedPrompts.map((prompt, index) => (
                        <motion.button
                          key={index}
                          type="button"
                          className={cx("suggestion-btn")}
                          onClick={() => handleSend(prompt)}
                          disabled={isLoading}
                          variants={fadeUp}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className={cx("suggestion-text")}>{prompt}</span>
                          <FontAwesomeIcon
                            icon={faArrowRight}
                            className={cx("suggestion-arrow")}
                          />
                        </motion.button>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input */}
              <div className={cx("input-area")}>
                <div className={cx("input-row")}>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập câu hỏi của bạn..."
                    className={cx("chat-input")}
                    disabled={isLoading || !sessionId}
                  />
                  <motion.button
                    type="button"
                    className={cx("sendBtn")}
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading || !sessionId}
                    whileHover={
                      !isLoading && input.trim() ? { scale: 1.05 } : {}
                    }
                    whileTap={
                      !isLoading && input.trim() ? { scale: 0.95 } : {}
                    }
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </motion.button>
                </div>
                <p className={cx("input-note")}>
                  Nhấn <kbd>Enter</kbd> để gửi, <kbd>Shift</kbd> + <kbd>Enter</kbd>{" "}
                  để xuống dòng
                </p>
              </div>
            </div>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            className={cx("features")}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            {[
              {
                icon: faBookOpen,
                title: "Giải thích ngữ pháp",
                subtitle: "Chi tiết và dễ hiểu",
                tone: "teal",
              },
              {
                icon: faComments,
                title: "Luyện hội thoại",
                subtitle: "Thực hành giao tiếp",
                tone: "orange",
              },
              {
                icon: faStar,
                title: "Sửa lỗi câu văn",
                subtitle: "Cải thiện kỹ năng",
                tone: "yellow",
              },
            ].map((f) => (
              <motion.div
                key={f.title}
                className={cx("feature-card")}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
              >
                <div className={cx("feature-icon-wrap", `tone-${f.tone}`)}>
                  <FontAwesomeIcon
                    icon={f.icon}
                    className={cx("feature-icon")}
                  />
                </div>
                <div>
                  <p className={cx("feature-title")}>{f.title}</p>
                  <p className={cx("feature-subtitle")}>{f.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default ChatAI;
