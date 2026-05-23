const BASE_URL = process.env.REACT_APP_BASE_URL_API;

export async function uploadVoice(text, speaker = 6) {
    try {
        const response = await fetch(`${BASE_URL}/text_to_speech/upload`, {
            method: "POST",
            credentials: "include",
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
