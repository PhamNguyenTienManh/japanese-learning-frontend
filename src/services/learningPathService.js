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

export async function reviewLearningPath() {
  return request("/learning-path/review", {
    method: "POST",
  });
}

export async function applyLearningPathReview(payload) {
  return request("/learning-path/apply-review", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getAdminLearningPaths(params = {}) {
  const query = new URLSearchParams(params);
  return request(`/learning-path/admin/paths?${query.toString()}`);
}

export async function getAdminLearningPath(id) {
  return request(`/learning-path/admin/paths/${id}`);
}

export async function updateAdminLearningPath(id, payload) {
  return request(`/learning-path/admin/paths/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function runAdminLearningPathReview(id) {
  return request(`/learning-path/admin/paths/${id}/review`, {
    method: "POST",
  });
}

export async function applyAdminLearningPathReview(id, payload) {
  return request(`/learning-path/admin/paths/${id}/apply-review`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function dismissAdminLearningPathReview(id) {
  return request(`/learning-path/admin/paths/${id}/dismiss-review`, {
    method: "PATCH",
  });
}

export async function getAdminPlacementQuestions(params = {}) {
  const query = new URLSearchParams(params);
  return request(`/learning-path/admin/placement-questions?${query.toString()}`);
}

export async function getAdminPlacementQuestion(id) {
  return request(`/learning-path/admin/placement-questions/${id}`);
}

export async function createAdminPlacementQuestion(payload) {
  return request("/learning-path/admin/placement-questions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminPlacementQuestion(id, payload) {
  return request(`/learning-path/admin/placement-questions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminPlacementQuestion(id) {
  return request(`/learning-path/admin/placement-questions/${id}`, {
    method: "DELETE",
  });
}

export async function getAdminPlacementTestConfig() {
  return request("/learning-path/admin/placement-config");
}

export async function updateAdminPlacementTestConfig(payload) {
  return request("/learning-path/admin/placement-config", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getAdminLearningPathProgress(params = {}) {
  const query = new URLSearchParams(params);
  return request(`/learning-path/admin/progress?${query.toString()}`);
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
  reviewLearningPath,
  applyLearningPathReview,
  getAdminLearningPaths,
  getAdminLearningPath,
  updateAdminLearningPath,
  runAdminLearningPathReview,
  applyAdminLearningPathReview,
  dismissAdminLearningPathReview,
  getAdminPlacementQuestions,
  getAdminPlacementQuestion,
  createAdminPlacementQuestion,
  updateAdminPlacementQuestion,
  deleteAdminPlacementQuestion,
  getAdminPlacementTestConfig,
  updateAdminPlacementTestConfig,
  getAdminLearningPathProgress,
};

export default learningPathService;
