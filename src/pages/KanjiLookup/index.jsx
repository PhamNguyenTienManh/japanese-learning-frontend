import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MainContent from '../../components/MainContentKanji/MainContentKanji';
import VocabContent from '~/components/VocabContent';
import SearchInput from '~/components/searchInput/searchInput';
import SidebarItem from '~/components/SidebarItem/SidebarItem';
import VocabSidebar from '~/components/VocabSidebar/'
import classNames from 'classnames/bind';
import styles from './kanji_look_up.module.scss';

const cx = classNames.bind(styles);

const KanjiLookupInterface = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('vocab');
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
  }, [location.state]);

  const handleSearch = (keyword) => {
    setSearchKeyword(keyword);
    // Reset selected item khi search mới
    if (activeTab === 'vocab') {
      setSelectedVocab('');
    } else {
      setSelectedKanji('');
    }
  };

  const handleSelectKanji = (kanji) => {
    setSelectedKanji(kanji);
  };

  const handleSelectVocab = (vocab) => {
    setSelectedVocab(vocab);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchKeyword('');
    setSelectedKanji('');
    setSelectedVocab('');
  };

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div className={cx('container')}>
        {/* Tabs */}
        <div className={cx('tabs')}>
          {/* <button
            className={cx('tab', { active: activeTab === 'vocab' })}
            onClick={() => handleTabChange('vocab')}
          >
            Tra từ vựng
          </button> */}
          <button
            className={cx('tab', { active: activeTab === 'kanji' })}
            onClick={() => handleTabChange('kanji')}
          >
            Tra Kanji
          </button>
        </div>

        <div className={cx('content-wrapper')}>
          {/* Sidebar */}
          {/* {activeTab === 'vocab' ? (
            <VocabSidebar
              keyword={searchKeyword}
              onSelectVocab={handleSelectVocab}
              selectedVocab={selectedVocab}
            />
          ) : ( */}
            <SidebarItem
              keyword={searchKeyword}
              onSelectKanji={handleSelectKanji}
              selectedKanji={selectedKanji}
            />
          {/* )} */}

          {/* Main content */}
          <div className={cx('main-area')}>
            <div className={cx('search-header')}>
              <SearchInput
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onSearch={handleSearch}
                placeholder={activeTab === 'vocab' ? 'Tìm từ vựng...' : 'Tìm Kanji...'}
              />
            </div>

            {/* {activeTab === 'vocab' ? (
              <VocabContent selectedVocab={selectedVocab} />
            ) : (
              <MainContent selectedKanji={selectedKanji} />
            )} */}
            {activeTab === 'vocab' ? (
              <MainContent selectedKanji={selectedKanji} />
            ) : (
              <MainContent selectedKanji={selectedKanji} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanjiLookupInterface;