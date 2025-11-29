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
} from "@fortawesome/free-solid-svg-icons";

// Import API functions
import {
  sendMessage,
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

function ChatAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { isLoggedIn } = useAuth();

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  useEffect(() => {
    // Chỉ scroll khi có message mới và không đang loading
    if (messages.length > 0 && !isLoading) {
      // Delay nhỏ để đảm bảo DOM đã render xong
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [messages, isLoading]);

  // Khởi tạo session khi component mount
  useEffect(() => {
    initializeSession();
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
        setIsInitializing(false); // Kết thúc trạng thái loading
        return; // Không init session nếu chưa login
      }
      // Gọi API để lấy session cuối cùng của user
      console.log("Fetching user's last session...");
      const sessionResponse = await getUserLastSession();

      // Kiểm tra xem có session hay không
      if (sessionResponse && sessionResponse.success && sessionResponse.data) {
        // ĐÃ CÓ SESSION - Load lịch sử
        const sessionData = sessionResponse.data;
        console.log("Found existing session:", sessionData._id);
        console.log("Session messages:", sessionData.messages); // Debug messages
        setSessionId(sessionData._id);

        if (sessionData.messages && sessionData.messages.length > 0) {
          // Format messages từ API
          const formattedMessages = sessionData.messages
            .filter((msg) => msg && msg.content) // Lọc bỏ messages không hợp lệ
            .map((msg, index) => ({
              id: msg._id || index.toString(),
              role: msg.role === "ai" ? "assistant" : msg.role, // Chuyển "ai" thành "assistant"
              content: msg.content,
              timestamp: new Date(msg.timestamp),
            }));
          setMessages(formattedMessages);
        } else {
          // Session có nhưng chưa có tin nhắn
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
        // CHƯA CÓ SESSION - Tạo mới
        console.log("No existing session, creating new one...");
        const newSessionResponse = await createSession();

        if (
          newSessionResponse &&
          newSessionResponse.success &&
          newSessionResponse.data
        ) {
          const newSessionData = newSessionResponse.data;
          setSessionId(newSessionData._id);
          console.log("Created new session:", newSessionData._id);

          // Hiển thị message chào mừng
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

      // Nếu lỗi là do chưa có session (404 hoặc data null), thử tạo mới
      if (error.message.includes("404") || error.message.includes("null")) {
        try {
          console.log("Creating new session after error...");
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
          // Set sessionId tạm để không block UI
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
        // Lỗi khác
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

    try {
      // Gửi message đến API
      const response = await sendMessage(sessionId, textToSend);
      console.log("Send message response:", response); // Debug response

      if (response && response.success && response.data) {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.data.aiMessage, // Sửa từ response.data.response thành aiMessage
          timestamp: new Date(response.data.timestamp || Date.now()),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error("Invalid response from API");
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Hiển thị thông báo lỗi
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Xin lỗi, đã có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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

  // Hàm tạo cuộc trò chuyện mới
  const handleNewChat = async () => {
    try {
      setIsInitializing(true);
      setMessages([]);

      // Tạo session mới
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

  // Hiển thị loading khi đang khởi tạo
  if (isInitializing) {
    return (
      <div className={cx("wrapper")}>
        <main className={cx("main")}>
          <div className={cx("container")}>
            <div className={cx("header")}>
              <div className={cx("header-title")}>
                <FontAwesomeIcon icon={faRobot} className={cx("header-icon")} />
                <h1>AI Chat</h1>
              </div>
              <p className={cx("header-subtitle")}>Đang khởi tạo...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
                          {(message.content || "")
                            .split("\n")
                            .map((line, i) => (
                              <span key={i}>
                                {line}
                                {i <
                                  (message.content || "").split("\n").length -
                                  1 && <br />}
                              </span>
                            ))}
                        </p>
                      </div>
                      <span className={cx("timestamp")}>
                        {(() => {
                          const now = new Date();
                          const msgDate = new Date(message.timestamp);

                          const isToday =
                            now.getFullYear() === msgDate.getFullYear() &&
                            now.getMonth() === msgDate.getMonth() &&
                            now.getDate() === msgDate.getDate();

                          if (isToday) {
                            // Chỉ hiển thị giờ và phút
                            return msgDate.toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                          } else {
                            // Hiển thị ngày + giờ
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

            {/* Suggested prompts */}
            {messages.length <= 1 && (
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
                      disabled={isLoading}
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
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu hỏi của bạn..."
                  className={cx("chat-input")}
                  disabled={isLoading || !sessionId}
                />
                <Button
                  primary
                  className={cx("chat")}
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading || !sessionId}
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
