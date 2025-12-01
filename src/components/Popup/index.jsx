import styles from "./PopupModal.module.scss";

function PopupModal(props) {
    const { visible, onConfirm, onCancel, title, message, confirmText } = props;

    if (!visible) return null;

    return (
        <div className={styles.modal} style={{ display: "flex" }}>
            <div className={styles.modalContent}>
                <h2>{title || "Xác nhận"}</h2>
                <p>{message || "Bạn có chắc chắn muốn nộp bài?"}</p>

                <div className={styles.modalActions}>
                    <button className={styles.btnCancel} onClick={onCancel}>
                        Hủy
                    </button>

                    <button className={styles.btnConfirm} onClick={onConfirm}>
                        {confirmText || "Xác nhận"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PopupModal;
