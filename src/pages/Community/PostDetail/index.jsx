import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./PostDetail.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faCommentDots,
  faEye,
  faShareNodes,
  faArrowLeft,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

const mockPost = {
  id: 1,
  title: "Cách phân biệt は và が trong tiếng Nhật",
  content: `Xin chào các bạn!

Mình đang học N5 và thấy rất khó phân biệt khi nào dùng は và khi nào dùng が. Mình đã đọc nhiều tài liệu nhưng vẫn chưa hiểu rõ.

Ví dụ:
- 私は学生です。(Tôi là học sinh)
- 私が学生です。(Tôi là học sinh)

Hai câu này có gì khác nhau không? Khi nào thì dùng は và khi nào dùng が?

Mong các bạn giải thích giúp mình. Cảm ơn các bạn rất nhiều!`,
  author: {
    name: "Nguyễn Văn A",
    avatar: "/diverse-user-avatars.png",
    level: "N5",
    posts: 12,
    joined: "3 tháng trước",
  },
  category: "Ngữ pháp",
  views: 234,
  likes: 45,
  isLiked: false,
  comments: 12,
  createdAt: "2 giờ trước",
  tags: ["ngữ pháp", "N5", "は", "が"],
};

const mockComments = [
  {
    id: 1,
    author: {
      name: "Trần Thị B",
      avatar: "/diverse-user-avatar-set-2.png",
      level: "N3",
    },
    content: `Mình giải thích đơn giản nhé:

は dùng để giới thiệu chủ đề của câu (topic marker)
が dùng để nhấn mạnh chủ ngữ (subject marker)

Ví dụ:
- 私は学生です。→ Nói về bản thân (chủ đề là "tôi")
- 私が学生です。→ Nhấn mạnh "tôi" là học sinh (không phải người khác)

Hi vọng giúp ích cho bạn!`,
    likes: 23,
    createdAt: "1 giờ trước",
  },
  {
    id: 2,
    author: {
      name: "Lê Văn C",
      avatar: "/diverse-user-avatars-3.png",
      level: "N2",
    },
    content: `Thêm một ví dụ nữa cho bạn dễ hiểu:

Câu hỏi: 誰が学生ですか？(Ai là học sinh?)
Trả lời: 私が学生です。(Tôi là học sinh) → Dùng が vì nhấn mạnh

Câu hỏi: あなたは学生ですか？(Bạn có phải là học sinh không?)
Trả lời: はい、私は学生です。(Vâng, tôi là học sinh) → Dùng は vì nói về chủ đề`,
    likes: 18,
    createdAt: "30 phút trước",
  },
];

function PostDetail() {
  const [post, setPost] = useState(mockPost);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(mockComments);

  const handleLike = () => {
    setPost((prev) => ({
      ...prev,
      likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
      isLiked: !prev.isLiked,
    }));
  };

  const handleComment = () => {
    if (!comment.trim()) return;

    const newComment = {
      id: comments.length + 1,
      author: {
        name: "Bạn",
        avatar: "/current-user.jpg",
        level: "N5",
      },
      content: comment,
      likes: 0,
      createdAt: "Vừa xong",
    };

    setComments((prev) => [...prev, newComment]);
    setComment("");
    setPost((prev) => ({ ...prev, comments: prev.comments + 1 }));
  };

  const handleBack = () => {
    // Tùy cách bạn routing: có thể dùng navigate, hoặc window.history
    window.history.back();
  };

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Back Button */}
          <button
            type="button"
            onClick={handleBack}
            className={cx("back-link")}
          >
            <FontAwesomeIcon icon={faArrowLeft} className={cx("back-icon")} />
            <span>Quay lại cộng đồng</span>
          </button>

          {/* Post Card */}
          <Card className={cx("post-card")}>
            {/* Header */}
            <div className={cx("post-header")}>
              <img
                src={post.author.avatar || "/placeholder.svg"}
                alt={post.author.name}
                className={cx("avatar")}
              />
              <div className={cx("post-header-main")}>
                <div className={cx("post-author-row")}>
                  <span className={cx("author-name")}>{post.author.name}</span>
                  <span className={cx("badge", "badge-level")}>
                    {post.author.level}
                  </span>
                </div>
                <div className={cx("author-meta")}>
                  <span>{post.createdAt}</span>
                  <span className={cx("dot")}>•</span>
                  <span>{post.author.posts} bài viết</span>
                  <span className={cx("dot")}>•</span>
                  <span>Tham gia {post.author.joined}</span>
                </div>
              </div>
              <span className={cx("badge", "badge-category")}>
                {post.category}
              </span>
            </div>

            {/* Title */}
            <h1 className={cx("title")}>{post.title}</h1>

            {/* Tags */}
            <div className={cx("tags")}>
              {post.tags.map((tag) => (
                <span key={tag} className={cx("badge", "badge-tag")}>
                  #{tag}
                </span>
              ))}
            </div>

            {/* Content */}
            <div className={cx("content")}>
              <p className={cx("content-text")}>
                {post.content.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < post.content.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>

            {/* Stats */}
            <div className={cx("stats")}>
              <div className={cx("stat-item")}>
                <FontAwesomeIcon icon={faEye} className={cx("stat-icon")} />
                <span>{post.views} lượt xem</span>
              </div>
              <div className={cx("stat-item")}>
                <FontAwesomeIcon icon={faHeart} className={cx("stat-icon")} />
                <span>{post.likes} lượt thích</span>
              </div>
              <div className={cx("stat-item")}>
                <FontAwesomeIcon
                  icon={faCommentDots}
                  className={cx("stat-icon")}
                />
                <span>{post.comments} bình luận</span>
              </div>
            </div>

            {/* Actions */}
            <div className={cx("actions")}>
              <Button
                className={"orange"}
                primary={post.isLiked}
                outline={!post.isLiked}
                onClick={handleLike}
                leftIcon={
                  <FontAwesomeIcon
                    icon={faHeart}
                    className={cx("like-icon", { filled: post.isLiked })}
                  />
                }
              >
                {post.isLiked ? "Đã thích" : "Thích"}
              </Button>

              <Button
                outline
                className={"orange"}
                leftIcon={
                  <FontAwesomeIcon icon={faShareNodes} className={cx("icon")} />
                }
              >
                Chia sẻ
              </Button>
            </div>
          </Card>

          {/* Comments */}
          <Card className={cx("comments-card")}>
            <h2 className={cx("comments-title")}>
              Bình luận ({comments.length})
            </h2>

            {/* Comment input */}
            <div className={cx("comment-form")}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Viết bình luận của bạn..."
                className={cx("comment-input")}
              />
              <Button
                primary
                disabled={!comment.trim()}
                leftIcon={<FontAwesomeIcon icon={faPaperPlane} />}
                onClick={handleComment}
              >
                Gửi bình luận
              </Button>
            </div>

            {/* Comment list */}
            <div className={cx("comment-list")}>
              {comments.map((c) => (
                <div key={c.id} className={cx("comment-item")}>
                  <img
                    src={c.author.avatar || "/placeholder.svg"}
                    alt={c.author.name}
                    className={cx("comment-avatar")}
                  />
                  <div className={cx("comment-body")}>
                    <div className={cx("comment-bubble")}>
                      <div className={cx("comment-header")}>
                        <span className={cx("comment-author")}>
                          {c.author.name}
                        </span>
                        <span
                          className={cx("badge", "badge-level", "badge-sm")}
                        >
                          {c.author.level}
                        </span>
                        <span className={cx("comment-time")}>
                          • {c.createdAt}
                        </span>
                      </div>
                      <p className={cx("comment-text")}>
                        {c.content.split("\n").map((line, i) => (
                          <span key={i}>
                            {line}
                            {i < c.content.split("\n").length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    </div>

                    <div className={cx("comment-actions")}>
                      <button type="button" className={cx("comment-like-btn")}>
                        <FontAwesomeIcon
                          icon={faHeart}
                          className={cx("comment-like-icon")}
                        />
                        <span>{c.likes}</span>
                      </button>
                      <button type="button" className={cx("comment-reply-btn")}>
                        Trả lời
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default PostDetail;
