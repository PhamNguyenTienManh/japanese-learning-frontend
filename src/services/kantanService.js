// src/services/kantanService.js

class KantanService {
    constructor(baseUrl = 'https://japanese-learning-backend-5qez.onrender.com/api') {
        this.baseUrl = baseUrl;
    }

    async searchKanji(params) {
        try {
            const body = new URLSearchParams({
                m: 'dictionary',
                fn: 'kanji_list',
                level: String(params.level ?? 0),
                strokeNumber: String(params.strokeNumber ?? 0),
                keyword: params.keyword ?? '',
                pageIndex: String(params.pageIndex ?? 1),
            });

            const response = await fetch(`${this.baseUrl}/kantan/search-kanji`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body.toString(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error searching kanji:', error);
            throw error;
        }
    }

}

export const kantanService = new KantanService();
export default kantanService;