const BASE_URL = process.env.REACT_APP_API_URL;

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

export async function getWeeklyStudyLeaderboard(limit = 10) {
    const response = await fetch(`${BASE_URL}/statistic/leaderboard?limit=${limit}`, {
        credentials: "include",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to get weekly study leaderboard: ${response.statusText}`);
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

export async function getAdminDashboardStatistics(ranges = {}) {
    const params = new URLSearchParams();

    if (typeof ranges === "string") {
        params.set("chartRange", ranges);
    } else {
        if (ranges.userGrowthRange) {
            params.set("userGrowthRange", ranges.userGrowthRange);
        }
        if (ranges.learningActivityRange) {
            params.set("learningActivityRange", ranges.learningActivityRange);
        }
        if (ranges.examActivityRange) {
            params.set("examActivityRange", ranges.examActivityRange);
        }
        if (ranges.paymentRange) {
            params.set("paymentRange", ranges.paymentRange);
        }
    }

    const response = await fetch(`${BASE_URL}/statistic/admin-dashboard?${params.toString()}`, {
        credentials: "include",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to get admin dashboard: ${response.statusText}`);
    }

    return response.json();
}
