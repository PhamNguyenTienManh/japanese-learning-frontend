import classNames from "classnames/bind";
import styles from "./About.module.scss";

import Button from "~/components/Button";
import Card from "~/components/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faBolt,
  faUsers,
  faCheck,
  faAward,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import Pricing from "~/components/Pricing";

const cx = classNames.bind(styles);

function About() {
  const benefits = [
    {
      title: "Phương pháp học hiệu quả",
      desc: "Kết hợp lý thuyết, thực hành và ứng dụng thực tế",
    },
    {
      title: "Cộng đồng hỗ trợ",
      desc: "Được giúp đỡ bởi những người học cùng mục tiêu",
    },
    {
      title: "AI hỗ trợ cá nhân",
      desc: "Nhận lời khuyên và hỗ trợ được cá nhân hóa",
    },
    {
      title: "Tiến độ có thể đo lường",
      desc: "Theo dõi sự tiến bộ qua các thước đo rõ ràng",
    },
    {
      title: "Nội dung cập nhật liên tục",
      desc: "Thêm mới đề thi, từ vựng và tính năng thường xuyên",
    },
    {
      title: "Hoàn toàn miễn phí",
      desc: "Truy cập tất cả tính năng chính mà không tốn phí",
    },
  ];

  return (
    <div className={cx("wrapper")}>
      <div className={cx("container")}>
        {/* Hero */}
        <section className={cx("hero")}>
          <div className={cx("hero-inner")}>
            <h1 className={cx("hero-title")}>
              Học tiếng Nhật <span className={cx("primary")}>thông minh</span>,
              học tiếng Nhật <span className={cx("primary")}>vui</span>
            </h1>
            <p className={cx("hero-desc")}>
              Nền tảng học tiếng Nhật toàn diện với AI hỗ trợ, cộng đồng sôi
              động và phương pháp học hiệu quả.
            </p>

            <div className={cx("hero-actions")}>
              <Button to="/" className={"green"}>
                Bắt đầu học ngay
              </Button>
              <Button outline className={"orange"}>
                Tìm hiểu thêm
              </Button>
            </div>
          </div>
        </section>
        {/* Features */}
        <section className={cx("features")}>
          <h2 className={cx("section-title")}>Tính năng chính</h2>

          <div className={cx("grid")}>
            <Card className={cx("card")}>
              <div className={cx("icon-box")}>
                <FontAwesomeIcon icon={faBookOpen} className={cx("icon")} />
              </div>
              <h3 className={cx("card-title")}>Từ điển thông minh</h3>
              <p className={cx("card-desc")}>
                Tra cứu từ vựng với nhận diện chữ viết tay, phát âm chuẩn và ví
                dụ sử dụng.
              </p>
            </Card>

            <Card className={cx("card")}>
              <div className={cx("icon-box")}>
                <FontAwesomeIcon icon={faBolt} className={cx("icon")} />
              </div>
              <h3 className={cx("card-title")}>AI Chat cá nhân</h3>
              <p className={cx("card-desc")}>
                Trò chuyện với AI để luyện hội thoại và hỏi đáp về ngữ pháp.
              </p>
            </Card>

            <Card className={cx("card")}>
              <div className={cx("icon-box")}>
                <FontAwesomeIcon icon={faAward} className={cx("icon")} />
              </div>
              <h3 className={cx("card-title")}>Luyện thi JLPT</h3>
              <p className={cx("card-desc")}>
                Bộ đề JLPT từ N5 → N1 cùng phân tích kết quả chi tiết.
              </p>
            </Card>

            <Card className={cx("card")}>
              <div className={cx("icon-box")}>
                <FontAwesomeIcon icon={faUsers} className={cx("icon")} />
              </div>
              <h3 className={cx("card-title")}>Cộng đồng sôi động</h3>
              <p className={cx("card-desc")}>
                Hỏi đáp, chia sẻ kiến thức cùng hàng nghìn người học.
              </p>
            </Card>

            <Card className={cx("card")}>
              <div className={cx("icon-box")}>
                <FontAwesomeIcon icon={faChartLine} className={cx("icon")} />
              </div>
              <h3 className={cx("card-title")}>Theo dõi tiến độ</h3>
              <p className={cx("card-desc")}>
                Dashboard thống kê học tập & thành tích.
              </p>
            </Card>

            <Card className={cx("card")}>
              <div className={cx("icon-box")}>
                <FontAwesomeIcon icon={faBookOpen} className={cx("icon")} />
              </div>
              <h3 className={cx("card-title")}>Sổ tay từ vựng</h3>
              <p className={cx("card-desc")}>
                Lưu từ yêu thích và luyện flashcard theo SRS.
              </p>
            </Card>
          </div>
        </section>
        {/* Benefits */}
        <section className={cx("benefits")}>
          <h2 className={cx("section-title")}>Tại sao chọn chúng tôi?</h2>

          <div className={cx("benefit-grid")}>
            {benefits.map((item, i) => (
              <div key={i} className={cx("benefit-item")}>
                <div className={cx("benefit-icon")}>
                  <FontAwesomeIcon icon={faCheck} className={cx("check")} />
                </div>
                <div>
                  <h3 className={cx("benefit-title")}>{item.title}</h3>
                  <p className={cx("benefit-desc")}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <Pricing /> {/* section Pricing */}
        {/* CTA */}
        <section className={cx("cta")}>
          <h2 className={cx("cta-title")}>Sẵn sàng bắt đầu chưa?</h2>
          <p className={cx("cta-desc")}>
            Tham gia ngay hôm nay và bắt đầu hành trình học tiếng Nhật của bạn.
          </p>

          <Button to="/" className={"green"}>
            Bắt đầu học ngay
          </Button>
        </section>
      </div>
    </div>
  );
}

export default About;
