import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import postService from "~/services/postService";
import CommunityHeader from "~/components/CommunityHeader";
import CommunityLeftSidebar from "~/components/CommunityLeftSidebar";
import CommunitySidebar from "~/components/CommunitySidebar/CommunitySidebar";
import PostList from "~/components/PostList/PostList";
import Header from "~/layouts/components/Header";
import { useAuth } from "~/context/AuthContext";
import PostDetail from "./PostDetail";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("popular");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activePostId, setActivePostId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const { userId: currentUserId } = useAuth();

  const fetchPosts = async (page, sort = "popular", category = null) => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (category && category !== "Tất cả") {
        data = await postService.getPostsByCategory(category, page, 5);
      } else {
        data = await postService.getPosts(page, 5, sort);
      }

      const postsData = data.posts || data.data || data;
      const mappedPosts = {
        ...postsData,
        data: postsData.data?.map((post) => {
          const likedArray = Array.isArray(post.liked) ? post.liked : [];
          return {
            ...post,
            likeCount: likedArray.length,
            isLiked: likedArray.includes(currentUserId),
          };
        }) || [],
      };

      setPosts(mappedPosts);
      setTotalPages(data.data.totalPage || 1);
      setCurrentPage(page);
    } catch (err) {
      setError("Không thể tải bài viết. Vui lòng thử lại sau.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await postService.getCategories();
      const allCategories = [
        { name: "Tất cả", count: data.reduce((sum, cat) => sum + (cat.count || 0), 0) },
        ...data,
      ];
      setCategories(allCategories);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([
        { name: "Tất cả", count: 13 },
        { name: "Công việc", count: 2 },
        { name: "Học tập", count: 4 },
        { name: "Hỏi đáp", count: 1 },
        { name: "Khác", count: 5 },
        { name: "Ngữ pháp", count: 0 },
        { name: "Từ vựng", count: 1 },
      ]);
    }
  };

  useEffect(() => {
    fetchPosts(1, "popular");
    fetchCategories();
  }, [currentUserId]);

  useEffect(() => {
    if (activePostId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activePostId]);

  useEffect(() => {
    const postIdFromUrl = searchParams.get("postId");
    if (postIdFromUrl) {
      setActivePostId(postIdFromUrl);
    }
  }, [searchParams]);

  const closeModal = () => {
    setActivePostId(null);
    setSearchParams((prev) => {
      prev.delete("postId");
      return prev;
    });
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSelectedCategory(null);
    setSearchQuery("");
    fetchPosts(1, value === "popular" ? "popular" : "recent");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSelectedCategory(null);
      fetchPosts(1, activeTab === "popular" ? "popular" : "recent");
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedCategory(null);
    try {
      const data = await postService.searchPosts(searchQuery, 1, 5);
      const postsData = data.posts || data.data || data;
      const mappedPosts = {
        ...postsData,
        data: postsData.data?.map((post) => {
          const likedArray = Array.isArray(post.liked) ? post.liked : [];
          return {
            ...post,
            likeCount: likedArray.length,
            isLiked: likedArray.includes(currentUserId),
          };
        }) || [],
      };
      setPosts(mappedPosts);
      setTotalPages(data.data.totalPage || 1);
      setCurrentPage(1);
    } catch (err) {
      setError("Không thể tìm kiếm. Vui lòng thử lại sau.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryName) => {
    setSearchQuery("");
    setSelectedCategory(categoryName);
    const sort = activeTab === "popular" ? "popular" : "recent";
    if (categoryName === "Tất cả") {
      fetchPosts(1, sort, null);
    } else {
      fetchPosts(1, sort, categoryName);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      const sort = activeTab === "popular" ? "popular" : "recent";
      fetchPosts(page, sort, selectedCategory);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRetry = () => {
    fetchPosts(null, activeTab === "popular" ? "popular" : "recent", selectedCategory);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Header />

      {activePostId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 sm:p-6 pt-0 backdrop-blur-[2px] overflow-y-auto" onClick={closeModal}>
          <div className="relative w-full max-w-[800px] max-h-[82vh] overflow-y-auto rounded-xl bg-white shadow-2xl mt-[80px] flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="sticky right-4 top-3 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface border border-solid border-surface-variant/50 ml-auto mr-3"
              onClick={closeModal}
            >
              <FontAwesomeIcon icon={faXmark} className="text-lg" />
            </button>
            <div className="-mt-6">
              <PostDetail postIdProp={activePostId} isModal={true} onClose={closeModal} />
            </div>
          </div>
        </div>
      )}

      <div className="flex pt-[64px]">
        <CommunityLeftSidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryClick={handleCategoryClick}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
              <main className="flex-1 w-full flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-outline-variant/30">
                  <CommunityHeader />
                  <div className="flex bg-surface-container rounded-lg p-1 flex-shrink-0">
                    <button
                      className={`font-semibold text-sm px-4 py-1.5 rounded-md transition-all ${activeTab === "popular" ? "bg-surface-container-lowest text-on-surface shadow-sm border border-outline-variant/20" : "text-on-surface-variant hover:text-on-surface"}`}
                      onClick={() => handleTabChange("popular")}
                    >
                      Phổ biến
                    </button>
                    <button
                      className={`font-semibold text-sm px-4 py-1.5 rounded-md transition-all ${activeTab === "recent" ? "bg-surface-container-lowest text-on-surface shadow-sm border border-outline-variant/20" : "text-on-surface-variant hover:text-on-surface"}`}
                      onClick={() => handleTabChange("recent")}
                    >
                      Mới nhất
                    </button>
                  </div>
                </div>

                <PostList
                  posts={posts}
                  loading={loading}
                  error={error}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  activeTab={activeTab}
                  selectedCategory={selectedCategory}
                  onPageChange={handlePageChange}
                  onRetry={handleRetry}
                  onCommentClick={(postId) => setActivePostId(postId)}
                />
              </main>

              <CommunitySidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Community;
