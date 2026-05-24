const BASE_URL = process.env.REACT_APP_BASE_URL_API;

export async function getConversationGroups() {
  const response = await fetch(`${BASE_URL}/conversation`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch conversation groups: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || result;
}

export async function getConversationLesson(idOrSlug) {
  const response = await fetch(`${BASE_URL}/conversation/${idOrSlug}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch conversation lesson: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || result;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Conversation request failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || result;
}

export function getConversationAdminData() {
  return requestJson("/conversation/admin/all");
}

export function createConversationCategory(data) {
  return requestJson("/conversation/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateConversationCategory(id, data) {
  return requestJson(`/conversation/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteConversationCategory(id) {
  return requestJson(`/conversation/admin/categories/${id}`, {
    method: "DELETE",
  });
}

export function createConversationLesson(data) {
  return requestJson("/conversation/admin/lessons", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateConversationLesson(id, data) {
  return requestJson(`/conversation/admin/lessons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteConversationLesson(id) {
  return requestJson(`/conversation/admin/lessons/${id}`, {
    method: "DELETE",
  });
}
