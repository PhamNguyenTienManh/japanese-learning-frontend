const BASE_URL = process.env.REACT_APP_BASE_URL_API;

function getAuthHeaders() {
  const token = localStorage.getItem("token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function postJson(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
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

export async function createMomoPayment({ cycle }) {
  return postJson("/payments/momo/create", { cycle });
}

export async function createVnpayPayment({ cycle, bankCode }) {
  return postJson("/payments/vnpay/create", { cycle, bankCode });
}

export async function createStripePayment({ cycle }) {
  return postJson("/payments/stripe/create", { cycle });
}

export async function getMyPayments() {
  const res = await fetch(`${BASE_URL}/payments/me`, {
    headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Request failed: ${res.status}`);
  }
  return json.data ?? json;
}
