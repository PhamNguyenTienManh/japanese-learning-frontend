import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTrash, faFlag } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./AdminPostCard.module.scss";
import Card from "~/components/Card";
import Button from "~/components/Button";

const cx = classNames.bind(styles);

function AdminPostCard({ post, commentCount, onDelete }) {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return (
    <Card className={cx("postCard", { postCardReported: post.hasReports })}>
      <div className={cx("postInner")}>
        <div className={cx("postContent")}>
          <div className={cx("titleRow")}>
            <h3 className={cx("postTitle")}>{post.title}</h3>
            {post.hasReports && (
              <span className={cx("badge", "badgeReported")}>
                <FontAwesomeIcon icon={faFlag} className={cx("badgeIcon")} />
                <span>Bị báo cáo</span>
              </span>
            )}
            <span className={cx("badge")}>{post.category_id?.name || "Khác"}</span>
          </div>
          <p className={cx("meta")}>
            Bởi {post.profile_id?.name || "Ẩn danh"} •{" "}
            {formatDate(post.updated_at || post.createdDate)}
          </p>
          <div className={cx("statsRow")}>
            <span>{commentCount || 0} bình luận</span>
            <span>{post.liked?.length || 0} thích</span>
          </div>
        </div>

        <div className={cx("actions")}>
          <Link to={`/community/${post._id}`}>
            <Button outline rounded leftIcon={<FontAwesomeIcon icon={faEye} />} />
          </Link>
          <Button
            outline
            rounded
            className={cx("dangerBtn")}
            leftIcon={<FontAwesomeIcon icon={faTrash} />}
            onClick={() => onDelete(post._id, post.title, post.profile_id?.userId)}
          />
        </div>
      </div>
    </Card>
  );
}

export default AdminPostCard;
