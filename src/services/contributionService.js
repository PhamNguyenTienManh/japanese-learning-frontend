const ContributionService = {
    LOCAL_URL: process.env.REACT_APP_BASE_URL_API,

    async getComments(wordId, word) {
        try {
            const lookupId = wordId || word;
            const response = await fetch(`${this.LOCAL_URL}/contributions/kanji/${lookupId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },

            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const localData = await response.json();
            const localComments = Array.isArray(localData?.data)
                ? localData.data
                : Array.isArray(localData)
                    ? localData
                    : [];

            const mappedComments = localComments.map((item) => ({
                mean: item.content || null,
                wordId: item.kanjiId || null,
                like: item.like ?? 0,
                dislike: item.dislike ?? 0,
                userId: item.profileId?._id ?? null,
                username: item.profileId?.name ?? null,
                dict: "javi",
                reportId: item._id || item.id || item.kanjiId,
                status: 2,
                type: 1,
                word: word || "",
            }));

            return {
                status: 200,
                result: mappedComments,
            };
        } catch (error) {
            console.error("Error fetching comments:", error);
            throw error;
        }
    },

    async addComment(commentData) {
        try {
            const response = await fetch(`${this.LOCAL_URL}/contributions/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...commentData,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error("Error adding comment:", error);
            throw error;
        }
    },
};

export default ContributionService;
