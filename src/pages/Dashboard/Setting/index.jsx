import { useState } from "react";
import classNames from "classnames/bind";
import styles from "./Setting.module.scss";

import Card from "~/components/Card";
import Button from "~/components/Button";
import Input from "~/components/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUser,
  faBell,
  faLock,
  faPalette,
} from "@fortawesome/free-solid-svg-icons";

const cx = classNames.bind(styles);

function Setting() {
  const [name, setName] = useState("Nguyễn Văn A");
  const [email, setEmail] = useState("nguyenvana@example.com");
  const [bio, setBio] = useState("Đang học tiếng Nhật để chuẩn bị thi JLPT N5");

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          {/* Header */}
          <div className={cx("header")}>
            <button
              type="button"
              onClick={handleBack}
              className={cx("back-link")}
            >
              <FontAwesomeIcon icon={faArrowLeft} className={cx("back-icon")} />
              <span>Quay lại bảng điều khiển</span>
            </button>
            <h1 className={cx("title")}>Cài đặt</h1>
            <p className={cx("subtitle")}>
              Quản lý thông tin tài khoản và tùy chọn
            </p>
          </div>

          <div className={cx("grid")}>
            {/* Profile settings */}
            <Card className={cx("card")}>
              <div className={cx("card-header")}>
                <div className={cx("icon-box")}>
                  <FontAwesomeIcon icon={faUser} className={cx("icon")} />
                </div>
                <h2 className={cx("card-title")}>Thông tin cá nhân</h2>
              </div>
              <div className={cx("card-body")}>
                <div className={cx("field")}>
                  <label htmlFor="name" className={cx("label")}>
                    Tên hiển thị
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={"settings-input"}
                  />
                </div>
                <div className={cx("field")}>
                  <label htmlFor="email" className={cx("label")}>
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={"settings-input"}
                  />
                </div>
                <div className={cx("field")}>
                  <label htmlFor="bio" className={cx("label")}>
                    Giới thiệu
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className={cx("textarea")}
                  />
                </div>
                <Button primary>Lưu thay đổi</Button>
              </div>
            </Card>

            {/* Notification settings */}
            <Card className={cx("card")}>
              <div className={cx("card-header")}>
                <div className={cx("icon-box")}>
                  <FontAwesomeIcon icon={faBell} className={cx("icon")} />
                </div>
                <h2 className={cx("card-title")}>Thông báo</h2>
              </div>
              <div className={cx("card-body")}>
                <div className={cx("toggle-row")}>
                  <div className={cx("toggle-text")}>
                    <p className={cx("toggle-title")}>
                      Nhắc nhở học tập hàng ngày
                    </p>
                    <p className={cx("toggle-desc")}>
                      Nhận thông báo nhắc nhở học mỗi ngày
                    </p>
                  </div>
                  <label className={cx("switch")}>
                    <input type="checkbox" defaultChecked />
                    <span className={cx("slider")} />
                  </label>
                </div>

                <div className={cx("toggle-row")}>
                  <div className={cx("toggle-text")}>
                    <p className={cx("toggle-title")}>Thông báo cộng đồng</p>
                    <p className={cx("toggle-desc")}>
                      Nhận thông báo về bình luận và tương tác
                    </p>
                  </div>
                  <label className={cx("switch")}>
                    <input type="checkbox" defaultChecked />
                    <span className={cx("slider")} />
                  </label>
                </div>

                <div className={cx("toggle-row")}>
                  <div className={cx("toggle-text")}>
                    <p className={cx("toggle-title")}>Cập nhật tính năng mới</p>
                    <p className={cx("toggle-desc")}>
                      Nhận thông báo về tính năng và cập nhật mới
                    </p>
                  </div>
                  <label className={cx("switch")}>
                    <input type="checkbox" />
                    <span className={cx("slider")} />
                  </label>
                </div>
              </div>
            </Card>

            {/* Security settings */}
            <Card className={cx("card")}>
              <div className={cx("card-header")}>
                <div className={cx("icon-box")}>
                  <FontAwesomeIcon icon={faLock} className={cx("icon")} />
                </div>
                <h2 className={cx("card-title")}>Bảo mật</h2>
              </div>
              <div className={cx("card-body")}>
                <div className={cx("field")}>
                  <label htmlFor="current-password" className={cx("label")}>
                    Mật khẩu hiện tại
                  </label>
                  <Input
                    id="current-password"
                    type="password"
                    className={"settings-input"}
                  />
                </div>
                <div className={cx("field")}>
                  <label htmlFor="new-password" className={cx("label")}>
                    Mật khẩu mới
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    className={"settings-input"}
                  />
                </div>
                <div className={cx("field")}>
                  <label htmlFor="confirm-password" className={cx("label")}>
                    Xác nhận mật khẩu mới
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    className={"settings-input"}
                  />
                </div>
                <Button primary>Đổi mật khẩu</Button>
              </div>
            </Card>

            {/* Appearance settings */}
            <Card className={cx("card")}>
              <div className={cx("card-header")}>
                <div className={cx("icon-box")}>
                  <FontAwesomeIcon icon={faPalette} className={cx("icon")} />
                </div>
                <h2 className={cx("card-title")}>Giao diện</h2>
              </div>
              <div className={cx("card-body")}>
                <div className={cx("field")}>
                  <label className={cx("label")}>Chế độ hiển thị</label>
                  <div className={cx("theme-row")}>
                    <Button outline full className={"orange"}>
                      Sáng
                    </Button>
                    <Button full primary>
                      Tối
                    </Button>
                    <Button outline full className={"orange"}>
                      Tự động
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Setting;
