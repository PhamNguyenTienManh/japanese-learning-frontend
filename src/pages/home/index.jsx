import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./Home.module.scss";

import Button from "~/components/Button";
import Input from "~/components/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faFire,
  faEye,
  faHeart,
  faComments,
} from "@fortawesome/free-solid-svg-icons";
import Card from "~/components/Card";
import Tabs, { TabsContent, TabsList, TabsTrigger } from "~/components/Tabs";
import WordCard from "~/components/WordCard";

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

const trendingWords = [
  {
    id: 1,
    kanji: "頑張る",
    hiragana: "がんばる",
    meaning: "cố gắng",
    views: 1250,
  },
  {
    id: 2,
    kanji: "素晴らしい",
    hiragana: "すばらしい",
    meaning: "tuyệt vời",
    views: 980,
  },
  {
    id: 3,
    kanji: "楽しい",
    hiragana: "たのしい",
    meaning: "vui vẻ",
    views: 850,
  },
];

const communityPosts = [
  {
    id: 1,
    title: "Cách phân biệt N5 và N4 kanji hiệu quả?",
    author: "Minh Anh",
    views: 324,
    likes: 45,
    comments: 12,
    category: "Học Tiếng Nhật",
  },
  {
    id: 2,
    title: "Luyện phát âm chuẩn tiếng Nhật như thế nào?",
    author: "Hạnh Linh",
    views: 156,
    likes: 28,
    comments: 8,
    category: "Phát âm",
  },
];

const cx = classNames.bind(styles);

function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(mockWords);
  const [savedWords, setSavedWords] = useState([]);
  const [activeTab, setActiveTab] = useState("text");

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
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  const playAudio = (text) => alert(`Phát âm: ${text}`);

  return (
    <div className={cx("wrapper")}>
      <div className={cx("container")}>
        <div className={cx("header")}>
          <h1>Chào ngày mới! 👋</h1>
          <p>Hôm nay bạn muốn học gì?</p>
        </div>

        <div className={cx("content")}>
          <div className={cx("main")}>
            <form onSubmit={handleSearch} className={cx("search-form")}>
              <Input
                type="text"
                placeholder="日本、nihon, Nhật Bản"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={"search"}
                leftIcon={<FontAwesomeIcon icon={faSearch} />}
              />
              <Button
                text
                className={cx("pen-btn")}
                onClick={() => setActiveTab("handwriting")}
              >
                ✏️
              </Button>
            </form>

            {/* Tabs */}
            <Tabs active={activeTab} onChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="text">Nhập văn bản</TabsTrigger>
                <TabsTrigger value="handwriting">Viết tay</TabsTrigger>
              </TabsList>

              <TabsContent value="text">
                <section className={cx("results")}>
                  {searchResults.length === 0 ? (
                    <Card className={cx("empty")}>
                      <p className={cx("empty-text")}>
                        Không tìm thấy kết quả nào
                      </p>
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
              </TabsContent>

              <TabsContent value="handwriting">
                <Card className={cx("handwriting")}>
                  <p>Khu vực viết tay (chưa tích hợp canvas)</p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <aside className={cx("sidebar")}>
            <div className={cx("section")}>
              <h4>
                <FontAwesomeIcon icon={faFire} /> TỪ NỔI BẬT
              </h4>
              {trendingWords.map((w, i) => (
                <Card key={w.id} className={cx("trend-card")}>
                  <div className={cx("trend-header")}>
                    <span className={cx("rank")}>{i + 1}</span>
                    <h5>{w.kanji}</h5>
                  </div>
                  <p>{w.hiragana}</p>
                  <p>{w.meaning}</p>
                  <small>{w.views.toLocaleString()} lượt xem</small>
                </Card>
              ))}
            </div>

            <div className={cx("section")}>
              <h4>
                <FontAwesomeIcon icon={faComments} /> HỎI & ĐÁP
              </h4>
              {communityPosts.map((p) => (
                <Card key={p.id} className={cx("post-card")}>
                  <h5>{p.title}</h5>
                  <div className={cx("meta")}>
                    <span>
                      <FontAwesomeIcon icon={faEye} /> {p.views}
                    </span>
                    <span>
                      <FontAwesomeIcon icon={faHeart} /> {p.likes}
                    </span>
                    <span>
                      <FontAwesomeIcon icon={faComments} /> {p.comments}
                    </span>
                  </div>
                  <p>Bởi {p.author}</p>
                </Card>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Home;
