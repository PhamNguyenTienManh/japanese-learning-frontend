import classNames from "classnames/bind";
import styles from "./Pricing.module.scss";
import Button from "~/components/Button";
import Card from "~/components/Card";

const cx = classNames.bind(styles);

const plans = [
  {
    name: "Miễn phí",
    price: "$0/tháng",
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
    price: "$9.99/tháng",
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
  {
    name: "Premium",
    price: "$19.99/tháng",
    desc: "Trải nghiệm toàn diện nhất",
    features: [
      "Tất cả tính năng Pro",
      "Nhận diện chữ viết tay cao cấp",
      "Lộ trình học cá nhân",
      "Sách học tập độc quyền",
      "Hỗ trợ 24/7 trực tiếp",
      "Chứng chỉ hoàn thành",
    ],
  },
];

function Pricing() {
  return (
    <section className={cx("pricing")}>
      <h2 className={cx("section-title")}>Gói cước</h2>
      <div className={cx("plans")}>
        {plans.map((plan, idx) => (
          <Card
            key={idx}
            className={cx("plan-card", { highlight: plan.highlight })}
          >
            {plan.highlight && <span className={cx("badge")}>Phổ biến</span>}
            <h3 className={cx("plan-name")}>{plan.name}</h3>
            <p className={cx("plan-desc")}>{plan.desc}</p>
            <div className={cx("plan-price")}>{plan.price}</div>

            {plan.highlight ? (
              <Button to="/" className={`green`} full>
                Nâng cấp ngay
              </Button>
            ) : (
              <Button to="/" className={"orange"} full outline>
                Bắt đầu ngay
              </Button>
            )}

            <div className={cx("plan-features")}>
              {plan.features.map((feat, i) => (
                <div key={i} className={cx("feature-item")}>
                  <span>✔</span> {feat}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default Pricing;
