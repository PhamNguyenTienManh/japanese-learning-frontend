import { useState, useRef, useEffect } from "react";
import classNames from "classnames/bind";
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
  faPen,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

const suggestedPrompts = [
  "Giải thích ngữ pháp て形 cho tôi",
  "Cho tôi 5 câu ví dụ với から",
  "Sự khác biệt giữa は và が là gì?",
  "Luyện hội thoại đặt món ăn ở nhà hàng",
];

function ChatAI() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "assistant",
      content:
        "こんにちは！Xin chào! Tôi là trợ lý AI học tiếng Nhật của bạn. Tôi có thể giúp bạn:\n\n• Giải thích ngữ pháp và từ vựng\n• Luyện hội thoại tiếng Nhật\n• Trả lời câu hỏi về JLPT\n• Kiểm tra và sửa lỗi câu văn\n\nBạn muốn học gì hôm nay?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (messageText) => {
    const textToSend = messageText || input;

    if (!textToSend.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Fake AI trả lời
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Tôi đã nhận được câu hỏi của bạn: "${textToSend}"\n\nĐây là một câu trả lời mẫu. Trong phiên bản thực tế, tôi sẽ sử dụng AI để trả lời chi tiết và chính xác hơn về ngữ pháp, từ vựng và hội thoại tiếng Nhật.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Header */}
          <div className={cx("header")}>
            <div className={cx("header-title")}>
              <FontAwesomeIcon icon={faRobot} className={cx("header-icon")} />
              <h1>AI Chat</h1>
            </div>
            <p className={cx("header-subtitle")}>
              Trợ lý AI học tiếng Nhật của bạn
            </p>
          </div>

          {/* Chat */}
          <Card className={cx("chat-card")}>
            {/* Messages */}
            <div className={cx("messages")}>
              {messages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id}
                    className={cx("message-row", { user: isUser })}
                  >
                    {/* Avatar */}
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

                    {/* Content */}
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
                          {message.content.split("\n").map((line, i) => (
                            <span key={i}>
                              {line}
                              {i < message.content.split("\n").length - 1 && (
                                <br />
                              )}
                            </span>
                          ))}
                        </p>
                      </div>
                      <span className={cx("timestamp")}>
                        {message.timestamp.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className={cx("message-row")}>
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
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested prompts – chỉ hiện khi chưa có message user */}
            {messages.length === 1 && (
              <div className={cx("suggestions")}>
                <p className={cx("suggestions-title")}>
                  <FontAwesomeIcon
                    icon={faLightbulb}
                    className={cx("suggestions-icon")}
                  />
                  Gợi ý câu hỏi:
                </p>
                <div className={cx("suggestions-grid")}>
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      type="button"
                      className={cx("suggestion-btn")}
                      onClick={() => handleSend(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className={cx("input-area")}>
              <div className={cx("input-row")}>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Nhập câu hỏi của bạn..."
                  className={"chat-input"}
                />
                <Button
                  primary
                  className={cx("chat")}
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  leftIcon={<FontAwesomeIcon icon={faPaperPlane} />}
                />
              </div>
              <p className={cx("input-note")}>
                Nhấn Enter để gửi, Shift + Enter để xuống dòng
              </p>
            </div>
          </Card>

          {/* Feature cards */}
          <div className={cx("features")}>
            <Card className={cx("feature-card")}>
              <div className={cx("feature-icon-wrap")}>
                <FontAwesomeIcon
                  icon={faBookOpen}
                  className={cx("feature-icon")}
                />
              </div>
              <div>
                <p className={cx("feature-title")}>Giải thích ngữ pháp</p>
                <p className={cx("feature-subtitle")}>Chi tiết và dễ hiểu</p>
              </div>
            </Card>

            <Card className={cx("feature-card")}>
              <div className={cx("feature-icon-wrap")}>
                <FontAwesomeIcon
                  icon={faComments}
                  className={cx("feature-icon")}
                />
              </div>
              <div>
                <p className={cx("feature-title")}>Luyện hội thoại</p>
                <p className={cx("feature-subtitle")}>Thực hành giao tiếp</p>
              </div>
            </Card>

            <Card className={cx("feature-card")}>
              <div className={cx("feature-icon-wrap")}>
                <FontAwesomeIcon icon={faStar} className={cx("feature-icon")} />
              </div>
              <div>
                <p className={cx("feature-title")}>Sửa lỗi câu văn</p>
                <p className={cx("feature-subtitle")}>Cải thiện kỹ năng</p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ChatAI;
