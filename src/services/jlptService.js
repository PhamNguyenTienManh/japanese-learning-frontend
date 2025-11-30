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

// Lấy danh sách đầy đủ cho admin
export async function getJlptWordsAdmin(page = 1, limit = 20, level = "", q = "", includeDeleted = true) {
    const response = await fetch(
        `${BASE_URL}/jlpt-word/admin?page=${page}&limit=${limit}&level=${level}&q=${q}&includeDeleted=${includeDeleted}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    if (!response.ok) throw new Error("Failed to fetch admin words");
    return response.json();
}

// Cập nhật từ vựng
export async function updateJlptWord(id, data) {
    const response = await fetch(`${BASE_URL}/jlpt-word/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update word");
    return response.json();
}

// Xoá từ vựng (soft-delete)
export async function deleteJlptWord(id) {
    const response = await fetch(`${BASE_URL}/jlpt-word/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to delete word");
    return response.json();
}

// Lấy danh sách đầy đủ cho admin
export async function getJlptKanjiAdmin(page = 1, limit = 20, level = "", q = "", includeDeleted = true) {
    const response = await fetch(
        `${BASE_URL}/jlpt-kanji/admin?page=${page}&limit=${limit}&level=${level}&q=${q}&includeDeleted=${includeDeleted}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    if (!response.ok) throw new Error("Failed to fetch admin kanji");
    return response.json();
}

// Cập nhật Kanji
export async function updateJlptKanji(id, data) {
    const response = await fetch(`${BASE_URL}/jlpt-kanji/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update kanji");
    return response.json();
}

// Xoá Kanji (soft-delete)
export async function deleteJlptKanji(id) {
    const response = await fetch(`${BASE_URL}/jlpt-kanji/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to delete kanji");
    return response.json();
}

// Lấy danh sách đầy đủ cho admin
export async function getJlptGrammarAdmin(page = 1, limit = 20, level = "", q = "", includeDeleted = true) {
    const response = await fetch(
        `${BASE_URL}/jlpt-grammar/admin?page=${page}&limit=${limit}&level=${level}&q=${q}&includeDeleted=${includeDeleted}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    if (!response.ok) throw new Error("Failed to fetch admin grammar");
    return response.json();
}

// Cập nhật Grammar
export async function updateJlptGrammar(id, data) {
    const response = await fetch(`${BASE_URL}/jlpt-grammar/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update grammar");
    return response.json();
}

// Xoá Grammar (soft-delete)
export async function deleteJlptGrammar(id) {
    const response = await fetch(`${BASE_URL}/jlpt-grammar/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to delete grammar");
    return response.json();
}