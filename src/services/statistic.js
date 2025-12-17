const BASE_URL = process.env.REACT_APP_BASE_URL_API;

// Lấy token JWT từ localStorage
function getToken() {
    return localStorage.getItem("token") || "";
}

// Lấy headers Authorization
function getAuthHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Lấy thống kê user
 */
export async function getUserStatistics() {
    const response = await fetch(`${BASE_URL}/statistic/user`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to get user statistics: ${response.statusText}`);
    }

    return response.json();
}

export async function getStatistics() {
    const response = await fetch(`${BASE_URL}/statistic`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to get statistics: ${response.statusText}`);
    }

    return response.json();
}

