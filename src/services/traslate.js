const BASE_URL = process.env.REACT_APP_BASE_URL_API;
export async function translateText(text, source, target) {
    const response = await fetch(`${BASE_URL}/translate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text,
            source,
            target,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to translate text");
    }

    return response.json();
}
