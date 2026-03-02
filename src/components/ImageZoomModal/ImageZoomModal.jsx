import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import styles from "./ImageZoomModal.module.scss";

const cx = classNames.bind(styles);

function ImageZoomModal({ imageUrl, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className={cx("image-zoom-modal")} onClick={onClose}>
      <button className={cx("zoom-close-btn")} onClick={onClose}>
        <FontAwesomeIcon icon={faTimes} />
      </button>
      <img
        src={imageUrl}
        alt="Zoomed"
        className={cx("zoomed-image")}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default ImageZoomModal;
