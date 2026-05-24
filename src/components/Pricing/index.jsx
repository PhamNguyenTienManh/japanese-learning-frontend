import classNames from "classnames/bind";
import styles from "./Pricing.module.scss";
import Button from "~/components/Button";
import Card from "~/components/Card";
import { useAuth } from "~/context/AuthContext";
import { formatPremiumExpiry } from "~/utils/premium";

const cx = classNames.bind(styles);

const plans = [
  {
    name: "Miễn phí",
    price: "0 ₫/tháng",
    desc: "Hoàn hảo để bắt đầu",
    features: [
      "Từ điển cơ bản",
      "AI Chat giới hạn",
      "Đề thi JLPT N5-N4",
      "Cộng đồng",
      "Sổ tay từ vựng",
    ],
  },
  {
    name: "Pro",
    price: "249.000 ₫/tháng",
    desc: "Tối ưu cho học viên nghiêm túc",
    features: [
      "Tất cả tính năng Miễn phí",
      "AI Chat không giới hạn",
      "Đề thi JLPT N5-N1",
      "Phân tích chi tiết",
      "Luyện hội thoại",
      "Ưu tiên hỗ trợ",
    ],
    highlight: true,
  },
];

function Pricing() {
  const { isPremium, premiumExpiredDate } = useAuth();
  const premiumExpiry = formatPremiumExpiry(premiumExpiredDate);

  return (
    <section className={cx("pricing")}>
      <h2 className={cx("section-title")}>Gói cước</h2>
      <div className={cx("plans")}>
        {plans.map((plan, idx) => {
          const isCurrentPremium = isPremium && plan.highlight;

          return (
            <Card
              key={idx}
              className={cx("plan-card", {
                highlight: plan.highlight,
                current: isCurrentPremium,
              })}
            >
              {plan.highlight && (
                <span className={cx("badge")}>
                  {isCurrentPremium ? "Đang sử dụng" : "Phổ biến"}
                </span>
              )}
              <h3 className={cx("plan-name")}>{plan.name}</h3>
              <p className={cx("plan-desc")}>{plan.desc}</p>
              <div className={cx("plan-price")}>{plan.price}</div>

              {isCurrentPremium && (
                <p className={cx("current-note")}>
                  Tài khoản của bạn đã có Premium
                  {premiumExpiry ? ` đến ${premiumExpiry}` : ""}.
                </p>
              )}

              <Button
                to={
                  isCurrentPremium
                    ? undefined
                    : `/payment?plan=${encodeURIComponent(plan.name)}`
                }
                full={true}
                primary={plan.highlight && !isCurrentPremium}
                outline={!plan.highlight || isCurrentPremium}
                disabled={isCurrentPremium}
              >
                {isCurrentPremium
                  ? "Đã kích hoạt Premium"
                  : plan.highlight
                    ? "Nâng cấp ngay"
                    : "Bắt đầu ngay"}
              </Button>

              <div className={cx("plan-features")}>
                {plan.features.map((feat, i) => (
                  <div key={i} className={cx("feature-item")}>
                    <span>✔</span> {feat}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default Pricing;
