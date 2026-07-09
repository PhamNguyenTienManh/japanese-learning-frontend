const BASE_URL = process.env.REACT_APP_API_URL;


// Lấy danh sách từ vựng JLPT
export async function getJlptWords(page = 1, limit = 9, level = "N4") {
    const response = await fetch(
        `${BASE_URL}/jlpt-word?page=${page}&limit=${limit}&level=${level}`,
        {
            method: "GET",
            credentials: "include",
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
            credentials: "include",
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
            credentials: "include",
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

export async function getJlptWordDetail(word) {
    const response = await fetch(
        `${BASE_URL}/jlpt-word/detail?word=${encodeURIComponent(word)}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch JLPT word detail: ${response.statusText}`);
    }

    return response.json();
}

export async function getJlptGrammarDetail(grammar) {
    const response = await fetch(
        `${BASE_URL}/jlpt-grammar/detail?grammar=${encodeURIComponent(grammar)}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch JLPT grammar detail: ${response.statusText}`);
    }

    return response.json();
}

export async function getJlptKanjiDetail(kanji) {
    const response = await fetch(
        `${BASE_URL}/jlpt-kanji/detail?kanji=${encodeURIComponent(kanji)}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch JLPT kanji detail: ${response.statusText}`);
    }

    return response.json();
}

// Lấy danh sách đầy đủ cho admin
export async function getJlptWordsAdmin(page = 1, limit = 20, level = "", q = "", includeDeleted = true) {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        level,
        q,
        includeDeleted: String(includeDeleted),
    });
    const response = await fetch(
        `${BASE_URL}/jlpt-word/admin?${params.toString()}`,
        { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } }
    );
    if (!response.ok) throw new Error("Failed to fetch admin words");
    return response.json();
}

export async function getJlptWordAdminById(id) {
    const response = await fetch(`${BASE_URL}/jlpt-word/admin/${id}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to fetch admin word detail");
    return response.json();
}

export async function createJlptWord(data) {
    const response = await fetch(`${BASE_URL}/jlpt-word`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create word");
    return response.json();
}

// Cập nhật từ vựng
export async function updateJlptWord(id, data) {
    const response = await fetch(`${BASE_URL}/jlpt-word/${id}`, {
        method: "PUT",
        credentials: "include",
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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to delete word");
    return response.json();
}

// Lấy danh sách đầy đủ cho admin
export async function getJlptKanjiAdmin(page = 1, limit = 20, level = "", q = "", includeDeleted = true) {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        level,
        q,
        includeDeleted: String(includeDeleted),
    });
    const response = await fetch(
        `${BASE_URL}/jlpt-kanji/admin?${params.toString()}`,
        { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } }
    );
    if (!response.ok) throw new Error("Failed to fetch admin kanji");
    return response.json();
}

export async function getJlptKanjiAdminById(id) {
    const response = await fetch(`${BASE_URL}/jlpt-kanji/admin/${id}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to fetch admin kanji detail");
    return response.json();
}

export async function createJlptKanji(data) {
    const response = await fetch(`${BASE_URL}/jlpt-kanji`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create kanji");
    return response.json();
}

// Cập nhật Kanji
export async function updateJlptKanji(id, data) {
    const response = await fetch(`${BASE_URL}/jlpt-kanji/${id}`, {
        method: "PUT",
        credentials: "include",
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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to delete kanji");
    return response.json();
}

// Lấy danh sách đầy đủ cho admin
export async function getJlptGrammarAdmin(page = 1, limit = 20, level = "", q = "", includeDeleted = true) {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        level,
        q,
        includeDeleted: String(includeDeleted),
    });
    const response = await fetch(
        `${BASE_URL}/jlpt-grammar/admin?${params.toString()}`,
        { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } }
    );
    if (!response.ok) throw new Error("Failed to fetch admin grammar");
    return response.json();
}

export async function getJlptGrammarAdminById(id) {
    const response = await fetch(`${BASE_URL}/jlpt-grammar/admin/${id}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to fetch admin grammar detail");
    return response.json();
}

export async function createJlptGrammar(data) {
    const response = await fetch(`${BASE_URL}/jlpt-grammar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create grammar");
    return response.json();
}

// Cập nhật Grammar
export async function updateJlptGrammar(id, data) {
    const response = await fetch(`${BASE_URL}/jlpt-grammar/${id}`, {
        method: "PUT",
        credentials: "include",
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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to delete grammar");
    return response.json();
}

async function importExcel(endpoint, file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(body?.message || "Failed to import Excel file");
    }
    return body;
}

async function downloadExcel(endpoint, fallbackFilename) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "GET",
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Failed to download Excel file");
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || "";
    const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
    const filename = filenameMatch?.[1] || fallbackFilename;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

export function importJlptWordExcel(file) {
    return importExcel("/jlpt-word/import-file", file);
}

export function importJlptKanjiExcel(file) {
    return importExcel("/jlpt-kanji/import-file", file);
}

export function importJlptGrammarExcel(file) {
    return importExcel("/jlpt-grammar/import-file", file);
}

export function downloadJlptWordTemplate() {
    return downloadExcel("/jlpt-word/template", "jlpt-word-template.xlsx");
}

export function downloadJlptKanjiTemplate() {
    return downloadExcel("/jlpt-kanji/template", "jlpt-kanji-template.xlsx");
}

export function downloadJlptGrammarTemplate() {
    return downloadExcel("/jlpt-grammar/template", "jlpt-grammar-template.xlsx");
}

export function exportJlptWordExcel() {
    return downloadExcel("/jlpt-word/export", "jlpt-word-export.xlsx");
}

export function exportJlptKanjiExcel() {
    return downloadExcel("/jlpt-kanji/export", "jlpt-kanji-export.xlsx");
}

export function exportJlptGrammarExcel() {
    return downloadExcel("/jlpt-grammar/export", "jlpt-grammar-export.xlsx");
}
