import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MainContent from '../../components/MainContentKanji/MainContentKanji';
import SearchInput from '~/components/searchInput/searchInput';
import SidebarItem from '~/components/SidebarItem/SidebarItem';
import classNames from 'classnames/bind';
import styles from './kanji_look_up.module.scss';

const cx = classNames.bind(styles);

const KanjiLookupInterface = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('kanji');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedKanji, setSelectedKanji] = useState('');
  const [selectedVocab, setSelectedVocab] = useState('');

  useEffect(() => {
    if (location.state) {
      const { searchQuery, tab } = location.state;

      if (tab) {
        setActiveTab(tab);
      }

      if (searchQuery) {
        setSearchKeyword(searchQuery);
        setTimeout(() => {
          handleSearch(searchQuery);
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handleSearch = (keyword) => {
    setSearchKeyword(keyword);
    if (activeTab === 'vocab') {
      setSelectedVocab('');
    } else {
      setSelectedKanji('');
    }
  };

  const handleSelectKanji = (kanji) => {
    setSelectedKanji(kanji);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchKeyword('');
    setSelectedKanji('');
    setSelectedVocab('');
  };

  return (
    <div className={cx('wrapper')}>
      <main className={cx('main')}>
        <div className={cx('container')}>
          <div className={cx('page-head')}>
            <h1 className={cx('title')}>Tra cứu Kanji</h1>
            <p className={cx('subtitle')}>
              Tìm kiếm theo Hán tự, âm Hán Việt, kunyomi/onyomi hoặc viết tay trực tiếp.
            </p>
          </div>

          <div className={cx('tabs')}>
            <button
              type="button"
              className={cx('tab', { active: activeTab === 'kanji' })}
              onClick={() => handleTabChange('kanji')}
            >
              Tra Kanji
            </button>
          </div>

          <SearchInput
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={handleSearch}
            placeholder={activeTab === 'vocab' ? 'Tìm từ vựng...' : '日本、nihon, Nhật Bản'}
          />

          <div className={cx('content-wrapper')}>
            <SidebarItem
              keyword={searchKeyword}
              onSelectKanji={handleSelectKanji}
              selectedKanji={selectedKanji}
            />

            <div className={cx('main-area')}>
              <MainContent selectedKanji={selectedKanji} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default KanjiLookupInterface;
