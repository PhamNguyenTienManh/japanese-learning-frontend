import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faSpinner, faLock } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./CommentForm.module.scss";

const cx = classNames.bind(styles);

function CommentForm({ comment, submitting, isLoggedIn, onChange, onSubmit }) {
  if (!isLoggedIn) {
    return (
      <div className={cx("login-prompt")}>
        <FontAwesomeIcon icon={faLock} className={cx("login-icon")} />
        <span>Đăng nhập để tham gia bình luận cùng cộng đồng</span>
      </div>
    );
  }

  const disabled = !comment.trim() || submitting;

  return (
    <div className={cx("comment-form")}>
      <textarea
        value={comment}
        onChange={onChange}
        placeholder="Chia sẻ suy nghĩ của bạn..."
        className={cx("comment-input")}
        rows={3}
      />
      <div className={cx("form-footer")}>
        <span className={cx("hint")}>
          Hãy giữ cuộc trò chuyện văn minh và thân thiện 🌸
        </span>
        <button
          type="button"
          className={cx("submit-btn", { disabled })}
          onClick={onSubmit}
          disabled={disabled}
        >
          {submitting ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin />
              <span>Đang gửi...</span>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faPaperPlane} />
              <span>Gửi bình luận</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default CommentForm;
