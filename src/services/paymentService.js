const BASE_URL = process.env.REACT_APP_API_URL;

function getAuthHeaders() {
  return {};
}

async function postJson(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed: ${res.status}`);
  }
  // BE wraps every response in { success, data } via TransformInterceptor.
  return json.data ?? json;
}

export async function createZalopayPayment({ cycle }) {
  return postJson("/payments/zalopay/create", { cycle });
}

export async function createStripePayment({ cycle }) {
  return postJson("/payments/stripe/create", { cycle });
}

export async function getMyPayments() {
  const res = await fetch(`${BASE_URL}/payments/me`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed: ${res.status}`);
  }
  return json.data ?? json;
}

export async function getAdminTransactions({
  page = 1,
  limit = 10,
  status = "all",
  q = "",
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    status,
  });

  if (q?.trim()) {
    params.set("q", q.trim());
  }

  const res = await fetch(`${BASE_URL}/payments/admin?${params.toString()}`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed: ${res.status}`);
  }
  return json.data ?? json;
}

export async function getAdminTransactionDetail(id) {
  const res = await fetch(`${BASE_URL}/payments/admin/${encodeURIComponent(id)}`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed: ${res.status}`);
  }
  return json.data ?? json;
}
