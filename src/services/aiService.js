// aiChatApi.js
const BASE_URL = "http://localhost:9090/api";

// Token tạm thời để thử
let TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTEwY2JmZTMyYTY3ZmJkZWE5OGQ2YTUiLCJlbWFpbCI6InBoYW1uZ3V5ZW50aWVubWFuaDIwMDRAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NjQwNDM1MzcsImV4cCI6MTc2NDA1MDczNywianRpIjoiMjAyNGMxZjEtMDQzNC00OTRiLWJjZTQtNGNiYzAxMzI5N2U5In0.5xaWySy___CjAMpTfeOytTy8kWyFFxZdk3QiEooLT-I";
// Hàm set token từ code nếu cần
export function setToken(token) {
  TOKEN = token;
}

// Lấy header Authorization
export function getAuthHeaders() {
  return TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
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
