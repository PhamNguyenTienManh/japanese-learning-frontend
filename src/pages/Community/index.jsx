import { useState, useEffect } from "react";
import Tabs, { TabsList, TabsTrigger, TabsContent } from "~/components/Tabs";

import postService from "~/services/postService";
import CommunityHeader from "~/components/CommunityHeader";
import CommunitySearch from "~/components/CommunitySearch";
import CommunitySidebar from "~/components/CommunitySidebar/CommunitySidebar";
import PostList from "~/components/PostList/PostList";
import { useAuth } from "~/context/AuthContext";

function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);

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
        { name: "Tất cả", count: 234 },
        { name: "Ngữ pháp", count: 89 },
        { name: "Từ vựng", count: 67 },
        { name: "Kanji", count: 45 },
        { name: "Tài liệu", count: 23 },
        { name: "Kinh nghiệm", count: 10 },
      ]);
    }
  };

  useEffect(() => {
    fetchPosts(1, "popular");
    fetchCategories();
  }, [currentUserId]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSelectedCategory(null);
    setSearchQuery("");
    fetchPosts(1, value === "all" ? "popular" : "recent");
  };

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
    const sort = activeTab === "all" ? "popular" : "recent";
    if (categoryName === "Tất cả") {
      fetchPosts(1, sort, null);
    } else {
      fetchPosts(1, sort, categoryName);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      const sort = activeTab === "all" ? "popular" : "recent";
      fetchPosts(page, sort, selectedCategory);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRetry = () => {
    fetchPosts(null, activeTab === "all" ? "popular" : "recent", selectedCategory);
  };

  return (
    <div className="relative min-h-screen bg-[radial-gradient(1200px_480px_at_0%_-10%,rgba(0,135,154,0.10),transparent_60%),radial-gradient(900px_360px_at_100%_0%,rgba(252,95,0,0.06),transparent_60%),var(--background)] px-4 pb-20 pt-8">
      <main className="flex justify-center">
        <div className="w-full max-w-[1200px]">
          <CommunityHeader />

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-w-0 flex-col gap-4">
              <CommunitySearch
                searchQuery={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
              />

              <Tabs active={activeTab} onChange={handleTabChange}>
                <TabsList>
                  <TabsTrigger value="all">Phổ biến</TabsTrigger>
                  <TabsTrigger value="recent">Mới nhất</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <div className="flex flex-col gap-3.5">
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
                    />
                  </div>
                </TabsContent>

                <TabsContent value="recent">
                  <div className="flex flex-col gap-3.5">
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
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <CommunitySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryClick={handleCategoryClick}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Community;
