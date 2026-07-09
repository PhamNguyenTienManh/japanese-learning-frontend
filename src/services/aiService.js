const BASE_URL = process.env.REACT_APP_API_URL;

// Lấy token từ cookie
// Hàm lấy headers cookie
function getAuthHeaders() {
  return {};
}

// Tạo session mới hoặc lấy session cuối cùng
export async function createSession() {
  const response = await fetch(`${BASE_URL}/ai-chat`, {
    method: "POST",
    credentials: "include",
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

export async function getUserSessions() {
  const response = await fetch(`${BASE_URL}/ai-chat/user/sessions`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching sessions: ${response.statusText}`);
  }

  return response.json();
}

export async function getTodayAiUsage() {
  const response = await fetch(`${BASE_URL}/ai-chat/usage/today`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching AI usage: ${response.statusText}`);
  }

  return response.json();
}

export async function getSessionHistory(sessionId) {
  const response = await fetch(`${BASE_URL}/ai-chat/${sessionId}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching session: ${response.statusText}`);
  }

  return response.json();
}

export async function updateSession(sessionId, payload) {
  const response = await fetch(`${BASE_URL}/ai-chat/${sessionId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to update session: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteSession(sessionId) {
  const response = await fetch(`${BASE_URL}/ai-chat/${sessionId}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete session: ${response.statusText}`);
  }

  return response.json();
}

export async function confirmNotebookAdd(sessionId, payload) {
  const response = await fetch(
    `${BASE_URL}/ai-chat/${sessionId}/notebook-actions/add-items`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    const err = new Error(
      errorPayload?.message ||
        `Failed to confirm notebook action: ${response.statusText}`,
    );
    err.code = errorPayload?.code;
    err.usage = errorPayload?.usage;
    throw err;
  }

  return response.json();
}

export async function confirmNotebookCreateLimited(sessionId, payload) {
  const response = await fetch(
    `${BASE_URL}/ai-chat/${sessionId}/notebook-actions/create-limited`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    const err = new Error(
      errorPayload?.message ||
        `Failed to confirm notebook creation: ${response.statusText}`,
    );
    err.code = errorPayload?.code;
    err.usage = errorPayload?.usage;
    throw err;
  }

  return response.json();
}

// Gửi tin nhắn trong session
export async function sendMessage(sessionId, message) {
  const response = await fetch(`${BASE_URL}/ai-chat/${sessionId}/message`, {
    method: "POST",
    credentials: "include",
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
  { onChunk, onDone, onError, onAction, onProgress, signal } = {},
) {
  const response = await fetch(
    `${BASE_URL}/ai-chat/${sessionId}/message/stream`,
    {
      method: "POST",
      credentials: "include",
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
    const payload = await response.json().catch(() => null);
    const err = new Error(
      payload?.message ||
        `Failed to stream message: ${response.status} ${response.statusText}`,
    );
    err.code = payload?.code;
    err.usage = payload?.usage;
    throw err;
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
        } else if (event.type === "progress") {
          onProgress?.(event);
        } else if (event.type === "action") {
          onAction?.(event.action);
        } else if (event.type === "done" || event.type === "aborted") {
          onDone?.(event);
        } else if (event.type === "error") {
          const err = new Error(event.message || "Stream error");
          err.code = event.code;
          err.usage = event.usage;
          onError?.(err);
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
  const response = await fetch(`${BASE_URL}/ai-chat/user/sessions/last`, {
    method: "GET",
    credentials: "include",
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
