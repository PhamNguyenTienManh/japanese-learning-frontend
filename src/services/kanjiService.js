const BASE_URL = (process.env.REACT_APP_BASE_URL_API || "").replace(/\/$/, "");

const normalizeKanjiRecord = (record) => {
    if (!record) return null;

    const level = Array.isArray(record.level)
        ? record.level
        : record.level
            ? [record.level]
            : [];

    return {
        ...record,
        level,
        mobileId: record.mobileId || record._id || record.id || record.kanji,
        stroke_count: record.stroke_count ?? record.strokeCount ?? "",
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

export const fetchKanjiDetail = async (query) => {
    const keyword = query?.trim();
    if (!keyword) return null;

    try {
        const params = new URLSearchParams({ kanji: keyword });
        const data = unwrapApiData(
            await requestJson(`${BASE_URL}/jlpt-kanji/detail?${params.toString()}`)
        );
        return normalizeKanjiRecord(data);
    } catch (error) {
        console.error("Error fetching kanji:", error);
        return null;
    }
};

export const searchKanjiList = async (query, limit = 30) => {
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
        await requestJson(`${BASE_URL}/jlpt-kanji/search?${params.toString()}`)
    );
    const records = Array.isArray(data?.data) ? data.data : [];

    return {
        ...data,
        data: records.map(normalizeKanjiRecord).filter(Boolean),
    };
};
