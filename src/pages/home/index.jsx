import { useState, useEffect } from "react";
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
  const [showHandwriting, setShowHandwriting] = useState(false);
  const [recognizedResults, setRecognizedResults] = useState([]);

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

  useEffect(() => {
    if (!showHandwriting) return;

    const canvas = document.getElementById("handwriting-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let timeoutId = null;

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const startDrawing = (e) => {
      isDrawing = true;
      const pos = getMousePos(e);
      lastX = pos.x;
      lastY = pos.y;
    };

    const draw = (e) => {
      if (!isDrawing) return;
      const pos = getMousePos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
      if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(handleRecognize, 100);
    };

    const stopDrawing = () => {
      isDrawing = false;
    }

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseout", stopDrawing);
    };
  }, [showHandwriting]);

  const handleClear = () => {
    const canvas = document.getElementById("handwriting-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setRecognizedResults([]);
  };

  const handleRecognize = async () => {
    const canvas = document.getElementById("handwriting-canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");

    try {
      const res = await fetch("http://127.0.0.1:5000/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const results = await res.json();
      setRecognizedResults(results);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi nhận dạng kanji.");
    }
  };

  const handleSelectKanji = (kanji) => {
    setSearchQuery(kanji);
    setShowHandwriting(false);
    setRecognizedResults([]);
    // Trigger search with the selected kanji
    const filtered = mockWords.filter(
      (word) =>
        word.kanji.includes(kanji) ||
        word.hiragana.includes(kanji) ||
        word.romaji.toLowerCase().includes(kanji.toLowerCase()) ||
        word.meaning.toLowerCase().includes(kanji.toLowerCase())
    );
    setSearchResults(filtered);
  };

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
                onClick={(e) => {
                  e.preventDefault();
                  setShowHandwriting(true);
                }}
              >
                ✏️
              </Button>

              {/* Handwriting Popup */}
              {showHandwriting && (
                <div className={cx("handwriting-popup")}>
                  <div className={cx("popup-header")}>
                    <h3>Viết kanji tại đây</h3>
                    <button
                      className={cx("close-btn")}
                      onClick={() => {
                        setShowHandwriting(false);
                        setRecognizedResults([]);
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{display:"flex", flexDirection: "row", flex: "1"}}>

                  <div className={cx("canvas-container")}>
                    <canvas
                      id="handwriting-canvas"
                      width={400}
                      height={130}
                    />
                  </div>

                  <div className={cx("button-group")}>
                    <Button text onClick={handleClear}>
                      Xóa
                    </Button>
                  </div>
                  </div>

                  {recognizedResults.length > 0 && (
                    <div className={cx("results-list")}>
                      <div className={cx("kanji-suggestions")}>
                        {recognizedResults.map((result, index) => (
                          <button
                            key={index}
                            className={cx("kanji-item")}
                            onClick={() => handleSelectKanji(result.kanji)}
                          >
                            <span className={cx("kanji-char")}>
                              {result.kanji}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>

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