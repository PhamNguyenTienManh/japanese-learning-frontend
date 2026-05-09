import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Card from "~/components/Card";
import Button from "~/components/Button";
import { useToast } from "~/context/ToastContext";
import styles from "./Success.module.scss";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const provider = searchParams.get("provider") || "";
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    // Simulate verifying provider callback
    localStorage.setItem("isPremium", "true");
    window.dispatchEvent(new StorageEvent("storage", { key: "isPremium", newValue: "true" }));
    addToast("Thanh toán thành công", "success");
  }, []);

  return (
    <section className={styles.wrap}>
      <Card className={styles.card}>
        <h2>Thanh toán thành công</h2>
        <p>Nhà cung cấp: {provider || 'N/A'}</p>
        <div className={styles.actions}>
          <Button onClick={() => navigate('/')}>Về trang chủ</Button>
        </div>
      </Card>
    </section>
  );
}
