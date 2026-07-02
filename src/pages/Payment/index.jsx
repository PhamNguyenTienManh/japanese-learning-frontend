import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard, faCheck, faShield, faLock,
  faArrowLeft, faGem,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "~/context/AuthContext";
import { formatPremiumExpiry } from "~/utils/premium";
import { FREE_FEATURES, PRO_FEATURES } from "~/constants/planFeatures";
import styles from "./Payment.module.scss";

function Payment() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "Pro";
  const navigate = useNavigate();
  const { isPremium, premiumExpiredDate } = useAuth();
  const isFree = plan === "Miễn phí";
  const alreadyPremium = isPremium && !isFree;
  const premiumExpiry = formatPremiumExpiry(premiumExpiredDate);
  const features = isFree ? FREE_FEATURES : PRO_FEATURES;

  const handleContinue = () => {
    if (isFree) {
      navigate("/");
      return;
    }

    if (alreadyPremium) {
      navigate("/dashboard");
      return;
    }

    navigate(`/payment/checkout?plan=${encodeURIComponent(plan)}`);
  };

  return (
    <section className={styles.wrap}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
        </button>
        <div className={styles.steps}>
          <span className={styles.stepActive}>1. Xác nhận đơn hàng</span>
          <span className={styles.stepDivider}>›</span>
          <span className={styles.stepInactive}>2. Thanh toán</span>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.planCard}>
          <div className={styles.planHeader}>
            <div className={styles.planIconWrap} data-free={isFree}>
              <FontAwesomeIcon icon={isFree ? faCreditCard : faGem} />
            </div>
            <div className={styles.planMeta}>
              <h2 className={styles.planName}>Gói {plan}</h2>
              <p className={styles.planTagline}>
                {isFree ? "Hoàn hảo để bắt đầu hành trình" : "Tối ưu cho học viên nghiêm túc"}
              </p>
            </div>
            {!isFree && (
              <span className={styles.popularBadge}>
                {alreadyPremium ? "Đang dùng" : "Phổ biến"}
              </span>
            )}
          </div>

          {alreadyPremium && (
            <div className={styles.premiumNotice}>
              <FontAwesomeIcon icon={faCheck} />
              <div>
                <strong>Bạn đã có Premium.</strong>
                <span>
                  {premiumExpiry
                    ? ` Gói Pro đang hoạt động đến ${premiumExpiry}.`
                    : " Gói Pro đang hoạt động trên tài khoản này."}
                </span>
              </div>
            </div>
          )}

          <div className={styles.priceRow}>
            <span className={styles.priceAmount}>{isFree ? "0 ₫" : "249.000 ₫"}</span>
            <div className={styles.priceDetail}>
              <span className={styles.pricePer}>/ tháng</span>
              {!isFree && !alreadyPremium && (
                <span className={styles.billingNote}>Thanh toán hằng tháng · Hủy bất cứ lúc nào</span>
              )}
            </div>
          </div>

          <div className={styles.divider} />

          <p className={styles.featureHeading}>Bao gồm trong gói</p>
          <div className={styles.featureList}>
            {features.map((f, i) => (
              <div key={i} className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <span className={styles.featureLabel}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.summaryCard}>
          <h3 className={styles.summaryHeading}>Tóm tắt đơn hàng</h3>

          <div className={styles.summaryItem}>
            <span>Gói {plan}</span>
            <span>{isFree ? "0 ₫" : "249.000 ₫"}</span>
          </div>
          <div className={styles.summaryItem}>
            <span>Trạng thái</span>
            <span className={alreadyPremium ? styles.statusOk : styles.summaryMuted}>
              {alreadyPremium ? "Đã kích hoạt" : "Chưa thanh toán"}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span>Chu kỳ thanh toán</span>
            <span className={styles.summaryMuted}>Hằng tháng</span>
          </div>
          {!isFree && !alreadyPremium && (
            <div className={styles.summaryItem}>
              <span>Thuế &amp; phí</span>
              <span className={styles.summaryMuted}>0 ₫</span>
            </div>
          )}

          <div className={styles.divider} />

          <div className={`${styles.summaryItem} ${styles.summaryTotal}`}>
            <span>Tổng hôm nay</span>
            <span>{isFree || alreadyPremium ? "0 ₫" : "249.000 ₫"}</span>
          </div>

          <Button
            full
            primary={!isFree && !alreadyPremium}
            outline={isFree || alreadyPremium}
            onClick={handleContinue}
          >
            {alreadyPremium
              ? "Vào bảng điều khiển"
              : isFree
                ? "Bắt đầu miễn phí"
                : "Tiếp tục thanh toán"}
          </Button>

          <div className={styles.securityRow}>
            <span><FontAwesomeIcon icon={faShield} /> Bảo mật SSL</span>
            <span><FontAwesomeIcon icon={faLock} /> Mã hoá 256-bit</span>
          </div>
        </div>
      </div>

      <p className={styles.disclaimer}>
        Đây là bản demo. Thông tin thanh toán không được xử lý thực tế.
      </p>
    </section>
  );
}

export default Payment;
