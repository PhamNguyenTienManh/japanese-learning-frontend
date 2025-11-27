const BASE_URL = "http://localhost:9090/api";


// Lấy danh sách từ vựng JLPT
export async function getJlptWords(page = 1, limit = 9, level = "N4") {
    const response = await fetch(
        `${BASE_URL}/jlpt-word?page=${page}&limit=${limit}&level=${level}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch JLPT words: ${response.statusText}`);
    }

    return response.json();
}


// Lấy danh sách Kanji JLPT
export async function getJlptKanji(page = 1, limit = 9, level = "N5") {
    const response = await fetch(
        `${BASE_URL}/jlpt-kanji?page=${page}&limit=${limit}&level=${level}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch JLPT kanji: ${response.statusText}`);
    }

    return response.json();
}


// Lấy danh sách ngữ pháp JLPT
export async function getJlptGrammar(page = 1, limit = 9, level = "N4") {
    const response = await fetch(
        `${BASE_URL}/jlpt-grammar?page=${page}&limit=${limit}&level=${level}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch JLPT grammar: ${response.statusText}`);
    }

    return response.json();
}
