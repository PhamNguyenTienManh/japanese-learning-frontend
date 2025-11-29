const BASE_URL = "http://localhost:9090/api";

// Lấy token từ localStorage
function getToken() {
    return localStorage.getItem("token") || "";
}

// Hàm lấy headers Authorization
function getAuthHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Tạo session mới hoặc lấy session cuối cùng
export async function getProfile() {
    const response = await fetch(`${BASE_URL}/news`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.statusText}`);
    }

    return response.json();
}