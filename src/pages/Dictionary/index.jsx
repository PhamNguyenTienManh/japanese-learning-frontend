import React, { useState } from "react";
import classNames from "classnames/bind";
import styles from "./Dictionary.module.scss";

import Button from "~/components/Button";
import Card from "~/components/Card";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faBookmark as faBookmarkSolid,
} from "@fortawesome/free-solid-svg-icons";
import WordCard from "~/components/WordCard";

const cx = classNames.bind(styles);

const mockWords = [
  {
    id: 1,
    kanji: "勉強",
    hiragana: "べんきょう",
    romaji: "benkyou",
    meaning: "học tập, học hành",
    jlptLevel: "N5",
    examples: [
      {
        japanese: "毎日日本語を勉強します。",
        vietnamese: "Tôi học tiếng Nhật mỗi ngày.",
      },
    ],
  },
  {
    id: 2,
    kanji: "学校",
    hiragana: "がっこう",
    romaji: "gakkou",
    meaning: "trường học",
    jlptLevel: "N5",
    examples: [
      {
        japanese: "学校に行きます。",
        vietnamese: "Tôi đi đến trường.",
      },
    ],
  },
  {
    id: 3,
    kanji: "先生",
    hiragana: "せんせい",
    romaji: "sensei",
    meaning: "giáo viên, thầy/cô",
    jlptLevel: "N5",
    examples: [
      {
        japanese: "田中先生は優しいです。",
        vietnamese: "Thầy Tanaka rất tốt bụng.",
      },
    ],
  },
];

export default function Dictionary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(mockWords);
  const [savedWords, setSavedWords] = useState([]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();

    if (!q) {
      setSearchResults(mockWords);
      return;
    }

    const filtered = mockWords.filter(
      (word) =>
        word.kanji.includes(q) ||
        word.hiragana.includes(q) ||
        word.romaji.toLowerCase().includes(q.toLowerCase()) ||
        word.meaning.toLowerCase().includes(q.toLowerCase())
    );

    setSearchResults(filtered);
  };

  const toggleSaveWord = (id) => {
    setSavedWords((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const playAudio = (text) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ja-JP";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
      return;
    }
    alert(`Phát âm: ${text}`);
  };

  return (
    <div className={cx("root")}>
      <div className={cx("container")}>
        {/* Header */}
        <header className={cx("header")}>
          <h1 className={cx("title")}>Từ điển Nhật-Việt</h1>
          <p className={cx("subtitle")}>
            Tra cứu từ vựng với phát âm và ví dụ minh họa
          </p>
        </header>

        {/* Search */}
        <form className={cx("search")} onSubmit={handleSearch}>
          <div className={cx("search-row")}>
            <div className={cx("search-input-wrap")}>
              <FontAwesomeIcon icon={faSearch} className={cx("search-icon")} />
              <input
                type="text"
                className={cx("input")}
                placeholder="Tìm kiếm bằng Kanji, Hiragana, Romaji hoặc nghĩa tiếng Việt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button type="submit" primary>
              Tìm kiếm
            </Button>
          </div>
        </form>

        {/* Quick links */}
        <div className={cx("quick-links")}>
          <Button
            to="/dictionary/notebook"
            outline
            className={"orange"}
            leftIcon={<FontAwesomeIcon icon={faBookmarkSolid} />}
          >
            Sổ tay của tôi ({savedWords.length})
          </Button>

          <span className={cx("badge")}>JLPT N5</span>
          <span className={cx("badge")}>JLPT N4</span>
          <span className={cx("badge")}>JLPT N3</span>
        </div>

        {/* Results */}
        <section className={cx("results")}>
          {searchResults.length === 0 ? (
            <Card className={cx("empty")}>
              <p className={cx("empty-text")}>Không tìm thấy kết quả nào</p>
            </Card>
          ) : (
            searchResults.map((word) => (
              <WordCard
                key={word.id}
                word={word}
                saved={savedWords.includes(word.id)}
                onToggleSave={toggleSaveWord}
                onPlay={playAudio}
              />
            ))
          )}
        </section>
      </div>
    </div>
  );
}
