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
    const response = await fetch(`${BASE_URL}/profiles/me`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }

    return response.json();
}


export async function updateProfile(data) {
    const response = await fetch(`${BASE_URL}/profiles/me/update`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`);
    }

    return response.json();
}


// Upload / update avatar
export async function updateAvatar(file) {
    if (!file) throw new Error("File is required");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/profiles/avatar`, {
        method: "PUT",
        headers: {
            ...getAuthHeaders(),
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to update avatar: ${response.statusText}`);
    }

    return response.json();
}

