import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./PdfModal.module.scss";

export default function PdfModal({ show, onClose, pdfUrl, loading, title = "Xem trước PDF" }) {
    const [iframeLoading, setIframeLoading] = useState(true);

    useEffect(() => {
        if (show && pdfUrl) {
            setIframeLoading(true);
        }
    }, [show, pdfUrl]);

    useEffect(() => {
        if (!show) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [show]);

    const handleLoad = () => {
        setIframeLoading(false);
    };

    const handleDownload = () => {
        const a = document.createElement("a");
        a.href = pdfUrl;
        a.download = "jlpt.pdf";
        a.click();
    };

    if (!show) return null;

    return createPortal(
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{title}</h2>
                    <button
                        type="button"
                        className={styles.iconCloseBtn}
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className={styles.previewPane}>
                {/* Hiển thị loading khi đang fetch hoặc đang load iframe */}
                {(loading || iframeLoading) && (
                    <div className={styles.loaderWrapper}>
                        <div className={styles.loader}></div>
                        <p>{loading ? "Đang tải PDF..." : "Đang hiển thị PDF..."}</p>
                    </div>
                )}

                {/* PDF iframe - chỉ render khi đã có URL */}
                {pdfUrl && (
                    <iframe
                        title="Xem trước PDF JLPT"
                        src={pdfUrl}
                        className={styles.preview}
                        onLoad={handleLoad}
                        style={{ display: (loading || iframeLoading) ? "none" : "block" }}
                    />
                )}
                </div>

                <div className={styles.actions}>
                    <button className={styles.closeBtn} onClick={onClose}>
                        Đóng
                    </button>
                    <button
                        className={styles.downloadBtn}
                        onClick={handleDownload}
                        disabled={loading || !pdfUrl}
                    >
                        Tải xuống
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
