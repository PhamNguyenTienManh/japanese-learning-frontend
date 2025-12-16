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
