const BASE_URL = process.env.REACT_APP_BASE_URL_API;

// Lấy token JWT từ localStorage
function getToken() {
    return localStorage.getItem("token") || "";
}

// Hàm lấy headers Authorization
function getAuthHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Cập nhật số phút học cho hôm nay
 */
export async function addStudyTime(minutes) {
    const response = await fetch(`${BASE_URL}/study-day/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ minutes }),
    });

    if (!response.ok) throw new Error(`Failed to add study time: ${response.statusText}`);
    return response.json();
}

/**
 * Lấy số phút học hôm nay
 */
export async function getTodayStudyTime() {
    const response = await fetch(`${BASE_URL}/study-day/today`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to get today's study time: ${response.statusText}`);
    return response.json();
}

/**
 * Lấy tổng số phút học trong tuần
 */
export async function getWeekStudyTime() {
    const response = await fetch(`${BASE_URL}/study-day/week`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to get week study time: ${response.statusText}`);
    return response.json();
}

/**
 * Lấy tổng số phút học trong tháng
 */
export async function getMonthStudyTime() {
    const response = await fetch(`${BASE_URL}/study-day/month`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to get month study time: ${response.statusText}`);
    return response.json();
}

/**
 * Lấy số phút học từng ngày trong tuần
 */
export async function getWeekStudyMinutes() {
    const response = await fetch(`${BASE_URL}/study-day/week-time`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to get week study minutes: ${response.statusText}`);
    return response.json();
}
