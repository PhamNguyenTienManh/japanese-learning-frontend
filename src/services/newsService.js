const BASE_URL = process.env.REACT_APP_BASE_URL_API;

// Lấy token từ cookie
// Hàm lấy headers cookie
function getAuthHeaders() {
    return {};
}

// Tạo session mới hoặc lấy session cuối cùng
export async function getNews() {
    const response = await fetch(`${BASE_URL}/news`, {
        method: "GET",
        credentials: "include",
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

export async function createNews(dto) {
    const response = await fetch(`${BASE_URL}/news`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        throw new Error(`Failed to create news: ${response.statusText}`);
    }

    return response.json();
}


export async function updateNews(id, dto) {
    const response = await fetch(`${BASE_URL}/news/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        throw new Error(`Failed to update news: ${response.statusText}`);
    }

    return response.json();
}

export async function getNewsEngagement() {
    const response = await fetch(`${BASE_URL}/news/me/engagement`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch reading engagement: ${response.statusText}`);
    }

    return response.json();
}

export async function toggleNewsFavorite(id) {
    const response = await fetch(`${BASE_URL}/news/${id}/favorite`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to update reading favorite: ${response.statusText}`);
    }

    return response.json();
}

export async function markNewsViewed(id) {
    const response = await fetch(`${BASE_URL}/news/${id}/view`, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to mark reading as viewed: ${response.statusText}`);
    }

    return response.json();
}

