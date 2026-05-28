const BASE_URL = process.env.REACT_APP_BASE_URL_API;

function getAuthHeaders() {
  return {};
}

export async function getRecentUserActivities(limit = 10) {
  const response = await fetch(`${BASE_URL}/user-activities/recent?limit=${limit}`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get recent activities: ${response.statusText}`);
  }

  return response.json();
}

export async function logKanjiLookupActivity(payload) {
  try {
    const response = await fetch(`${BASE_URL}/user-activities/kanji-lookup`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { success: false };
    }

    return response.json();
  } catch {
    return { success: false };
  }
}
