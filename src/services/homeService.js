import axios from "axios";
const API_BASE_URL = process.env.REACT_APP_BASE_URL_API;
const trendingWordsService = {
    // // Lấy danh sách từ nổi bật từ Mazii API
    // getTrendingWords: async (limit = 5) => {
    //     try {
    //         const vietnameseRegex =
    //             /[áàảãạâấầẩẫậăắằẳẵặéèẻẽẹêếềểễệóòỏõọôốồổỗộơớờởỡợíìỉĩịúùủũụưứừửữựýỳỷỹỵđ]/i;

    //         const response = await axios.get(
    //             "https://api.mazii.net/api/get-search-trend?dict=javi"
    //         );

    //         const data = response.data;

    //         if (!data || !Array.isArray(data)) {
    //             return {
    //                 success: false,
    //                 data: [],
    //                 message: "Không có dữ liệu",
    //             };
    //         }

    //         const filtered = data
    //             .map((item) => {
    //                 const vnMeans = item.means.filter((m) =>
    //                     vietnameseRegex.test(m.mean)
    //                 );

    //                 if (vnMeans.length === 0) return null;

    //                 return {
    //                     ...item,
    //                     means: vnMeans, 
    //                 };
    //             })
    //             .filter(Boolean);

    //         const result = filtered.slice(0, limit).map((item) => ({
    //             id: item.content,
    //             kanji: item.content,
    //             hiragana: item.phonetic || "",
    //             meaning: item.means[0].mean || "Không có nghĩa",
    //             views: item.total || 0,
    //             type: item.type,
    //         }));

    //         return {
    //             success: true,
    //             data: result,
    //         };
    //     } catch (error) {
    //         console.error("Error fetching trending words:", error);
    //         return {
    //             success: false,
    //             data: [],
    //             message: error.message || "Lỗi khi tải từ nổi bật",
    //         };
    //     }
    // },
    getTrendingWords: async (limit = 5) => {
        try {
            const response = await fetch(`${API_BASE_URL}/search-history/trending?limit=${limit}`);
            if (!response.ok) {
                throw new Error('Failed to fetch trending words');
            }
            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Error fetching trending words:', error);
            return {
                success: false,
                data: []
            };
        }
    }
};

export default trendingWordsService;