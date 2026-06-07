const API_BASE_URL = process.env.REACT_APP_BASE_URL_API;

const unwrap = (res) => res?.data ?? res;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.message || "Không thể kết nối tới máy chủ.");
  }

  return unwrap(body);
}

export async function getPlacementQuestions(count = 20) {
  return request(`/learning-path/placement/questions?count=${count}`);
}

export async function getLearningPathStatus() {
  return request("/learning-path/status");
}

export async function getLearningPathDashboard() {
  return request("/learning-path/dashboard");
}

export async function completeLearningPathItem(payload) {
  return request("/learning-path/complete-item", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function recordLearningResourceProgress(payload) {
  return request("/learning-path/resource-progress", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getJlptCardStatuses({ skill, level, refIds }) {
  const params = new URLSearchParams({
    skill,
    level,
    refIds: refIds.join(","),
  });
  return request(`/learning-path/jlpt-card-status?${params.toString()}`);
}

export async function updateJlptCardStatus(payload) {
  return request("/learning-path/jlpt-card-status", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function submitPlacement(answers) {
  return request("/learning-path/placement/submit", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export async function generateLearningPath(payload) {
  return request("/learning-path/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

const learningPathService = {
  getPlacementQuestions,
  getLearningPathStatus,
  getLearningPathDashboard,
  completeLearningPathItem,
  recordLearningResourceProgress,
  getJlptCardStatuses,
  updateJlptCardStatus,
  submitPlacement,
  generateLearningPath,
};

export default learningPathService;
