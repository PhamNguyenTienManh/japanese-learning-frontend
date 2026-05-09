import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Card from "~/components/Card";
import Button from "~/components/Button";
import styles from "./Checkout.module.scss";
import { useToast } from "~/context/ToastContext";

const methods = [
  { id: "card", label: "Thẻ tín dụng / ghi nợ", desc: "Visa · Mastercard · JCB" },
  { id: "momo", label: "Ví MoMo", desc: "Quét QR thanh toán" },
  { id: "zalopay", label: "ZaloPay", desc: "Liên kết tài khoản" },
  { id: "vnpay", label: "Ngân hàng (VNPay)", desc: "Thanh toán VNPay" },
];

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "Pro";
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [method, setMethod] = useState(methods[0].id);
  const [loading, setLoading] = useState(false);

  const handleProceed = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (method === "vnpay") {
        // Simulate redirect to VNPay
        addToast("Chuyển tới VNPay...", "info");
        window.location.href = "/payment/success?provider=vnpay"; // simulate
        return;
      }

      // Simulate success for other methods
      localStorage.setItem("isPremium", "true");
      window.dispatchEvent(new StorageEvent("storage", { key: "isPremium", newValue: "true" }));
      addToast("Thanh toán thành công", "success");
      navigate("/");
    }, 1200);
  };

  return (
    <div className={styles.checkoutWrap}>
      <div className={styles.left}>
        <h2>Chọn phương thức thanh toán</h2>
        <div className={styles.methods}>
          {methods.map((m) => (
            <label key={m.id} className={styles.methodItem}>
              <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
              <div>
                <div className={styles.methodLabel}>{m.label}</div>
                <div className={styles.methodDesc}>{m.desc}</div>
              </div>
            </label>
          ))}
        </div>

        {method === "card" && (
          <Card className={styles.cardForm}>
            <p className={styles.formNote}>Nhập thông tin thẻ để mô phỏng thanh toán.</p>
            <div className={styles.formRow}>
              <input placeholder="Số thẻ" />
            </div>
            <div className={styles.formRowInline}>
              <input placeholder="MM/YY" />
              <input placeholder="CVV" />
            </div>
          </Card>
        )}

        <div className={styles.actions}>
          <Button outline onClick={() => navigate(-1)}>Quay lại</Button>
          <Button primary onClick={handleProceed} disabled={loading}>{loading ? 'Đang xử lý...' : 'Thanh toán'}</Button>
        </div>
      </div>

      <div className={styles.right}>
        <Card className={styles.summary}>
          <div className={styles.summaryTitle}>{plan} · Hằng tháng</div>
          <div className={styles.summaryPrice}>$9.99 <span className={styles.small}>/ tháng</span></div>
          <ul className={styles.features}>
            <li>AI Chat không giới hạn</li>
            <li>Đề thi N5 - N1</li>
            <li>Phân tích chi tiết</li>
          </ul>
          <div className={styles.summaryTotal}>Tổng: <strong>$9.99</strong></div>
        </Card>
      </div>
    </div>
  );
}
