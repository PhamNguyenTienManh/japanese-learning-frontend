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


export async function uploadVoice(text, speaker = 6) {
    try {
        const response = await fetch(`${BASE_URL}/text_to_speech/upload`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text, speaker }),
        });

        if (!response.ok) {
            throw new Error("Upload voice failed");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error uploading voice:", error);
        return null;
    }
}
