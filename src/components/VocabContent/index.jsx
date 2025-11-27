import React, { useState, useEffect } from 'react';
import vocabService from '~/services/vocabService';
import classNames from 'classnames/bind';
import styles from './VocabContent.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeHigh, faBookmark, faPlus } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

const VocabContent = ({ selectedVocab }) => {
  const [vocabData, setVocabData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedVocab) {
      fetchVocabDetail(selectedVocab);
    } else {
      setVocabData(null);
    }
  }, [selectedVocab]);

  const fetchVocabDetail = async (slug) => {
    try {
      setLoading(true);
      setError(null);

      const response = await vocabService.getWordDetail(slug, 0);


      if (response && response) {
        setVocabData(response);
      } else {
        setError('Không tìm thấy thông tin từ vựng');
      }
    } catch (err) {
      console.error('Error fetching vocab detail:', err);
      setError('Không thể tải thông tin từ vựng');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`Phát âm: ${text}`);
    }
  };

  const handleAddToNotebook = () => {
    if (!vocabData) return;

    // TODO: Implement add to notebook functionality
    // You can navigate to notebook page or open a modal to select notebook
    const vocabInfo = {
      kanji: vocabData.word,
      hiragana: vocabData.phonetic || '',
      meaning: vocabData.means?.[0]?.mean || '',
      note: '',
      category: 'Từ vựng',
    };

    alert('Tính năng thêm vào sổ tay sẽ được cập nhật');
  };

  if (!selectedVocab) {
    return (
      <div className={cx('content')}>
        <div className={cx('empty-state')}>
          <p>Chọn một từ vựng từ danh sách bên trái để xem chi tiết</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cx('content')}>
        <div className={cx('loading-state')}>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx('content')}>
        <div className={cx('error-state')}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!vocabData) {
    return null;
  }

  return (
    <div className={cx('content')}>
      <div className={cx('vocab-detail')}>
        {/* Header */}
        <div className={cx('vocab-header')}>
          <div className={cx('header-main')}>
            <h1 className={cx('vocab-word')}>{vocabData.word}</h1>
            <button
              className={cx('audio-btn')}
              onClick={() => {
                const text = vocabData.suggest_mean
                  .replace(/\[[^\]]+\]/g, "")
                  .trim();

                // nếu CHỈ CẦN chứa 1 ký tự Latin (kể cả tiếng Việt có dấu)
                const hasLatin = /[A-Za-zÀ-ỹ]/.test(text);
                if (!hasLatin) // có Latin → không đọc
                  handlePlayAudio(vocabData.suggest_mean.replace(/\[[A-Za-zÀ-ỹ\s]+\]/g, '').trim()); 
                if(hasLatin) handlePlayAudio(vocabData.word.replace(/\[[A-Za-zÀ-ỹ\s]+\]/g, '').trim());

                
              }}


            >
              <FontAwesomeIcon icon={faVolumeHigh} />
            </button>
          </div>
          {vocabData.phonetic && (
            <p className={cx('vocab-phonetic')}>[{vocabData.phonetic}]</p>
          )}

          {vocabData.suggest_mean && (
            <p className={cx('vocab-phonetic')}>
              [{vocabData.suggest_mean.replace(/\[[A-Za-zÀ-ỹ\s]+\]/g, '').trim()}]
            </p>
          )}

        </div>

        {/* Meanings */}
        {vocabData.meanings && vocabData.meanings.length > 0 && (
          <div className={cx('section')}>
            <h2 className={cx('section-title')}>Nghĩa</h2>
            <div className={cx('meanings-list')}>
              {vocabData.meanings.map((meaning, index) => (
                <div key={index} className={cx('meaning-item')}>
                  <div className={cx('meaning-header')}>
                    {meaning.mean && (
                      <span className={cx('word-type')}>{meaning.mean}</span>
                    )}
                  </div>
                  <p className={cx('meaning-text')}>{meaning.suggest_mean}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Examples */}
        {vocabData.examples && vocabData.examples.length > 0 && (
          <div className={cx('section')}>
            <h2 className={cx('section-title')}>Ví dụ</h2>
            <div className={cx('examples-list')}>
              {vocabData.examples.map((example, index) => (
                <div key={index} className={cx('example-item')}>
                  <div className={cx('example-ja')}>
                    <span className={cx('example-text')}>{example.content}</span>
                    <button
                      className={cx('example-audio')}
                      onClick={() => handlePlayAudio(example.mean)}
                    >
                      <FontAwesomeIcon icon={faVolumeHigh} />
                    </button>
                  </div>
                  {example.mean && (
                    <p className={cx('example-vi')}>{example.mean}</p>
                  )}
                  {example.transcription && (
                    <p className={cx('example-transcription')}>
                      [{example.transcription}]
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info */}
        {vocabData.description && (
          <div className={cx('section')}>
            <h2 className={cx('section-title')}>Thông tin thêm</h2>
            <p className={cx('description')}>{vocabData.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabContent;