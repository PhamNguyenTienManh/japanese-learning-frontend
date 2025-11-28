import React from "react";
import classNames from "classnames/bind";
import styles from "./actionBtnInCommunity.module.scss"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

function ActionBtn({ onEdit, onDelete }) {
  return (
    <div className={cx("owner-actions")}>
      <button
        type="button"
        onClick={onEdit}
        className={cx("action-btn", "edit-btn")}
        title="Chỉnh sửa"
      >
        <FontAwesomeIcon icon={faEdit} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={cx("action-btn", "delete-btn")}
        title="Xóa"
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </div>
  );
}

export default ActionBtn;
