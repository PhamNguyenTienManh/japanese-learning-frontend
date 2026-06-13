const BASE_URL = process.env.REACT_APP_BASE_URL_API;

export const FALLBACK_VOICEVOX_SPEAKERS = [
    { value: 2, label: "Nữ trẻ - bình thường | 四国めたん / ノーマル (2)" },
    { value: 13, label: "Nam trầm - bình thường | 青山龍星 / ノーマル (13)" },
    { value: 6, label: "Nữ trẻ - hơi gắt | 四国めたん / ツンツン (6)" },
    { value: 4, label: "Nữ trưởng thành | 四国めたん / セクシー (4)" },
];

const RECOMMENDED_VOICEVOX_IDS = [2, 13, 3, 14, 6, 4, 36, 0];

const SPEAKER_HINTS = {
    "四国めたん": "Nữ trẻ",
    "ずんだもん": "Giọng trẻ/cute",
    "春日部つむぎ": "Nữ trẻ năng động",
    "雨晴はう": "Nữ nhẹ nhàng",
    "波音リツ": "Nữ rõ giọng",
    "玄野武宏": "Nam trầm",
    "白上虎太郎": "Nam trẻ",
    "青山龍星": "Nam trầm",
    "冥鳴ひまり": "Nữ sáng giọng",
    "九州そら": "Nữ trưởng thành",
    "もち子さん": "Nữ tự nhiên",
    "剣崎雌雄": "Giọng trung tính",
    "WhiteCUL": "Nữ cao giọng",
    "後鬼": "Nữ trầm",
    "No.7": "Nữ MC",
    "ちび式じい": "Nam lớn tuổi",
    "櫻歌ミコ": "Nữ/cute",
    "小夜/SAYO": "Nữ nhỏ nhẹ",
    "ナースロボ＿タイプＴ": "Nữ robot",
};

const STYLE_HINTS = {
    "ノーマル": "bình thường",
    "あまあま": "ngọt/dịu",
    "ツンツン": "hơi gắt",
    "セクシー": "trưởng thành",
    "ささやき": "thì thầm",
    "ヒソヒソ": "nói nhỏ",
    "へろへろ": "mệt",
    "なみだめ": "buồn/sắp khóc",
    "ハイテンション": "năng động",
    "低音": "giọng trầm",
    "喜び": "vui",
    "怒り": "tức giận",
    "悲しみ": "buồn",
    "落ち着き": "bình tĩnh",
};

function getVoicevoxOptionLabel(speaker, style) {
    const speakerHint = SPEAKER_HINTS[speaker.name];
    if (!speakerHint) return null;

    const styleHint = STYLE_HINTS[style.name] || style.name;
    const prefix = RECOMMENDED_VOICEVOX_IDS.includes(style.id) ? "Khuyên dùng - " : "";

    return `${prefix}${speakerHint} - ${styleHint} | ${speaker.name} / ${style.name} (${style.id})`;
}

export function mapVoicevoxSpeakersToOptions(response) {
    const speakers = response?.data || response || [];
    if (!Array.isArray(speakers)) return FALLBACK_VOICEVOX_SPEAKERS;

    const options = speakers.flatMap((speaker) =>
        (speaker.styles || [])
            .map((style) => {
                const label = getVoicevoxOptionLabel(speaker, style);
                return label ? { value: style.id, label } : null;
            })
            .filter(Boolean)
    );

    options.sort((first, second) => {
        const firstIndex = RECOMMENDED_VOICEVOX_IDS.indexOf(first.value);
        const secondIndex = RECOMMENDED_VOICEVOX_IDS.indexOf(second.value);
        const firstRank = firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex;
        const secondRank = secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex;
        return firstRank - secondRank;
    });

    return options.length ? options : FALLBACK_VOICEVOX_SPEAKERS;
}

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

export async function uploadDialogueVoice(lines, pauseMs = 500) {
    try {
        const response = await fetch(`${BASE_URL}/text_to_speech/dialogue/upload`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ lines, pauseMs }),
        });

        if (!response.ok) {
            throw new Error("Upload dialogue voice failed");
        }

        return response.json();
    } catch (error) {
        console.error("Error uploading dialogue voice:", error);
        return null;
    }
}

export async function getVoicevoxSpeakers() {
    const response = await fetch(`${BASE_URL}/text_to_speech/speakers`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error("Failed to load Voicevox speakers");
    }

    return response.json();
}
