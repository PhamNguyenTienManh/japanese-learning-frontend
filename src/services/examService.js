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

// Lấy số lượng đề thi theo level
export async function getExamCountByLevel() {
  const response = await fetch(`${BASE_URL}/exams/count-by-level`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get exam count: ${response.statusText}`);
  }

  return response.json();
}

export async function getExamsByLevel(level) {
  const response = await fetch(`${BASE_URL}/exams/level/${level}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get exams for level ${level}: ${response.statusText}`
    );
  }

  return response.json();
}

export async function getExamDetail(id) {
  const response = await fetch(`${BASE_URL}/exams/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to get exams with id ${id}: ${response.statusText}`
    );
  }
  return response.json();
}
