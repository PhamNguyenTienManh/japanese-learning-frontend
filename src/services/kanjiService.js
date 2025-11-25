export const fetchKanjiDetail = async (query, page = 1) => {
    try {
        const response = await fetch('https://mazii.net/api/search/kanji', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                dict: 'javi',
                type: 'kanji',
                query,
                page
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Trả về kanji đầu tiên
        return data.results[0];
    } catch (error) {
        console.error('Error fetching kanji:', error);
        return null;
    }
};
