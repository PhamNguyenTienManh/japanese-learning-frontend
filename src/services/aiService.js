const BASE_URL = process.env.REACT_APP_BASE_URL_API;

// Lấy token từ localStorage
function getToken() {
  return localStorage.getItem("token") || "";
}

// Hàm lấy headers Authorization
function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Tạo session mới hoặc lấy session cuối cùng
export async function createSession() {
  const response = await fetch(`${BASE_URL}/ai-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }

  return response.json();
}

// Gửi tin nhắn trong session
export async function sendMessage(sessionId, message) {
  const response = await fetch(`${BASE_URL}/ai-chat/${sessionId}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ content: message }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  return response.json();
}

// Gửi tin nhắn dạng streaming (SSE) — gọi callback theo từng chunk token
// Trả về Promise resolve khi stream done; reject nếu lỗi network.
export async function streamMessage(
  sessionId,
  message,
  { onChunk, onDone, onError, onAction, signal } = {},
) {
  const response = await fetch(
    `${BASE_URL}/ai-chat/${sessionId}/message/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ content: message }),
      signal,
    },
  );

  if (!response.ok || !response.body) {
    throw new Error(
      `Failed to stream message: ${response.status} ${response.statusText}`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Tách event SSE theo dấu phân cách "\n\n"
      let sepIdx;
      while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, sepIdx);
        buffer = buffer.slice(sepIdx + 2);

        // Một event có thể có nhiều dòng "data:" — gộp lại
        const dataPayload = rawEvent
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).replace(/^ /, ""))
          .join("\n");

        if (!dataPayload) continue;

        let event;
        try {
          event = JSON.parse(dataPayload);
        } catch {
          continue;
        }

        if (event.type === "chunk") {
          onChunk?.(event.text ?? "");
        } else if (event.type === "action") {
          onAction?.(event.action);
        } else if (event.type === "done") {
          onDone?.(event);
        } else if (event.type === "error") {
          onError?.(new Error(event.message || "Stream error"));
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }
}

// Lấy lịch sử chat cuối cùng của user hiện tại
export async function getUserLastSession() {
  const response = await fetch(`${BASE_URL}/ai-chat/user/sessions`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(), // gắn token nếu cần
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching last session: ${response.statusText}`);
  }

  return response.json();
}
