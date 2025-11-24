import classNames from "classnames/bind";
import styles from "./Community.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";
import Tabs, { TabsList, TabsTrigger, TabsContent } from "~/components/Tabs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faHeart,
  faEye,
  faArrowTrendUp,
  faClock,
  faSearch,
  faPenToSquare,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

const mockPosts = [
  {
    id: 1,
    title: "Cách phân biệt は và が trong tiếng Nhật",
    excerpt:
      "Mình đang học N5 và thấy rất khó phân biệt khi nào dùng は và khi nào dùng が. Các bạn có thể giải thích giúp mình không?",
    author: {
      name: "Nguyễn Văn A",
      avatar: "/diverse-user-avatars.png",
      level: "N5",
    },
    category: "Ngữ pháp",
    views: 234,
    likes: 45,
    comments: 12,
    createdAt: "2 giờ trước",
    tags: ["ngữ pháp", "N5", "は", "が"],
  },
  {
    id: 2,
    title: "Chia sẻ tài liệu luyện thi JLPT N3",
    excerpt:
      "Mình vừa thi đỗ N3 và muốn chia sẻ một số tài liệu hay mà mình đã sử dụng. Hi vọng sẽ giúp ích cho các bạn đang chuẩn bị thi.",
    author: {
      name: "Trần Thị B",
      avatar: "/diverse-user-avatar-set-2.png",
      level: "N3",
    },
    category: "Tài liệu",
    views: 567,
    likes: 89,
    comments: 23,
    createdAt: "5 giờ trước",
    tags: ["JLPT", "N3", "tài liệu"],
  },
  {
    id: 3,
    title: "Kinh nghiệm học Kanji hiệu quả",
    excerpt:
      "Sau 6 tháng học, mình đã nhớ được 500 chữ Kanji. Đây là phương pháp học của mình, các bạn tham khảo nhé!",
    author: {
      name: "Lê Văn C",
      avatar: "/diverse-user-avatars-3.png",
      level: "N4",
    },
    category: "Kinh nghiệm",
    views: 892,
    likes: 156,
    comments: 34,
    createdAt: "1 ngày trước",
    tags: ["kanji", "học tập", "kinh nghiệm"],
  },
];

const categories = [
  { name: "Tất cả", count: 234 },
  { name: "Ngữ pháp", count: 89 },
  { name: "Từ vựng", count: 67 },
  { name: "Kanji", count: 45 },
  { name: "Tài liệu", count: 23 },
  { name: "Kinh nghiệm", count: 10 },
];

const trendingTags = [
  "ngữ pháp",
  "JLPT",
  "N5",
  "kanji",
  "từ vựng",
  "N3",
  "học tập",
];

function Community() {
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
                  <p className={cx("stat-value")}>234</p>
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
                  <p className={cx("stat-value")}>1.2K</p>
                  <p className={cx("stat-label")}>Thành viên</p>
                </div>
              </div>
            </Card>

            <Card className={cx("stat-card")}>
              <div className={cx("stat-inner")}>
                <div className={cx("stat-icon-wrap")}>
                  <FontAwesomeIcon icon={faHeart} className={cx("stat-icon")} />
                </div>
                <div>
                  <p className={cx("stat-value")}>3.4K</p>
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
                  <p className={cx("stat-value")}>12K</p>
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
                      className={"community-search-input"}
                    />
                  </div>
                  <Button outline className={"orange"}>
                    Tìm kiếm
                  </Button>
                </div>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="all">
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
                  {mockPosts.map((post) => (
                    <Card key={post.id} className={cx("post-card")}>
                      <a href={`/community/${post.id}`}>
                        <div className={cx("post-inner")}>
                          {/* Header */}
                          <div className={cx("post-header")}>
                            <img
                              src={post.author.avatar || "/placeholder.svg"}
                              alt={post.author.name}
                              className={cx("avatar")}
                            />
                            <div className={cx("post-header-info")}>
                              <div className={cx("post-author-row")}>
                                <span className={cx("post-author")}>
                                  {post.author.name}
                                </span>
                                <span className={cx("post-level-badge")}>
                                  {post.author.level}
                                </span>
                                <span className={cx("post-time")}>
                                  • {post.createdAt}
                                </span>
                              </div>
                              <span className={cx("post-category")}>
                                {post.category}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className={cx("post-content")}>
                            <h3 className={cx("post-title")}>{post.title}</h3>
                            <p className={cx("post-excerpt")}>{post.excerpt}</p>
                          </div>

                          {/* Tags */}
                          <div className={cx("post-tags")}>
                            {post.tags.map((tag) => (
                              <span key={tag} className={cx("tag")}>
                                #{tag}
                              </span>
                            ))}
                          </div>

                          {/* Stats */}
                          <div className={cx("post-stats")}>
                            <div className={cx("post-stat-item")}>
                              <FontAwesomeIcon
                                icon={faEye}
                                className={cx("post-stat-icon")}
                              />
                              <span>{post.views}</span>
                            </div>
                            <div className={cx("post-stat-item")}>
                              <FontAwesomeIcon
                                icon={faHeart}
                                className={cx("post-stat-icon")}
                              />
                              <span>{post.likes}</span>
                            </div>
                            <div className={cx("post-stat-item")}>
                              <FontAwesomeIcon
                                icon={faMessage}
                                className={cx("post-stat-icon")}
                              />
                              <span>{post.comments}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="recent" className={cx("tabs-content")}>
                  {mockPosts.map((post) => (
                    <Card key={post.id} className={cx("post-card")}>
                      <a href={`/community/${post.id}`}>
                        <div className={cx("post-inner")}>
                          <div className={cx("post-header")}>
                            <img
                              src={post.author.avatar || "/placeholder.svg"}
                              alt={post.author.name}
                              className={cx("avatar")}
                            />
                            <div className={cx("post-header-info")}>
                              <div className={cx("post-author-row")}>
                                <span className={cx("post-author")}>
                                  {post.author.name}
                                </span>
                                <span className={cx("post-level-badge")}>
                                  {post.author.level}
                                </span>
                                <span className={cx("post-time")}>
                                  • {post.createdAt}
                                </span>
                              </div>
                              <span className={cx("post-category")}>
                                {post.category}
                              </span>
                            </div>
                          </div>
                          <div className={cx("post-content")}>
                            <h3 className={cx("post-title")}>{post.title}</h3>
                            <p className={cx("post-excerpt")}>{post.excerpt}</p>
                          </div>
                          <div className={cx("post-tags")}>
                            {post.tags.map((tag) => (
                              <span key={tag} className={cx("tag")}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <div className={cx("post-stats")}>
                            <div className={cx("post-stat-item")}>
                              <FontAwesomeIcon
                                icon={faEye}
                                className={cx("post-stat-icon")}
                              />
                              <span>{post.views}</span>
                            </div>
                            <div className={cx("post-stat-item")}>
                              <FontAwesomeIcon
                                icon={faHeart}
                                className={cx("post-stat-icon")}
                              />
                              <span>{post.likes}</span>
                            </div>
                            <div className={cx("post-stat-item")}>
                              <FontAwesomeIcon
                                icon={faMessage}
                                className={cx("post-stat-icon")}
                              />
                              <span>{post.comments}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    </Card>
                  ))}
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
                      className={cx("category-item")}
                    >
                      <span className={cx("category-name")}>
                        {category.name}
                      </span>
                      <span className={cx("category-count")}>
                        {category.count}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Tags */}
              <Card className={cx("side-card")}>
                <h3 className={cx("side-title")}>Thẻ phổ biến</h3>
                <div className={cx("tags-list")}>
                  {trendingTags.map((tag) => (
                    <button key={tag} type="button" className={cx("tag-chip")}>
                      #{tag}
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
