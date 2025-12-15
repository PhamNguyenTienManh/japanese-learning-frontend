import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFire,
  faEye,
  faHeart,
  faComments,
  faHistory,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import WordCard from "~/components/WordCard";
import styles from "./Home.module.scss";
import Card from "~/components/Card";
import SearchInput from "~/components/searchInput/searchInput";
import searchHistoryService from "~/services/searchHistoryService";
import decodeToken from "~/services/pairToken";
import trendingWordsService from "~/services/homeService";
import handlePlayAudio from "~/services/handlePlayAudio";

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
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(mockWords);
  const [savedWords, setSavedWords] = useState([]);
  const [showHandwriting, setShowHandwriting] = useState(false);
  const [recognizedResults, setRecognizedResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [trendingWords, setTrendingWords] = useState([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const payload = decodeToken(localStorage.getItem("token"));
  const userId = payload?.sub;

  useEffect(() => {
    fetchSearchHistory();
    fetchTrendingWords();
  }, []);

  const fetchSearchHistory = async () => {
    const result = await searchHistoryService.getSearchHistory(userId);


    if (result.success) {
      setSearchHistory(result.history);
    }
  };

  const fetchTrendingWords = async () => {
    setIsLoadingTrending(true);
    const result = await trendingWordsService.getTrendingWords(5);

    if (result.success) {
      setTrendingWords(result.data);
    }
    setIsLoadingTrending(false);
  };

  const addToSearchHistory = async (keyword) => {
    await searchHistoryService.addSearchHistory(userId, keyword.trim());
    fetchSearchHistory();
  };

  const handleSearch = (keyword) => {
    const q = keyword.trim();

    if (!q) {
      return;
    }

    addToSearchHistory(q);

    navigate("/kanji", {
      state: {
        searchQuery: q,
        tab: "vocab",
      },
    });
  };

  const removeHistoryItem = async (query) => {
    await searchHistoryService.removeSearchHistory(userId, query);
    fetchSearchHistory();
  };

  const clearAllHistory = async () => {
    await searchHistoryService.clearAllHistory(userId);
    setSearchHistory([]);
  };

  const searchFromHistory = (keyword) => {
    handleSearch(keyword);
  };

  const toggleSaveWord = (id) => {
    setSavedWords((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };


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
    };

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
    // Navigate to KanjiLookup with selected kanji
    navigate("/kanji-lookup", {
      state: {
        searchQuery: kanji,
        tab: "kanji",
      },
    });
  };

  return (
    <div className={cx("wrapper")}>
      <div className={cx("container")}>
        <div className={cx("content")}>
          <aside className={cx("sidebar")}>
            <div style={{ width: "100%", display: "flex" }}>
              <div className={cx("header")}>
                <h1>Chào ngày mới! 👋</h1>
                <p>Hôm nay bạn muốn học gì?</p>
              </div>
            </div>

            <div className={cx("section")}>
              <h4>
                <FontAwesomeIcon icon={faFire} /> TỪ NỔI BẬT
              </h4>
              {isLoadingTrending ? (
                <Card>
                  <p style={{ textAlign: "center", color: "#888" }}>
                    Đang tải...
                  </p>
                </Card>
              ) : trendingWords.length === 0 ? (
                <Card>
                  <p style={{ textAlign: "center", color: "#888" }}>
                    Không có dữ liệu
                  </p>
                </Card>
              ) : (
                trendingWords.map((w, i) => (
                  <Card
                    key={w.id}
                    onClick={() => handleSearch(w.kanji)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={cx("trend-header")}>
                      <span className={cx("rank")}>{i + 1}</span>
                      <h5>{w.kanji}</h5>
                    </div>
                    {w.hiragana && <p>{w.hiragana}</p>}
                    <p>{w.meaning}</p>
                    <small>{w.views.toLocaleString()} lượt xem</small>
                  </Card>
                ))
              )}
            </div>

            {/* <div className={cx("section")}>
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
            </div> */}
          </aside>
          <div className={cx("main")}>
            <div >
              <SearchInput onSearch={handleSearch} />
            </div>
            <div className={cx("section")}>
              <div style={{ display: "flex" }}>
                <h4>
                  <FontAwesomeIcon icon={faHistory} /> LỊCH SỬ TÌM KIẾM
                </h4>
              </div>
              <div>
                {searchHistory.length === 0 ? (
                  <Card>
                    <p
                      style={{
                        textAlign: "center",
                        color: "#888",
                        fontSize: "14px",
                      }}
                    >
                      Chưa có lịch sử tìm kiếm
                    </p>
                  </Card>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(10,1fr)",
                      columnGap: "4px",
                      rowGap: "0px",
                    }}
                  >
                    {searchHistory.slice(0, 10).map((query, index) => (
                      <Card
                        key={`${query}-${index}`}
                        className={cx("history-card")}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <div
                            onClick={() => searchFromHistory(query)}
                            style={{ flex: 1, cursor: "pointer" }}
                          >
                            <h5 style={{ margin: "0", fontSize: "12px" }}>
                              {query}
                            </h5>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeHistoryItem(query);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#999",
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                            title="Xóa"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
                    onPlay={handlePlayAudio}
                  />
                ))
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;