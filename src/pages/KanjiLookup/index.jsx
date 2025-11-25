import React, { useState, useEffect } from 'react';
import MainContent from '../../components/MainContentKanji/MainContentKanji'
import SearchInput from '~/components/searchInput/searchInput';
import SidebarItem from '~/components/SidebarItem/SidebarItem';
import Contribution from '~/components/contribution/contribution';
const KanjiLookupInterface = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedKanji, setSelectedKanji] = useState('');

  const handleSearch = (keyword) => {
    setSearchKeyword(keyword);
  };

  const handleSelectKanji = (kanji) => {
    setSelectedKanji(kanji);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <SidebarItem 
        keyword={searchKeyword} 
        onSelectKanji={handleSelectKanji}
        selectedKanji={selectedKanji}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 32px', backgroundColor: '#fff', borderBottom: '1px solid #e0e0e0' }}>
          <SearchInput onSearch={handleSearch} />
        </div>
        <MainContent selectedKanji={selectedKanji} />
        
        
      </div>
    </div>
  );
};

export default KanjiLookupInterface;