import { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./Community.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";
import Tabs, { TabsList, TabsTrigger, TabsContent } from "~/components/Tabs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faEye,
  faArrowTrendUp,
  faClock,
  faSearch,
  faPenToSquare,
  faUsers,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";

import postService from "~/services/postService";
import formatDateVN from "~/services/formatDate";

const cx = classNames.bind(styles);

// Hàm decode JWT token
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [stats, setStats] = useState({
    totalPosts: 234,
    totalMembers: "1.2K",
    totalLikes: "3.4K",
    totalViews: "12K",
  });
  const [categories, setCategories] = useState([]);

  // Lấy userId từ token trong localStorage
  const getLoggedInUserId = () => {
    const token = localStorage.getItem("token") || 
                  localStorage.getItem("accessToken") || 
                  localStorage.getItem("authToken");
    
    if (token) {
      const decoded = decodeToken(token);
      console.log("Decoded token:", decoded);
      
      return decoded?.userId || 
             decoded?.id || 
             decoded?._id || 
             decoded?.profileId || 
             decoded?.user_id ||
             decoded?.sub ||
             null;
    }
    return null;
  };
  
  const currentUserId = getLoggedInUserId();
  console.log("Current User ID:", currentUserId);

  // Fetch posts
  const fetchPosts = async (page = 1, sort = "popular", category = null) => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (category && category !== "Tất cả") {
        data = await postService.getPostsByCategory(category, page, 5);
      } else {
        data = await postService.getPosts(page, 5, sort);
      }
      
      // Map posts với thông tin like
      const postsData = data.posts || data.data || data;
      const mappedPosts = {
        ...postsData,
        data: postsData.data?.map(post => {
          const likedArray = Array.isArray(post.liked) ? post.liked : [];
          const isUserLiked = likedArray.includes(currentUserId);
          
          return {
            ...post,
            likeCount: likedArray.length,
            isLiked: isUserLiked
          };
        }) || []
      };
      
      console.log("Mapped posts:", mappedPosts);
      setPosts(mappedPosts);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(page);
    } catch (err) {
      setError("Không thể tải bài viết. Vui lòng thử lại sau.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch community stats
  const fetchStats = async () => {
    try {
      const data = await postService.getCommunityStats();
      setStats({
        totalPosts: data.data.totalPosts  || 234,
        totalMembers: data.data.totalMembers  || "6",
        totalLikes: data.data.totalLikes  || "0",
        totalViews: data.data.totalViews  || "16",
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await postService.getCategories();
      
      const allCategories = [
        { name: "Tất cả", count: data.reduce((sum, cat) => sum + (cat.count || 0), 0) },
        ...data
      ];
      setCategories(allCategories);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([
        { name: "Tất cả", count: 234 },
        { name: "Ngữ pháp", count: 89 },
        { name: "Từ vựng", count: 67 },
        { name: "Kanji", count: 45 },
        { name: "Tài liệu", count: 23 },
        { name: "Kinh nghiệm", count: 10 },
      ]);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPosts(1, "popular");
    fetchStats();
    fetchCategories();
  }, []);

  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
    setSelectedCategory(null);
    setSearchQuery("");
    const sort = value === "all" ? "popular" : "recent";
    fetchPosts(1, sort);
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSelectedCategory(null);
      fetchPosts(1, activeTab === "all" ? "popular" : "recent");
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedCategory(null);
    try {
      const data = await postService.searchPosts(searchQuery, 1, 5);
      
      // Map search results
      const postsData = data.posts || data.data || data;
      const mappedPosts = {
        ...postsData,
        data: postsData.data?.map(post => {
          const likedArray = Array.isArray(post.liked) ? post.liked : [];
          return {
            ...post,
            likeCount: likedArray.length,
            isLiked: likedArray.includes(currentUserId)
          };
        }) || []
      };
      
      setPosts(mappedPosts);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(1);
    } catch (err) {
      setError("Không thể tìm kiếm. Vui lòng thử lại sau.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle category filter
  const handleCategoryClick = (categoryName) => {
    setSearchQuery("");
    setSelectedCategory(categoryName);
    const sort = activeTab === "all" ? "popular" : "recent";
    
    if (categoryName === "Tất cả") {
      fetchPosts(1, sort, null);
    } else {
      fetchPosts(1, sort, categoryName);
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      const sort = activeTab === "all" ? "popular" : "recent";
      fetchPosts(currentPage + 1, sort, selectedCategory);
    }
  };

  // Render posts
  const renderPosts = () => {
    if (loading) {
      return (
        <div className={cx("loading")}>
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Đang tải...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Card className={cx("error-card")}>
          <p className={cx("error-message")}>{error}</p>
          <Button
            outline
            onClick={() =>
              fetchPosts(1, activeTab === "all" ? "popular" : "recent", selectedCategory)
            }
          >
            Thử lại
          </Button>
        </Card>
      );
    }

    if (!posts.data || posts.data.length === 0) {
      return (
        <Card className={cx("empty-card")}>
          <p className={cx("empty-message")}>Không tìm thấy bài viết nào</p>
        </Card>
      );
    }

    return (
      <>
        {posts.data.map((post) => (
          <Card key={post._id || post.id} className={cx("post-card")}>
            <a href={`/community/${post._id}`}>
              <div className={cx("post-inner")}>
                {/* Header */}
                <div className={cx("post-header")}>
                  <img
                    src={post.profile_id?.image_url || "/placeholder.svg"}
                    alt={post.profile_id?.name || "User"}
                    className={cx("avatar")}
                  />
                  <div className={cx("post-header-info")}>
                    <div className={cx("post-author-row")}>
                      <span className={cx("post-author")}>
                        {post.profile_id?.name || "Anonymous"}
                      </span>
                      {post.author?.level && (
                        <span className={cx("post-level-badge")}>
                          {post.author.level}
                        </span>
                      )}
                      <span className={cx("post-time")}>
                        • {formatDateVN(post.created_at) || "Vừa xong"}
                      </span>
                    </div>
                    {post.category && (
                      <span className={cx("post-category")}>
                        {post.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className={cx("post-content")}>
                  <h3 className={cx("post-title")}>{post.title}</h3>
                  <p className={cx("post-excerpt")}>
                    {post.excerpt || post.content}
                  </p>
                </div>

                {/* Stats */}
                <div className={cx("post-stats")}>
                  <div className={cx("post-stat-item", { liked: post.isLiked })}>
                    <FontAwesomeIcon
                      icon={post.isLiked ? faHeartSolid : faHeartRegular}
                      className={cx("post-stat-icon")}
                    />
                    <span>{post.likeCount || 0}</span>
                  </div>
                  <div className={cx("post-stat-item")}>
                    <FontAwesomeIcon
                      icon={faMessage}
                      className={cx("post-stat-icon")}
                    />
                    <span>{post.comments || 0}</span>
                  </div>
                </div>
              </div>
            </a>
          </Card>
        ))}

        {currentPage < totalPages && (
          <Button
            outline
            className={cx("load-more-btn")}
            onClick={handleLoadMore}
          >
            Xem thêm
          </Button>
        )}
      </>
    );
  };

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Header */}
          <div className={cx("header")}>
            <div className={cx("header-left")}>
              <h1 className={cx("title")}>Cộng đồng</h1>
              <p className={cx("subtitle")}>Chia sẻ và học hỏi cùng nhau</p>
            </div>
            <Button
              primary
              href="/community/new"
              className={cx("create-btn")}
              leftIcon={<FontAwesomeIcon icon={faPenToSquare} />}
            >
              Tạo bài viết
            </Button>
          </div>

          {/* Stats */}
          <div className={cx("stats-grid")}>
            <Card className={cx("stat-card")}>
              <div className={cx("stat-inner")}>
                <div className={cx("stat-icon-wrap")}>
                  <FontAwesomeIcon
                    icon={faMessage}
                    className={cx("stat-icon")}
                  />
                </div>
                <div>
                  <p className={cx("stat-value")}>{stats.totalPosts}</p>
                  <p className={cx("stat-label")}>Bài viết</p>
                </div>
              </div>
            </Card>

            <Card className={cx("stat-card")}>
              <div className={cx("stat-inner")}>
                <div className={cx("stat-icon-wrap")}>
                  <FontAwesomeIcon icon={faUsers} className={cx("stat-icon")} />
                </div>
                <div>
                  <p className={cx("stat-value")}>{stats.totalMembers}</p>
                  <p className={cx("stat-label")}>Thành viên</p>
                </div>
              </div>
            </Card>

            <Card className={cx("stat-card")}>
              <div className={cx("stat-inner")}>
                <div className={cx("stat-icon-wrap")}>
                  <FontAwesomeIcon icon={faHeartSolid} className={cx("stat-icon")} />
                </div>
                <div>
                  <p className={cx("stat-value")}>{stats.totalLikes}</p>
                  <p className={cx("stat-label")}>Lượt thích</p>
                </div>
              </div>
            </Card>

            <Card className={cx("stat-card")}>
              <div className={cx("stat-inner")}>
                <div className={cx("stat-icon-wrap")}>
                  <FontAwesomeIcon icon={faEye} className={cx("stat-icon")} />
                </div>
                <div>
                  <p className={cx("stat-value")}>{stats.totalViews}</p>
                  <p className={cx("stat-label")}>Lượt xem</p>
                </div>
              </div>
            </Card>
          </div>

          <div className={cx("content")}>
            {/* Main */}
            <div className={cx("main-col")}>
              {/* Search */}
              <Card className={cx("search-card")}>
                <div className={cx("search-row")}>
                  <div className={cx("search-input-wrap")}>
                    <FontAwesomeIcon
                      icon={faSearch}
                      className={cx("search-icon")}
                    />
                    <Input
                      placeholder="Tìm kiếm bài viết..."
                      className="community-search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSearch();
                        }
                      }}
                    />
                  </div>
                  <Button outline className="orange" onClick={handleSearch}>
                    Tìm kiếm
                  </Button>
                </div>
              </Card>

              {/* Tabs */}
              <Tabs
                defaultValue="all"
                value={activeTab}
                onValueChange={handleTabChange}
              >
                <TabsList className={cx("tabs-list")}>
                  <TabsTrigger value="all">
                    <FontAwesomeIcon
                      icon={faArrowTrendUp}
                      className={cx("tab-icon")}
                    />
                    Phổ biến
                  </TabsTrigger>
                  <TabsTrigger value="recent">
                    <FontAwesomeIcon
                      icon={faClock}
                      className={cx("tab-icon")}
                    />
                    Mới nhất
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className={cx("tabs-content")}>
                  {renderPosts()}
                </TabsContent>

                <TabsContent value="recent" className={cx("tabs-content")}>
                  {renderPosts()}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <aside className={cx("sidebar")}>
              {/* Categories */}
              <Card className={cx("side-card")}>
                <h3 className={cx("side-title")}>Danh mục</h3>
                <div className={cx("categories-list")}>
                  {categories.map((category) => (
                    <button
                      key={category.name}
                      type="button"
                      className={cx("category-item", {
                        active: selectedCategory === category.name,
                      })}
                      onClick={() => handleCategoryClick(category.name)}
                    >
                      <span className={cx("category-name")}>
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Guidelines */}
              <Card className={cx("side-card")}>
                <h3 className={cx("side-title")}>Quy tắc cộng đồng</h3>
                <ul className={cx("guidelines")}>
                  <li>• Tôn trọng mọi thành viên</li>
                  <li>• Không spam hoặc quảng cáo</li>
                  <li>• Chia sẻ nội dung hữu ích</li>
                  <li>• Sử dụng ngôn ngữ lịch sự</li>
                </ul>
              </Card>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Community;