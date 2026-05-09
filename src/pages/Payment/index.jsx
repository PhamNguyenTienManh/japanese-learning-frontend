import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Button from "~/components/Button";
import Card from "~/components/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCreditCard } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import styles from "./Payment.module.scss";

function Payment() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "Pro";
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // nothing for now
  }, []);

  const handlePay = () => {
    // Go to checkout to select payment method
    navigate(`/payment/checkout?plan=${encodeURIComponent(plan)}`);
  };

  return (
    <section className={styles.paymentWrap}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.icon}>
            <FontAwesomeIcon icon={faCreditCard} />
          </div>
          <div>
            <h2 className={styles.title}>Thanh toán</h2>
            <div className={styles.subtitle}>Mua gói <strong>{plan}</strong> để mở khoá tính năng nâng cao</div>
          </div>
        </div>

        <div className={styles.summary}>
          <div className={styles.planName}>{plan}</div>
          <div className={`${styles.price} ${styles.planPriceBig}`}>{plan === "Miễn phí" ? "$0/tháng" : "$9.99/tháng"}</div>
          <div className={styles.planDesc}>{plan === "Miễn phí" ? "Không mất phí" : "Thanh toán định kỳ hằng tháng"}</div>
        </div>

        <div className={styles.actions}>
          <Button onClick={() => navigate(-1)} outline>
            Quay lại
          </Button>
          <Button onClick={handlePay} primary disabled={loading}>
            {loading ? "Đang xử lý..." : plan === "Miễn phí" ? "Bắt đầu" : "Thanh toán"}
          </Button>
        </div>

        <p className={styles.note}>Lưu ý: Đây là demo thanh toán. Để tích hợp cổng thanh toán thực, cần backend và webhook xác thực.</p>
      </Card>
    </section>
  );
}

export default Payment;
