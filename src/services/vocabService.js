const BASE_URL = (process.env.REACT_APP_BASE_URL_API || "").replace(/\/$/, "");

const normalizeVocabRecord = (record) => {
    if (!record) return null;

    const phonetic = Array.isArray(record.phonetic)
        ? record.phonetic
        : record.phonetic
            ? [record.phonetic]
            : [];

    const meanings = Array.isArray(record.meanings) ? record.meanings : [];

    return {
        ...record,
        phonetic,
        meanings,
        mobileId: record.mobileId || record._id || record.id || record.word,
    };
};

const requestJson = async (url) => {
    const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};

const unwrapApiData = (payload) => {
    if (payload && payload.success === true && Object.prototype.hasOwnProperty.call(payload, "data")) {
        return payload.data;
    }

    return payload;
};

export const fetchVocabDetail = async (query) => {
    const keyword = query?.trim();
    if (!keyword) return null;

    try {
        const params = new URLSearchParams({ word: keyword });
        const data = unwrapApiData(
            await requestJson(`${BASE_URL}/jlpt-word/detail?${params.toString()}`)
        );
        return normalizeVocabRecord(data);
    } catch (error) {
        console.error("Error fetching vocab:", error);
        return null;
    }
};

export const searchVocabList = async (query, limit = 30) => {
    const keyword = query?.trim();
    if (!keyword) {
        return {
            data: [],
            total: 0,
            totalPages: 0,
            currentPage: 1,
        };
    }

    const params = new URLSearchParams({
        q: keyword,
        limit: String(limit),
    });

    const data = unwrapApiData(
        await requestJson(`${BASE_URL}/jlpt-word/search?${params.toString()}`)
    );
    const records = Array.isArray(data?.data) ? data.data : [];

    return {
        ...data,
        data: records.map(normalizeVocabRecord).filter(Boolean),
    };
};
