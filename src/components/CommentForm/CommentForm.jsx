import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faSpinner } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./CommentForm.module.scss";
import Button from "~/components/Button";

const cx = classNames.bind(styles);

function CommentForm({ comment, submitting, isLoggedIn, onChange, onSubmit }) {
  return (
    <div className={cx("comment-form")}>
      <textarea
        value={comment}
        onChange={onChange}
        placeholder="Viết bình luận của bạn..."
        className={cx("comment-input")}
      />
      {isLoggedIn ? (
        <Button
          primary
          disabled={!comment.trim() || submitting}
          leftIcon={
            submitting ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} />
            )
          }
          onClick={onSubmit}
        >
          {submitting ? "Đang gửi..." : "Gửi bình luận"}
        </Button>
      ) : (
        <Button primary disabled>
          Đăng nhập để gửi bình luận
        </Button>
      )}
    </div>
  );
}

export default CommentForm;
