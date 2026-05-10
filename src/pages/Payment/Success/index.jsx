import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle, faGem, faCheck,
  faArrowRight, faHouse, faCircleXmark,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useToast } from "~/context/ToastContext";
import styles from "./Success.module.scss";

const PROVIDER_LABELS = {
  card: "Thẻ tín dụng / ghi nợ",
  momo: "Ví MoMo",
  vnpay: "VNPay",
};

const CYCLE_LABELS = {
  monthly: "Hằng tháng",
  yearly: "Hằng năm",
};

const UNLOCKED = [
  "AI Chat không giới hạn",
  "Đề thi JLPT N5 – N1 đầy đủ",
  "Phân tích chi tiết tiến độ học",
  "Luyện hội thoại không giới hạn",
  "Ưu tiên hỗ trợ 24/7",
];

const formatVND = (n) =>
  Number.isFinite(Number(n))
    ? `${new Intl.NumberFormat("vi-VN").format(Number(n))} ₫`
    : "—";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const provider = searchParams.get("provider") || "";
  const status = searchParams.get("status") || "success";
  const orderId = searchParams.get("orderId") || "";
  const code = searchParams.get("code") || "";
  const amount = searchParams.get("amount");
  const cycle = searchParams.get("cycle") || "monthly";
  const isSuccess = status === "success";

  const navigate = useNavigate();
  const { addToast } = useToast();
  const toastedRef = useRef(false);

  useEffect(() => {
    if (toastedRef.current) return;
    toastedRef.current = true;
    if (isSuccess) {
      localStorage.setItem("isPremium", "true");
      window.dispatchEvent(new StorageEvent("storage", { key: "isPremium", newValue: "true" }));
      addToast("Chào mừng bạn đến với Pro!", "success");
    } else {
      addToast("Thanh toán không thành công. Vui lòng thử lại.", "error");
    }
  }, [isSuccess, addToast]);

  return (
    <section className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <FontAwesomeIcon
            icon={isSuccess ? faCheckCircle : faCircleXmark}
            className={`${styles.icon} ${isSuccess ? "" : styles.iconFail}`}
          />
        </div>

        <h2 className={styles.title}>
          {isSuccess ? "Thanh toán thành công!" : "Thanh toán không thành công"}
        </h2>
        <p className={styles.subtitle}>
          {isSuccess ? (
            <>
              Chào mừng bạn đến với gói <strong>Pro</strong>.
              Tất cả tính năng cao cấp đã được kích hoạt ngay bây giờ.
            </>
          ) : (
            <>
              Giao dịch chưa được hoàn tất
              {code ? <> (mã lỗi <strong>{code}</strong>)</> : null}.
              Bạn có thể thử lại với phương thức khác.
            </>
          )}
        </p>

        <div className={styles.detailBox}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Gói đăng ký</span>
            <span className={styles.detailValue}>
              Pro · {CYCLE_LABELS[cycle] || "Hằng tháng"}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Phương thức</span>
            <span className={styles.detailValue}>
              {PROVIDER_LABELS[provider] || "Không xác định"}
            </span>
          </div>
          {orderId && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Mã giao dịch</span>
              <span className={styles.detailValue}>{orderId}</span>
            </div>
          )}
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Số tiền</span>
            <span className={styles.detailValue}>{formatVND(amount)}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Trạng thái</span>
            <span
              className={`${styles.detailValue} ${isSuccess ? styles.statusOk : styles.statusFail}`}
            >
              <FontAwesomeIcon icon={isSuccess ? faCheckCircle : faCircleXmark} />
              {isSuccess ? "Thành công" : "Thất bại"}
            </span>
          </div>
        </div>

        {isSuccess && (
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
        )}

        <div className={styles.actions}>
          {isSuccess ? (
            <>
              <Button outline onClick={() => navigate("/")}>
                <FontAwesomeIcon icon={faHouse} /> &nbsp;Về trang chủ
              </Button>
              <Button primary onClick={() => navigate("/practice")}>
                Luyện tập ngay &nbsp;<FontAwesomeIcon icon={faArrowRight} />
              </Button>
            </>
          ) : (
            <>
              <Button outline onClick={() => navigate("/")}>
                <FontAwesomeIcon icon={faHouse} /> &nbsp;Về trang chủ
              </Button>
              <Button primary onClick={() => navigate("/payment?plan=Pro")}>
                <FontAwesomeIcon icon={faRotateLeft} /> &nbsp;Thử lại
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
