"use client";

import React from "react";
import classNames from "classnames/bind";
import styles from "./AuthRequiredModal.module.scss";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

function AuthRequiredModal({ isOpen, onClose, onConfirm, message = "Bạn cần đăng nhập để sử dụng chức năng này." }) {
    if (!isOpen) return null;

    return (
        <div className={cx("overlay")} onClick={onClose}>
            <div className={cx("modal")} onClick={(e) => e.stopPropagation()}>
                <div className={cx("header")}>
                    <FontAwesomeIcon icon={faTriangleExclamation} className={cx("icon")} />
                    <h3>Yêu cầu đăng nhập</h3>
                </div>

                <p className={cx("message")}>{message}</p>

                <div className={cx("actions")}>
                    <Button outline className={"no-margin"} onClick={onClose}>
                        Hủy
                    </Button>
                    <Button primary className={"no-margin"} onClick={onConfirm}>
                        Đăng nhập
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default AuthRequiredModal;
