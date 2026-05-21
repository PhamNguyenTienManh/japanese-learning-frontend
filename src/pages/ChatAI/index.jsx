import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Send,
  Sparkles,
  Square,
  Trash2,
  User,
  X,
} from "lucide-react";
import styles from "./ChatAI.module.scss";

import Button from "~/components/Button";
import Card from "~/components/Card";
import config from "~/config";
import { useAuth } from "~/context/AuthContext";
import {
  createSession,
  confirmNotebookAdd,
  deleteSession,
  getSessionHistory,
  getTodayAiUsage,
  getUserSessions,
  streamMessage,
  updateSession,
} from "~/services/aiService";

const cx = classNames.bind(styles);
const DRAFT_SESSION_ID = "draft-session";
const DEFAULT_TITLE = "Cuộc trò chuyện mới";

const suggestedPrompts = [
  "Giải thích ngữ pháp て形 cho tôi",
  "Cho tôi 5 câu ví dụ với から",
  "Sự khác biệt giữa は và が là gì?",
  "Luyện hội thoại đặt món ăn ở nhà hàng",
];

const welcomeText =
  "こんにちは! Mình là trợ lý AI học tiếng Nhật của bạn. Hỏi mình về ngữ pháp, từ vựng, JLPT hoặc luyện hội thoại nhé.";

function unwrap(response) {
  return response?.success ? response.data : response;
}

function formatMessages(session) {
  return (session?.messages || [])
    .filter((message) => message?.content)
    .map((message, index) => ({
      id: message._id || `${message.role}-${message.timestamp || index}`,
      role: message.role === "ai" ? "assistant" : message.role,
      content: message.content,
      timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
      actions: Array.isArray(message.actions)
        ? message.actions.filter((action) => !action?.consumed)
        : [],
    }));
}

function formatMessage(message, fallbackRole = "assistant") {
  const role = message?.role === "ai" ? "assistant" : message?.role || fallbackRole;
  return {
    id:
      message?._id ||
      `${role}-${message?.timestamp || Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`,
    role,
    content: message?.content || "",
    timestamp: message?.timestamp ? new Date(message.timestamp) : new Date(),
    actions: Array.isArray(message?.actions)
      ? message.actions.filter((action) => !action?.consumed)
      : [],
  };
}

function hasConversationContent(conversation) {
  return (conversation?.messages || []).some((message) => message?.content);
}

function isEmptyDefaultConversation(conversation) {
  return (
    !hasConversationContent(conversation) &&
    (!conversation?.title || conversation.title === DEFAULT_TITLE)
  );
}

function formatConversationTitle(conversation) {
  const fallback = conversation?.messages?.find((message) => message?.content);
  return conversation?.title || fallback?.content || DEFAULT_TITLE;
}

function formatConversationTime(value) {
  if (!value) return "Draft";
  const date = new Date(value);
  const now = new Date();
  const isToday =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    ...(isToday ? {} : { day: "2-digit", month: "2-digit" }),
  });
}

function renderInlineMarkdown(text) {
  const nodes = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;
    if (token.startsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function MarkdownMessage({ content }) {
  const blocks = [];
  const lines = (content || "").split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push({
        type: "code",
        content: codeLines.join("\n"),
      });
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        content: heading[2],
      });
      index += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      while (
        index < lines.length &&
        (ordered
          ? /^\s*\d+\.\s+/.test(lines[index])
          : /^\s*[-*]\s+/.test(lines[index]))
      ) {
        items.push(lines[index].replace(/^\s*(?:[-*]|\d+\.)\s+/, ""));
        index += 1;
      }
      blocks.push({ type: ordered ? "ol" : "ul", items });
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("```") &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push({
      type: "paragraph",
      content: paragraphLines.join(" "),
    });
  }

  return (
    <div className={cx("markdown")}>
      {blocks.map((block, blockIndex) => {
        if (block.type === "heading") {
          const HeadingTag = `h${Math.min(block.level + 2, 5)}`;
          return (
            <HeadingTag key={blockIndex}>
              {renderInlineMarkdown(block.content)}
            </HeadingTag>
          );
        }

        if (block.type === "code") {
          return (
            <pre key={blockIndex}>
              <code>{block.content}</code>
            </pre>
          );
        }

        if (block.type === "ul" || block.type === "ol") {
          const ListTag = block.type;
          return (
            <ListTag key={blockIndex}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={blockIndex}>{renderInlineMarkdown(block.content)}</p>
        );
      })}
    </div>
  );
}

function ChatAI() {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [activeSessionId, setActiveSessionId] = useState(DRAFT_SESSION_ID);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openCandidateActionKey, setOpenCandidateActionKey] = useState(null);
  const [declinedActionKeys, setDeclinedActionKeys] = useState([]);
  const [pendingActionKey, setPendingActionKey] = useState(null);
  const [aiUsage, setAiUsage] = useState(null);
  const [quotaMessage, setQuotaMessage] = useState("");

  const { isLoggedIn, isPremium } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const streamAbortControllerRef = useRef(null);
  const streamStoppedRef = useRef(false);
  const consumedActionKeysRef = useRef(new Set());

  const isDraftActive = activeSessionId === DRAFT_SESSION_ID;
  const hasNoQuota = aiUsage && aiUsage.remaining <= 0;

  const draftConversation = useMemo(
    () => ({
      _id: DRAFT_SESSION_ID,
      title: DEFAULT_TITLE,
      messages: [],
      updatedAt: null,
      isDraft: true,
    }),
    [],
  );

  const activeConversation = useMemo(
    () =>
      isDraftActive
        ? draftConversation
        : conversations.find(
            (conversation) => conversation._id === activeSessionId,
          ),
    [activeSessionId, conversations, draftConversation, isDraftActive],
  );

  const displayedConversations = useMemo(() => {
    const persisted = conversations
      .filter((conversation) => !isEmptyDefaultConversation(conversation))
      .sort((a, b) => {
        if (!!a.isPinned !== !!b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      });

    return isDraftActive ? [draftConversation, ...persisted] : persisted;
  }, [conversations, draftConversation, isDraftActive]);

  useEffect(() => {
    if (!isLoggedIn || !isPremium) {
      setIsInitializing(false);
      return;
    }

    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isPremium]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const refreshConversations = async () => {
    const sessions = unwrap(await getUserSessions()) || [];
    setConversations(sessions);
    return sessions;
  };

  const refreshTodayUsage = async () => {
    const usage = unwrap(await getTodayAiUsage());
    setAiUsage(usage);
    return usage;
  };

  const loadSession = async (sessionId) => {
    if (!sessionId || sessionId === DRAFT_SESSION_ID) {
      handleNewChat();
      return;
    }

    setActiveSessionId(sessionId);
    setIsLoading(false);
    setOpenMenuId(null);
    setOpenCandidateActionKey(null);

    const session = unwrap(await getSessionHistory(sessionId));
    setMessages(formatMessages(session));
    setIsSidebarOpen(false);
  };

  const createPersistedSession = async () => {
    const session = unwrap(await createSession());
    setConversations((prev) => [session, ...prev]);
    setActiveSessionId(session._id);
    return session;
  };

  const initializeChat = async () => {
    try {
      setIsInitializing(true);
      const [sessionResponse, usageResponse] = await Promise.all([
        getUserSessions(),
        getTodayAiUsage(),
      ]);
      const sessions = unwrap(sessionResponse) || [];
      setAiUsage(unwrap(usageResponse));
      setConversations(sessions);

      const firstSession = sessions.find(
        (conversation) => !isEmptyDefaultConversation(conversation),
      );

      if (firstSession) {
        await loadSession(firstSession._id);
      } else {
        setActiveSessionId(DRAFT_SESSION_ID);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
      setMessages([
        {
          id: "error",
          role: "assistant",
          content:
            "Không thể kết nối với server. Vui lòng kiểm tra backend và thử lại.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsInitializing(false);
    }
  };

  const updateConversationLocal = (sessionId, updater) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation._id === sessionId ? updater(conversation) : conversation,
      ),
    );
  };

  const hideActionLocal = (actionKey) => {
    if (!actionKey) return;

    setMessages((prev) =>
      prev.map((message) =>
        ({
          ...message,
          actions: (message.actions || []).filter((action, index) => {
            const currentKey = `${message.id}-${action.type}-${
              action.notebookId || index
            }`;
            return currentKey !== actionKey;
          }),
        }),
      ),
    );
  };

  const handleStopGenerating = () => {
    if (!isLoading || pendingActionKey) return;
    streamStoppedRef.current = true;
    streamAbortControllerRef.current?.abort();
    setQuotaMessage("Đã dừng phản hồi.");
  };

  const handleNotebookAddAction = async (action, notebook, actionKey) => {
    const targetNotebook = notebook || {
      id: action?.notebookId,
      name: action?.notebookName,
    };
    const notebookId = targetNotebook?.id || targetNotebook?.notebookId;
    const notebookName = targetNotebook?.name || action?.notebookName;
    const prompt = action?.prompt;

    if (
      !notebookId ||
      !prompt ||
      isLoading ||
      pendingActionKey ||
      consumedActionKeysRef.current.has(actionKey)
    ) {
      return;
    }

    if (hasNoQuota) {
      setQuotaMessage(
        "Bạn đã dùng hết 50 request hôm nay. Quay lại vào ngày mai.",
      );
      return;
    }

    const userMessage = {
      id: `notebook-action-user-${Date.now()}`,
      role: "user",
      content: `Thêm "${prompt}" vào sổ tay "${notebookName || "đã chọn"}".`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    consumedActionKeysRef.current.add(actionKey);
    hideActionLocal(actionKey);
    setIsLoading(true);
    setPendingActionKey(actionKey);
    setQuotaMessage("");

    try {
      const response = unwrap(
        await confirmNotebookAdd(activeSessionId, {
          notebookId,
          prompt,
        }),
      );

      if (response?.usage) {
        setAiUsage(response.usage);
      }

      setMessages((prev) => [
        ...prev,
        formatMessage(response?.aiMessage, "assistant"),
      ]);
      setOpenCandidateActionKey(null);
      setDeclinedActionKeys((prev) =>
        prev.filter((item) => !actionKey.startsWith(item)),
      );
      await refreshConversations();
      await refreshTodayUsage();
    } catch (error) {
      console.error("Notebook action error:", error);
      if (error?.code === "DAILY_AI_LIMIT_EXCEEDED") {
        if (error.usage) setAiUsage(error.usage);
        setQuotaMessage(
          "Bạn đã dùng hết 50 request hôm nay. Quay lại vào ngày mai.",
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `notebook-action-error-${Date.now()}`,
          role: "assistant",
          content:
            error?.message ||
            "Mình chưa thể thêm từ vào sổ tay này. Bạn thử lại giúp mình nhé.",
          timestamp: new Date(),
          actions: [],
        },
      ]);
    } finally {
      setIsLoading(false);
      setPendingActionKey(null);
    }
  };

  const handleActionClick = (action) => {
    if (action?.type === "view_notebook" && action.notebookId) {
      navigate(`${config.routes.notebook}/${action.notebookId}`);
    }
  };

  const handleSend = async (messageText) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    if (hasNoQuota) {
      setQuotaMessage(
        "Bạn đã dùng hết 50 request hôm nay. Quay lại vào ngày mai.",
      );
      return;
    }

    let sessionId = activeSessionId;
    let createdForThisMessage = false;
    if (sessionId === DRAFT_SESSION_ID || !sessionId) {
      const session = await createPersistedSession();
      sessionId = session._id;
      createdForThisMessage = true;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };
    const assistantId = `assistant-${Date.now()}`;
    let assistantCreated = false;
    let streamErrored = false;
    let quotaExceeded = false;
    let streamStopped = false;
    const abortController = new AbortController();
    streamAbortControllerRef.current = abortController;
    streamStoppedRef.current = false;

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setQuotaMessage("");
    setOpenMenuId(null);
    updateConversationLocal(sessionId, (conversation) => ({
      ...conversation,
      title:
        conversation.title && conversation.title !== DEFAULT_TITLE
          ? conversation.title
          : textToSend.slice(0, 48),
      messages: [
        ...(conversation.messages || []),
        {
          role: "user",
          content: textToSend,
          timestamp: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    }));

    const ensureAssistantMessage = (initialContent = "") => {
      if (assistantCreated) return;
      assistantCreated = true;
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
        prev.map((message) =>
          message.id === assistantId
            ? { ...message, content: message.content + text }
            : message,
        ),
      );
    };

    const appendAction = (action) => {
      if (!action) return;
      if (!assistantCreated) ensureAssistantMessage("");

      setMessages((prev) =>
        prev.map((message) => {
          if (message.id !== assistantId) return message;
          const existing = message.actions || [];
          const exists = existing.some(
            (item) =>
              item.type === action.type && item.notebookId === action.notebookId,
          );
          return exists
            ? message
            : { ...message, actions: [...existing, action] };
        }),
      );
    };

    try {
      await streamMessage(sessionId, textToSend, {
        onChunk: appendChunk,
        onAction: appendAction,
        signal: abortController.signal,
        onDone: (event) => {
          if (event?.usage) {
            setAiUsage(event.usage);
          }

          if (!assistantCreated) {
            ensureAssistantMessage(
              event?.aiMessage || "Mình chưa có phản hồi phù hợp.",
            );
          }

          if (event?.timestamp) {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? { ...message, timestamp: new Date(event.timestamp) }
                  : message,
              ),
            );
          }

          if (Array.isArray(event?.actions)) {
            event.actions.forEach(appendAction);
          }
        },
        onError: (error) => {
          if (error?.name === "AbortError" || streamStoppedRef.current) {
            streamStopped = true;
            return;
          }

          streamErrored = true;
          console.error("Stream error:", error);
          if (error?.code === "DAILY_AI_LIMIT_EXCEEDED") {
            quotaExceeded = true;
            if (error.usage) {
              setAiUsage(error.usage);
            }
            setQuotaMessage(
              "Bạn đã dùng hết 50 request hôm nay. Quay lại vào ngày mai.",
            );
            setMessages((prev) =>
              prev.filter((message) => message.id !== userMessage.id),
            );
            if (createdForThisMessage) {
              setActiveSessionId(DRAFT_SESSION_ID);
              setMessages([]);
              setInput(textToSend);
            }
            return;
          }

          if (!assistantCreated) {
            ensureAssistantMessage(
              "Xin lỗi, đã có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại.",
            );
          }
        },
      });

      if (streamStoppedRef.current) {
        streamStopped = true;
      }

      if (!assistantCreated && !streamErrored && !quotaExceeded) {
        ensureAssistantMessage(
          streamStopped ? "Đã dừng phản hồi." : "Mình chưa có phản hồi phù hợp.",
        );
      }
    } catch (error) {
      if (error?.name === "AbortError" || streamStoppedRef.current) {
        streamStopped = true;
        if (!assistantCreated) {
          ensureAssistantMessage("Đã dừng phản hồi.");
        }
        return;
      }

      console.error("Error streaming message:", error);
      if (error?.code === "DAILY_AI_LIMIT_EXCEEDED") {
        quotaExceeded = true;
        if (error.usage) {
          setAiUsage(error.usage);
        }
        setQuotaMessage(
          "Bạn đã dùng hết 50 request hôm nay. Quay lại vào ngày mai.",
        );
        setMessages((prev) =>
          prev.filter((message) => message.id !== userMessage.id),
        );
        if (createdForThisMessage) {
          setActiveSessionId(DRAFT_SESSION_ID);
          setMessages([]);
          setInput(textToSend);
        }
      } else if (!assistantCreated) {
        ensureAssistantMessage(
          "Xin lỗi, đã có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại.",
        );
      }
    } finally {
      setIsLoading(false);
      streamAbortControllerRef.current = null;
      streamStoppedRef.current = false;
      Promise.all([refreshConversations(), refreshTodayUsage()]).catch(
        (error) => console.error("Error refreshing chat state:", error),
      );
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    if (isLoading) return;
    if (isDraftActive && messages.length === 0) {
      setIsSidebarOpen(false);
      setOpenMenuId(null);
      return;
    }

    setActiveSessionId(DRAFT_SESSION_ID);
    setMessages([]);
    setInput("");
    setEditingId(null);
    setOpenMenuId(null);
    setOpenCandidateActionKey(null);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = async (sessionId) => {
    if (!sessionId || isLoading) return;

    if (sessionId === DRAFT_SESSION_ID) {
      handleNewChat();
      return;
    }

    await deleteSession(sessionId);
    setOpenMenuId(null);

    const remaining = conversations.filter(
      (conversation) => conversation._id !== sessionId,
    );
    setConversations(remaining);

    if (sessionId === activeSessionId) {
      const nextSession = remaining.find(
        (conversation) => !isEmptyDefaultConversation(conversation),
      );

      if (nextSession) {
        await loadSession(nextSession._id);
      } else {
        setActiveSessionId(DRAFT_SESSION_ID);
        setMessages([]);
      }
    }
  };

  const handleTogglePin = async (conversation) => {
    if (conversation.isDraft) return;

    const nextPinned = !conversation.isPinned;
    const updated = unwrap(
      await updateSession(conversation._id, { isPinned: nextPinned }),
    );
    updateConversationLocal(conversation._id, () => updated);
    setOpenMenuId(null);
  };

  const startEditing = (conversation) => {
    if (conversation.isDraft) return;
    setEditingId(conversation._id);
    setEditingTitle(formatConversationTitle(conversation));
    setOpenMenuId(null);
  };

  const finishEditing = async () => {
    if (!editingId) return;
    const title = editingTitle.trim() || DEFAULT_TITLE;
    const updated = unwrap(await updateSession(editingId, { title }));
    updateConversationLocal(editingId, () => updated);
    setEditingId(null);
    setEditingTitle("");
  };

  if (isInitializing) {
    return (
      <div className={cx("page")}>
        <div className={cx("loading-state")}>
          <Sparkles />
          <p>Đang mở Chat AI...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={cx("page", "center-page")}>
        <Card className={cx("notice-card")}>
          <Bot />
          <h2>Đăng nhập để dùng Chat AI</h2>
          <p>Lịch sử hội thoại sẽ được lưu theo tài khoản của bạn.</p>
          <Button to={config.routes.login} primary>
            Đăng nhập
          </Button>
        </Card>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className={cx("page", "center-page")}>
        <Card className={cx("notice-card")}>
          <Sparkles />
          <h2>Chat AI dành cho gói Pro</h2>
          <p>Nâng cấp để hỏi đáp, luyện hội thoại và lưu lịch sử học tập.</p>
          <div className={cx("notice-actions")}>
            <Button to="/payment?plan=Pro" primary>
              Nâng cấp Pro
            </Button>
            <Button to="/" outline>
              Quay lại
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={cx("page")} onClick={() => setOpenMenuId(null)}>
      <aside className={cx("sidebar", { open: isSidebarOpen })}>
        <div className={cx("sidebar-header")}>
          <button
            type="button"
            className={cx("new-chat")}
            onClick={handleNewChat}
            disabled={isLoading}
            title="Cuộc trò chuyện mới"
          >
            <Plus size={18} />
            <span>Chat mới</span>
          </button>
          <button
            type="button"
            className={cx("icon-button", "mobile-only")}
            onClick={() => setIsSidebarOpen(false)}
            title="Đóng lịch sử"
          >
            <X size={18} />
          </button>
        </div>

        <div className={cx("history-title")}>Lịch sử hội thoại</div>

        <div className={cx("conversation-list")}>
          {displayedConversations.map((conversation) => {
            const isActive = conversation._id === activeSessionId;
            const isEditing = editingId === conversation._id;
            const isMenuOpen = openMenuId === conversation._id;

            return (
              <div
                key={conversation._id}
                className={cx("conversation-item", { active: isActive })}
              >
                {isEditing ? (
                  <div className={cx("rename-row")}>
                    <input
                      className={cx("rename-input")}
                      value={editingTitle}
                      autoFocus
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onBlur={finishEditing}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") finishEditing();
                        if (event.key === "Escape") {
                          setEditingId(null);
                          setEditingTitle("");
                        }
                      }}
                    />
                    <button
                      type="button"
                      className={cx("mini-button")}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={finishEditing}
                      title="Lưu tên"
                    >
                      <Check size={15} />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className={cx("conversation-main")}
                      onClick={() => loadSession(conversation._id)}
                    >
                      <MessageSquare size={16} />
                      <span className={cx("conversation-copy")}>
                        <span className={cx("conversation-name")}>
                          {formatConversationTitle(conversation)}
                        </span>
                        <span className={cx("conversation-meta")}>
                          {conversation.isPinned
                            ? "Đã ghim"
                            : conversation.isDraft
                              ? "Chưa lưu"
                              : "Gần đây"}{" "}
                          · {formatConversationTime(conversation.updatedAt)}
                        </span>
                      </span>
                    </button>

                    <div className={cx("conversation-menu-wrap")}>
                      <button
                        type="button"
                        className={cx("more-button")}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId((current) =>
                            current === conversation._id ? null : conversation._id,
                          );
                        }}
                        title="Tùy chọn"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {isMenuOpen && !conversation.isDraft && (
                        <div
                          className={cx("conversation-menu")}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleTogglePin(conversation)}
                          >
                            {conversation.isPinned ? (
                              <PinOff size={16} />
                            ) : (
                              <Pin size={16} />
                            )}
                            <span>
                              {conversation.isPinned ? "Bỏ ghim" : "Ghim"}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditing(conversation)}
                          >
                            <Pencil size={16} />
                            <span>Đổi tên</span>
                          </button>
                          <button
                            type="button"
                            className={cx("danger")}
                            onClick={() =>
                              handleDeleteConversation(conversation._id)
                            }
                          >
                            <Trash2 size={16} />
                            <span>Xóa</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <main className={cx("chat")}>
        <header className={cx("chat-header")}>
          <button
            type="button"
            className={cx("icon-button", "mobile-only")}
            onClick={() => setIsSidebarOpen(true)}
            title="Mở lịch sử"
          >
            <Menu size={19} />
          </button>
          <div className={cx("chat-title")}>
            <Bot size={20} />
            <div>
              <h1>{formatConversationTitle(activeConversation)}</h1>
            </div>
          </div>
          {aiUsage && (
            <div className={cx("quota-chip", { exhausted: hasNoQuota })}>
              Đã dùng {aiUsage.used}/{aiUsage.limit} hôm nay
            </div>
          )}
        </header>

        <section className={cx("messages")}>
          {messages.length === 0 ? (
            <div className={cx("empty-state")}>
              <span className={cx("empty-icon")}>
                <Sparkles size={24} />
              </span>
              <h2>Hôm nay mình học gì?</h2>
              <p>{welcomeText}</p>
              <div className={cx("suggestions")}>
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    disabled={isLoading || hasNoQuota}
                  >
                    {prompt}
                    <ArrowRight size={15} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <article
                  key={message.id}
                  className={cx("message-row", { user: isUser })}
                >
                  {!isUser && (
                    <span className={cx("avatar")}>
                      <Bot size={17} />
                    </span>
                  )}

                  <div className={cx("message-content")}>
                    <div className={cx("message-author")}>
                      {isUser ? "Bạn" : "JAVI AI"}
                    </div>
                    {isUser ? (
                      <p className={cx("user-text")}>{message.content}</p>
                    ) : (
                      <MarkdownMessage content={message.content} />
                    )}

                    {!isUser &&
                      Array.isArray(message.actions) &&
                      message.actions.length > 0 && (
                        <div className={cx("message-actions")}>
                          {message.actions.map((action, index) => {
                            const actionKey = `${message.id}-${action.type}-${
                              action.notebookId || index
                            }`;
                            const candidates = Array.isArray(action.candidates)
                              ? action.candidates
                              : [];
                            const actionBusy = pendingActionKey === actionKey;
                            const actionDisabled =
                              isLoading || hasNoQuota || !!pendingActionKey;
                            const isDeclined =
                              declinedActionKeys.includes(actionKey);

                            if (action.type === "confirm_add_to_notebook") {
                              return (
                                <div
                                  key={actionKey}
                                  className={cx("action-card")}
                                >
                                  <div className={cx("action-card-title")}>
                                    <BookOpen size={17} />
                                    <div>
                                      <strong>Ý bạn là sổ tay này?</strong>
                                      <span>{action.notebookName}</span>
                                    </div>
                                  </div>
                                  {!isDeclined && (
                                    <div className={cx("action-card-buttons")}>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleNotebookAddAction(
                                            action,
                                            null,
                                            actionKey,
                                          )
                                        }
                                        disabled={actionDisabled}
                                      >
                                        <Check size={16} />
                                        <span>
                                          {actionBusy ? "Đang thêm..." : "Có"}
                                        </span>
                                      </button>
                                      <button
                                        type="button"
                                        className={cx("secondary")}
                                        onClick={() => {
                                          setDeclinedActionKeys((current) =>
                                            current.includes(actionKey)
                                              ? current
                                              : [...current, actionKey],
                                          );
                                          setOpenCandidateActionKey(actionKey);
                                        }}
                                        disabled={isLoading || !!pendingActionKey}
                                      >
                                        <X size={16} />
                                        <span>Không</span>
                                      </button>
                                    </div>
                                  )}
                                  {(openCandidateActionKey === actionKey ||
                                    isDeclined) &&
                                    candidates.length > 0 && (
                                      <div className={cx("candidate-list")}>
                                        {candidates.map((candidate) => (
                                          <button
                                            key={candidate.id}
                                            type="button"
                                            onClick={() =>
                                              handleNotebookAddAction(
                                                action,
                                                candidate,
                                                actionKey,
                                              )
                                            }
                                            disabled={actionDisabled}
                                          >
                                            {candidate.name}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                </div>
                              );
                            }

                            if (action.type === "select_notebook_for_add") {
                              return (
                                <div
                                  key={actionKey}
                                  className={cx("action-card")}
                                >
                                  <div className={cx("action-card-title")}>
                                    <BookOpen size={17} />
                                    <div>
                                      <strong>
                                        {action.label || "Chọn sổ tay"}
                                      </strong>
                                      <span>Chọn nơi bạn muốn thêm từ mới.</span>
                                    </div>
                                  </div>
                                  <div className={cx("candidate-list")}>
                                    {candidates.map((candidate) => (
                                      <button
                                        key={candidate.id}
                                        type="button"
                                        onClick={() =>
                                          handleNotebookAddAction(
                                            action,
                                            candidate,
                                            actionKey,
                                          )
                                        }
                                        disabled={actionDisabled}
                                      >
                                        {candidate.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={actionKey}
                                type="button"
                                onClick={() => handleActionClick(action)}
                              >
                                <BookOpen size={16} />
                                <span>{action.label || "Xem sổ tay"}</span>
                                <ArrowRight size={14} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                  </div>

                  {isUser && (
                    <span className={cx("avatar", "avatar-user")}>
                      <User size={17} />
                    </span>
                  )}
                </article>
              );
            })
          )}

          {isLoading && (
            <article className={cx("message-row")}>
              <span className={cx("avatar")}>
                <Bot size={17} />
              </span>
              <div className={cx("typing")}>
                <span />
                <span />
                <span />
              </div>
            </article>
          )}
          <div ref={messagesEndRef} />
        </section>

        <footer className={cx("composer")}>
          <div className={cx("composer-box")}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi về tiếng Nhật..."
              rows={1}
              disabled={isLoading || hasNoQuota}
            />
            <button
              type="button"
              className={cx("send-button", { stop: isLoading })}
              onClick={isLoading ? handleStopGenerating : () => handleSend()}
              disabled={
                isLoading
                  ? !!pendingActionKey
                  : !input.trim() || hasNoQuota
              }
              title={isLoading ? "Dừng phản hồi" : "Gửi"}
            >
              {isLoading ? <Square size={11} fill="currentColor" /> : <Send size={18} />}
            </button>
          </div>
          <p>
            {quotaMessage ||
              (hasNoQuota
                ? "Bạn đã dùng hết 50 request hôm nay. Quay lại vào ngày mai."
                : "Enter để gửi, Shift + Enter để xuống dòng.")}
          </p>
        </footer>
      </main>
    </div>
  );
}

export default ChatAI;
