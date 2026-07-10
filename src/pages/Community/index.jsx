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

const DEFAULT_SORT = "popular";

function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activePostId, setActivePostId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const { userId: currentUserId } = useAuth();

  const mapPostsResponse = (data) => {
    const postsData = data.posts || data.data || data;
    return {
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
  };

  const getTotalPage = (data, mappedPosts) =>
    mappedPosts.totalPage || data?.data?.totalPage || data?.totalPage || 1;

  const fetchPosts = async (page, category = null) => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (category && category !== "Tất cả") {
        data = await postService.getPostsByCategory(category, page, 5);
      } else {
        data = await postService.getPosts(page, 5, DEFAULT_SORT);
      }

      const mappedPosts = mapPostsResponse(data);
      setPosts(mappedPosts);
      setTotalPages(getTotalPage(data, mappedPosts));
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
    fetchPosts(1);
    fetchCategories();
  }, [currentUserId]);

  useEffect(() => {
    const query = searchQuery.trim();
    const timer = setTimeout(() => {
      if (query) {
        fetchSearchPosts(query, 1);
      } else {
        fetchPosts(1, selectedCategory);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const fetchSearchPosts = async (query, page = 1) => {
    setLoading(true);
    setError(null);
    setSelectedCategory(null);
    try {
      const data = await postService.searchPosts(query, page, 5);
      const mappedPosts = mapPostsResponse(data);
      setPosts(mappedPosts);
      setTotalPages(getTotalPage(data, mappedPosts));
      setCurrentPage(page);
    } catch (err) {
      setError("Không thể tìm kiếm. Vui lòng thử lại sau.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    const query = searchQuery.trim();
    if (query) {
      fetchSearchPosts(query, 1);
    } else {
      fetchPosts(1, selectedCategory);
    }
  };

  const handleCategoryClick = (categoryName) => {
    setSearchQuery("");
    setSelectedCategory(categoryName);
    if (categoryName === "Tất cả") {
      fetchPosts(1, null);
    } else {
      fetchPosts(1, categoryName);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      const query = searchQuery.trim();
      if (query) {
        fetchSearchPosts(query, page);
      } else {
        fetchPosts(page, selectedCategory);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRetry = () => {
    const query = searchQuery.trim();
    if (query) {
      fetchSearchPosts(query, currentPage);
    } else {
      fetchPosts(currentPage, selectedCategory);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Header />

      {activePostId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 sm:p-6 pt-0 backdrop-blur-[2px] overflow-y-auto" onClick={closeModal}>
          <div className="relative w-full max-w-[800px] max-h-[82vh] overflow-y-auto rounded-[20px] bg-transparent mt-[80px] flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="absolute right-3 top-3 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-outline-variant/60 bg-white/95 p-0 text-on-surface-variant shadow-[0_2px_8px_rgba(15,23,42,0.12)] transition-colors hover:border-primary/30 hover:bg-surface-container-low hover:text-on-surface"
              onClick={closeModal}
              aria-label="Đóng"
            >
              <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
            </button>
            <div>
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
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
              <main className="flex-1 w-full flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-outline-variant/30">
                  <CommunityHeader />
                </div>

                <PostList
                  posts={posts}
                  loading={loading}
                  error={error}
                  currentPage={currentPage}
                  totalPages={totalPages}
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
