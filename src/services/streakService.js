const BASE_URL = process.env.REACT_APP_BASE_URL_API;

// Lấy token từ localStorage
function getToken() {
    return localStorage.getItem("token") || "";
}

function getAuthHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Cập nhật streak (gọi khi user đăng nhập hoặc bắt đầu vào học)
 */
export async function updateUserStreak() {
    const response = await fetch(`${BASE_URL}/streak/update`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to update streak: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Lấy streak hiện tại của user
 */
export async function getCurrentStreak() {
    const response = await fetch(`${BASE_URL}/streak/current`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get current streak: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Lấy streak dài nhất
 */
export async function getLongestStreak() {
    const response = await fetch(`${BASE_URL}/streak/longest`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get longest streak: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Lịch sử streak
 */
export async function getStreakHistory() {
    const response = await fetch(`${BASE_URL}/streak/history`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get streak history: ${response.statusText}`);
    }

    return response.json();
}
