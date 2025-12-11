import React, { useState, useEffect } from "react";
import styles from "./PdfModal.module.scss";

export default function PdfModal({ show, onClose, pdfUrl, loading }) {
    const [iframeLoading, setIframeLoading] = useState(true);

    useEffect(() => {
        if (show && pdfUrl) {
            setIframeLoading(true);
        }
    }, [show, pdfUrl]);

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

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
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
                        src={pdfUrl}
                        className={styles.preview}
                        onLoad={handleLoad}
                        style={{ display: (loading || iframeLoading) ? "none" : "block" }}
                    />
                )}

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
        </div>
    );
}