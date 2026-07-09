const BASE_URL = process.env.REACT_APP_API_URL;

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

export async function translateArgos(text, from_lang, to_lang) {
    const response = await fetch(`${BASE_URL}/translate/argos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text,
            from_lang,
            to_lang,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to translate text");
    }

    return response.json();
}

export async function recognizeJapaneseHandwriting({ ink, width, height }) {
    const response = await fetch(`${BASE_URL}/ocr/japanese-handwriting`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ink,
            width,
            height,
        }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(payload?.message || "Failed to recognize handwriting");
    }

    return payload?.data || payload;
}
