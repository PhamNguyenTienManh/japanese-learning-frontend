const BASE_URL = process.env.REACT_APP_BASE_URL_API;

// Lấy token JWT từ cookie
// Lấy headers cookie
function getAuthHeaders() {
    return {};
}

/**
 * Lấy thống kê user
 */
export async function getUserStatistics() {
    const response = await fetch(`${BASE_URL}/statistic/user`, {
        credentials: "include",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to get user statistics: ${response.statusText}`);
    }

    return response.json();
}

export async function getStatistics() {
    const response = await fetch(`${BASE_URL}/statistic`, {
        credentials: "include",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to get statistics: ${response.statusText}`);
    }

    return response.json();
}

