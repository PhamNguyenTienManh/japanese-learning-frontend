const ContributionService = {
    // Base URL
    BASE_URL: 'https://api.mazii.net/api',
    LOCAL_URL: process.env.REACT_APP_BASE_URL_API,

    // Token cố định
    TOKEN: '67a52195686f08c66a19d122f9bca902',

    async getComments(wordId, word) {
        try {
            // API đầu tiên
            const response = await fetch(`${this.BASE_URL}/get-mean`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wordId,
                    type: 'kanji',
                    dict: 'javi',
                    word,
                    token: this.TOKEN,
                }),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            // API thứ hai
            const responseLocal = await fetch(`${this.LOCAL_URL}/contributions/kanji/${wordId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!responseLocal.ok) throw new Error(`HTTP error! status: ${responseLocal.status}`);
            const localData = await responseLocal.json();

            // Map dữ liệu localData.comments vào data.result
            if (Array.isArray(localData.data)) {

                const mappedComments = localData.data.map((item) => ({
                    mean: item.content || null,
                    wordId: item.kanjiId || null,
                    like: item.like ?? 0,
                    dislike: item.dislike ?? 0,
                    type: item.type ?? null,
                    dict: item.dict ?? null,
                    userId: item.profileId?._id ?? null,
                    username: item.profileId?.name ?? null,
                    dict: "javi",
                    reportId: 0,
                    status: 2,
                    type: 1,
                    word: ""

                }));

                // if (!Array.isArray(data.result)) data.result = [];
                data.result.push(...mappedComments);
            }

            return data;
        } catch (error) {
            console.error('Error fetching comments:', error);
            throw error;
        }
    },



    async addComment(commentData, token) {
        try {
            const response = await fetch(`${this.LOCAL_URL}/contributions/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...commentData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }
};
export default ContributionService;
