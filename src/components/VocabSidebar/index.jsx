import React, { useState, useEffect } from 'react';
import vocabService from '~/services/vocabService';
import classNames from 'classnames/bind';
import styles from './VocabSidebar.module.scss';

const cx = classNames.bind(styles);

const VocabSidebar = ({ keyword, onSelectVocab, selectedVocab }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (keyword && keyword.trim()) {
      fetchSuggestions(keyword.trim());
    } else {
      setSuggestions([]);
    }
  }, [keyword]);

  const fetchSuggestions = async (searchKeyword) => {
    try {
      setLoading(true);
      setError(null);

      const response = await vocabService.getSuggestions(searchKeyword, 'start', 'word');
      console.log("sidebar", response.list);
      

      if (response && response.list) {
        setSuggestions(response.list);
        
        // Auto select first item if available
        if (response.list.length > 0 && !selectedVocab) {
          onSelectVocab(response.list[0].slug);
        }
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Không thể tải gợi ý từ vựng');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVocab = (vocabSlug) => {
    onSelectVocab(vocabSlug);
  };

  return (
    <div className={cx('sidebar')}>
      <div className={cx('sidebar-header')}>
        <h3 className={cx('title')}>Kết quả tìm kiếm</h3>
        {suggestions.length > 0 && (
          <span className={cx('count')}>({suggestions.length})</span>
        )}
      </div>

      <div className={cx('sidebar-content')}>
        {loading && (
          <div className={cx('loading')}>
            <p>Đang tải...</p>
          </div>
        )}

        {error && (
          <div className={cx('error')}>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && suggestions.length === 0 && keyword && (
          <div className={cx('empty')}>
            <p>Không tìm thấy từ vựng nào</p>
          </div>
        )}

        {!loading && !error && suggestions.length === 0 && !keyword && (
          <div className={cx('empty')}>
            <p>Nhập từ khóa để tìm kiếm</p>
          </div>
        )}

        {!loading && !error && suggestions.length > 0 && (
          <div className={cx('suggestions-list')}>
            {suggestions.map((item) => (
              <div
                key={item.slug}
                className={cx('suggestion-item', {
                  active: selectedVocab === item.slug,
                })}
                onClick={() => handleSelectVocab(item.slug)}
              >
                <div className={cx('vocab-main')}>
                  <span className={cx('vocab-word')}>{item.word}</span>
                  {item.phonetic && (
                    <span className={cx('vocab-phonetic')}>
                      [{item.phonetic}]
                    </span>
                  )}
                </div>
                {item.mean && (
                  <p className={cx('vocab-meaning')}>{item.mean}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabSidebar;