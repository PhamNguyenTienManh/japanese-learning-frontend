import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle, faGem, faCheck,
  faArrowRight, faHouse,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "~/context/ToastContext";
import styles from "./Success.module.scss";

const PROVIDER_LABELS = {
  card: "Thẻ tín dụng / ghi nợ",
  momo: "Ví MoMo",
  zalopay: "ZaloPay",
  vnpay: "VNPay",
};

const UNLOCKED = [
  "AI Chat không giới hạn",
  "Đề thi JLPT N5 – N1 đầy đủ",
  "Phân tích chi tiết tiến độ học",
  "Luyện hội thoại không giới hạn",
  "Ưu tiên hỗ trợ 24/7",
];

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const provider = searchParams.get("provider") || "";
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    localStorage.setItem("isPremium", "true");
    window.dispatchEvent(new StorageEvent("storage", { key: "isPremium", newValue: "true" }));
    addToast("Chào mừng bạn đến với Pro!", "success");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className={styles.wrap}>
      <div className={styles.card}>
        {/* Icon */}
        <div className={styles.iconWrap}>
          <FontAwesomeIcon icon={faCheckCircle} className={styles.icon} />
        </div>

        <h2 className={styles.title}>Thanh toán thành công!</h2>
        <p className={styles.subtitle}>
          Chào mừng bạn đến với gói <strong>Pro</strong>.
          Tất cả tính năng cao cấp đã được kích hoạt ngay bây giờ.
        </p>

        {/* Transaction details */}
        <div className={styles.detailBox}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Gói đăng ký</span>
            <span className={styles.detailValue}>Pro · Hằng tháng</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Phương thức</span>
            <span className={styles.detailValue}>
              {PROVIDER_LABELS[provider] || "Không xác định"}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Số tiền</span>
            <span className={styles.detailValue}>$9.99</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Trạng thái</span>
            <span className={`${styles.detailValue} ${styles.statusOk}`}>
              <FontAwesomeIcon icon={faCheckCircle} /> Thành công
            </span>
          </div>
        </div>

        {/* Unlocked features */}
        <div className={styles.unlockedBox}>
          <p className={styles.unlockedTitle}>
            <FontAwesomeIcon icon={faGem} /> Tính năng đã mở khoá
          </p>
          <ul className={styles.unlockedList}>
            {UNLOCKED.map((f, i) => (
              <li key={i}>
                <span className={styles.checkDot}>
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button outline onClick={() => navigate("/")}>
            <FontAwesomeIcon icon={faHouse} /> &nbsp;Về trang chủ
          </Button>
          <Button primary onClick={() => navigate("/practice")}>
            Luyện tập ngay &nbsp;<FontAwesomeIcon icon={faArrowRight} />
          </Button>
        </div>
      </div>
    </section>
  );
}
