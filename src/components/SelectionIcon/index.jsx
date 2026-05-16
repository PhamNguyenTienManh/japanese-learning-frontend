import classNames from "classnames/bind";
import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import styles from "./SelectionIcon.module.scss";

const cx = classNames.bind(styles);

export default function SelectionIcon({ selection, onClick }) {
    if (!selection) return null;

    const minLeft = window.scrollX + 12;
    const maxLeft = window.scrollX + window.innerWidth - 52;
    const style = {
        top: Math.max(selection.rect.top - 46, window.scrollY + 12),
        left: Math.min(Math.max(selection.rect.right + 8, minLeft), maxLeft),
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(selection.text);
    };

    return (
        <button
            type="button"
            className={cx("trigger")}
            style={style}
            onMouseDown={handleMouseDown}
            title="Dịch nhanh"
            aria-label="Dịch nhanh đoạn đã chọn"
        >
            <FontAwesomeIcon icon={faLanguage} />
            <span className={cx("label")}>Dịch nhanh</span>
        </button>
    );
}
