import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MainContent from '../../components/MainContentKanji/MainContentKanji';
import SearchInput from '~/components/searchInput/searchInput';
import SidebarItem from '~/components/SidebarItem/SidebarItem';
import VocabSidebar from '~/components/VocabSidebar';
import VocabContent from '~/components/VocabContent';
import classNames from 'classnames/bind';
import styles from './kanji_look_up.module.scss';
import searchHistoryService from '~/services/searchHistoryService';
import { useAuth } from '~/context/AuthContext';

const cx = classNames.bind(styles);

const RecentLookupCard = ({ items, onSelect }) => (
  <section className={cx('recent-card')}>
    <header className={cx('recent-head')}>
      <h2 className={cx('recent-title')}>Tra cứu gần đây</h2>
      {items.length > 0 && <span className={cx('recent-count')}>{items.length}</span>}
    </header>

    {items.length ? (
      <div className={cx('recent-list')}>
        {items.map((item, index) => (
          <button
            key={`${item}-${index}`}
            type="button"
            className={cx('recent-item')}
            onClick={() => onSelect(item)}
          >
            <span className={cx('recent-term')}>{item}</span>
          </button>
        ))}
      </div>
    ) : (
      <div className={cx('recent-empty')}>Chưa có lịch sử tra cứu</div>
    )}
  </section>
);

const KanjiLookupInterface = () => {
  const location = useLocation();
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState('kanji');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedKanji, setSelectedKanji] = useState('');
  const [selectedVocab, setSelectedVocab] = useState('');
  const [recentLookups, setRecentLookups] = useState([]);

  useEffect(() => {
    if (!userId) {
      setRecentLookups([]);
      return;
    }

    let ignore = false;

    const fetchRecentLookups = async () => {
      try {
        const result = await searchHistoryService.getSearchHistory(userId);
        if (!ignore && result.success) {
          setRecentLookups(Array.isArray(result.history) ? result.history : []);
        }
      } catch (error) {
        console.error('Error fetching recent lookup history:', error);
      }
    };

    fetchRecentLookups();

    return () => {
      ignore = true;
    };
  }, [userId]);

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

  const saveLookupHistory = async (keyword) => {
    const query = String(keyword || '').trim();
    if (!userId || !query) return;

    setRecentLookups((current) => [
      query,
      ...current.filter((item) => item.toLowerCase() !== query.toLowerCase()),
    ].slice(0, 5));

    try {
      await searchHistoryService.addSearchHistory(userId, query);
    } catch (error) {
      console.error('Error adding kanji lookup history:', error);
    }
  };

  const handleSearch = (keyword) => {
    const query = String(keyword || '').trim();
    setSearchKeyword(query);
    saveLookupHistory(query);
    if (activeTab === 'vocab') {
      setSelectedVocab('');
    } else {
      setSelectedKanji('');
    }
  };

  const handleSelectKanji = (kanji) => {
    setSelectedKanji(kanji);
    saveLookupHistory(kanji);
  };

  const handleSelectVocab = (word) => {
    setSelectedVocab(word);
    saveLookupHistory(word);
  };

  const handleSelectRecentLookup = (keyword) => {
    handleSearch(keyword);
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
                <div className={cx('lookup-sidebar')}>
                  <VocabSidebar
                    keyword={searchKeyword}
                    onSelectVocab={handleSelectVocab}
                    selectedVocab={selectedVocab}
                  />
                  <RecentLookupCard
                    items={recentLookups}
                    onSelect={handleSelectRecentLookup}
                  />
                </div>

                <div className={cx('main-area')}>
                  <VocabContent selectedVocab={selectedVocab} />
                </div>
              </>
            ) : (
              <>
                <div className={cx('lookup-sidebar')}>
                  <SidebarItem
                    keyword={searchKeyword}
                    onSelectKanji={handleSelectKanji}
                    selectedKanji={selectedKanji}
                  />
                  <RecentLookupCard
                    items={recentLookups}
                    onSelect={handleSelectRecentLookup}
                  />
                </div>

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
