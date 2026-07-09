const API_BASE_URL = process.env.REACT_APP_API_URL;

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

export async function getKanaGroups(syllabary) {
  return request(`/kana/groups?syllabary=${syllabary}`);
}

export async function getKanaCombinations(syllabary) {
  return request(`/kana/combinations?syllabary=${syllabary}`);
}

export async function getKanaBasics() {
  return request("/kana/basics");
}

export async function getKanaRadicals() {
  return request("/kana/radicals");
}

const kanaService = { getKanaGroups, getKanaCombinations, getKanaBasics, getKanaRadicals };

export default kanaService;
