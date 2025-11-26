import axios from 'axios';

const JDICT_API_URL = 'https://api.jdict.net/api/v1';

const vocabService = {
  // Lấy gợi ý từ vựng
  getSuggestions: async (keyword, keywordPosition = 'start', type = 'word') => {
    try {
      const encodedKeyword = encodeURIComponent(keyword);
      
      const response = await axios.get(
        `${JDICT_API_URL}/suggest`,
        {
          params: {
            keyword: keyword,
            keyword_position: keywordPosition,
            type: type,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      throw error;
    }
  },

  // Lấy chi tiết từ vựng
  getWordDetail: async (slug, getRelate = 0) => {
    console.log("slug",slug);
    
    try {
      const response = await axios.get(
        `${JDICT_API_URL}/words/${slug}`,
        {
          params: {
            get_relate: getRelate,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching word detail:', error);
      throw error;
    }
  },

  // Tìm kiếm từ vựng (nếu cần thêm)
  searchWords: async (keyword, page = 1, limit = 20) => {
    try {
      const response = await axios.get(
        `${JDICT_API_URL}/words/search`,
        {
          params: {
            keyword: keyword,
            page: page,
            limit: limit,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error searching words:', error);
      throw error;
    }
  },
};

export default vocabService;