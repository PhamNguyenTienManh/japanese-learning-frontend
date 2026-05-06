const FURIGANA_API_URL = "https://MinhNguyenMinj-voice-recognize.hf.space/furigana";

/**
 * Convert one or many Japanese strings into pykakasi segments.
 *
 * @param {string|string[]} input
 * @returns {Promise<Array<{orig: string, hira: string}> | Array<Array<{orig: string, hira: string}>>>}
 *   - Pass a string  → returns a flat segment array.
 *   - Pass an array  → returns an array of segment arrays (1 per input).
 */
export async function getFurigana(input) {
    const isArray = Array.isArray(input);
    const body = isArray ? { texts: input } : { text: input };

    const res = await fetch(FURIGANA_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch furigana: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return isArray ? data.results : data.segments;
}
