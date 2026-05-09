import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard, faCheck, faShield, faLock,
  faArrowLeft, faGem, faRobot, faGraduationCap,
  faChartLine, faComments, faHeadset, faBookOpen,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./Payment.module.scss";

const FREE_FEATURES = [
  { icon: faBookOpen, label: "Từ điển tiếng Nhật cơ bản" },
  { icon: faRobot, label: "AI Chat giới hạn" },
  { icon: faGraduationCap, label: "Đề thi JLPT N5 - N4" },
  { icon: faComments, label: "Tham gia cộng đồng" },
  { icon: faCheck, label: "Sổ tay từ vựng" },
];

const PRO_FEATURES = [
  { icon: faRobot, label: "AI Chat không giới hạn" },
  { icon: faGraduationCap, label: "Đề thi JLPT N5 - N1 đầy đủ" },
  { icon: faChartLine, label: "Phân tích chi tiết tiến độ" },
  { icon: faComments, label: "Luyện hội thoại không giới hạn" },
  { icon: faHeadset, label: "Ưu tiên hỗ trợ 24/7" },
  { icon: faBookOpen, label: "Tất cả tính năng Miễn phí" },
];

function Payment() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "Pro";
  const navigate = useNavigate();
  const isFree = plan === "Miễn phí";
  const features = isFree ? FREE_FEATURES : PRO_FEATURES;

  const handleContinue = () => {
    if (isFree) {
      navigate("/");
    } else {
      navigate(`/payment/checkout?plan=${encodeURIComponent(plan)}`);
    }
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
        {/* Left – Plan details */}
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
            {!isFree && <span className={styles.popularBadge}>Phổ biến</span>}
          </div>

          <div className={styles.priceRow}>
            <span className={styles.priceAmount}>{isFree ? "$0" : "$9.99"}</span>
            <div className={styles.priceDetail}>
              <span className={styles.pricePer}>/ tháng</span>
              {!isFree && (
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

        {/* Right – Order summary */}
        <div className={styles.summaryCard}>
          <h3 className={styles.summaryHeading}>Tóm tắt đơn hàng</h3>

          <div className={styles.summaryItem}>
            <span>Gói {plan}</span>
            <span>{isFree ? "$0.00" : "$9.99"}</span>
          </div>
          <div className={styles.summaryItem}>
            <span>Chu kỳ thanh toán</span>
            <span className={styles.summaryMuted}>Hằng tháng</span>
          </div>
          {!isFree && (
            <div className={styles.summaryItem}>
              <span>Thuế &amp; phí</span>
              <span className={styles.summaryMuted}>$0.00</span>
            </div>
          )}

          <div className={styles.divider} />

          <div className={`${styles.summaryItem} ${styles.summaryTotal}`}>
            <span>Tổng hôm nay</span>
            <span>{isFree ? "$0.00" : "$9.99"}</span>
          </div>

          <Button full primary={!isFree} outline={isFree} onClick={handleContinue}>
            {isFree ? "Bắt đầu miễn phí" : "Tiếp tục thanh toán"}
          </Button>

          <div className={styles.securityRow}>
            <span><FontAwesomeIcon icon={faShield} /> Bảo mật SSL</span>
            <span><FontAwesomeIcon icon={faLock} /> Mã hoá 256‑bit</span>
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
