import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MainContent from '../../components/MainContentKanji/MainContentKanji';
import SearchInput from '~/components/searchInput/searchInput';
import SidebarItem from '~/components/SidebarItem/SidebarItem';
import VocabSidebar from '~/components/VocabSidebar';
import VocabContent from '~/components/VocabContent';
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
    const queryParams = new URLSearchParams(location.search);
    const kanjiFromUrl = queryParams.get('kanji') || queryParams.get('q');

    if (kanjiFromUrl?.trim()) {
      const nextKanji = kanjiFromUrl.trim();
      setActiveTab('kanji');
      setSearchKeyword(nextKanji);
      setSelectedKanji(nextKanji);
      setSelectedVocab('');
      return;
    }

    if (location.state) {
      const { searchQuery, tab } = location.state;

      if (tab) {
        setActiveTab(tab);
      }

      if (searchQuery?.trim()) {
        const nextKeyword = searchQuery.trim();
        setSearchKeyword(nextKeyword);
        if ((tab || activeTab) === 'vocab') {
          setSelectedVocab('');
          setSelectedKanji('');
        } else {
          setSelectedKanji(nextKeyword);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, location.state]);

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
            <h1 className={cx('title')}>{activeTab === 'vocab' ? 'Tra cứu từ vựng' : 'Tra cứu Kanji'}</h1>
            <p className={cx('subtitle')}>
              {activeTab === 'vocab'
                ? 'Tìm kiếm từ vựng JLPT theo từ, cách đọc hoặc nghĩa tiếng Việt.'
                : 'Tìm kiếm theo Hán tự, âm Hán Việt, kunyomi/onyomi hoặc viết tay trực tiếp.'}
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
            <button
              type="button"
              className={cx('tab', { active: activeTab === 'vocab' })}
              onClick={() => handleTabChange('vocab')}
            >
              Tra từ vựng
            </button>
          </div>

          <SearchInput
            value={searchKeyword}
            onSearch={handleSearch}
            placeholder={activeTab === 'vocab' ? 'Tìm từ vựng...' : '日本、nihon, Nhật Bản'}
            suggestionType={activeTab}
          />

          <div className={cx('content-wrapper')}>
            {activeTab === 'vocab' ? (
              <>
                <VocabSidebar
                  keyword={searchKeyword}
                  onSelectVocab={setSelectedVocab}
                  selectedVocab={selectedVocab}
                />

                <div className={cx('main-area')}>
                  <VocabContent selectedVocab={selectedVocab} />
                </div>
              </>
            ) : (
              <>
                <SidebarItem
                  keyword={searchKeyword}
                  onSelectKanji={handleSelectKanji}
                  selectedKanji={selectedKanji}
                />

                <div className={cx('main-area')}>
                  <MainContent selectedKanji={selectedKanji} />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default KanjiLookupInterface;
