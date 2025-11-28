import { useState, useEffect } from "react";
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
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import { getProfile, updateProfile, updateAvatar } from "~/services/profileService";

const cx = classNames.bind(styles);

function Setting() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [job, setJob] = useState("");
  const [gender, setGender] = useState("0");

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [imageChanged, setImageChanged] = useState(false);

  // Backup state for cancel action
  const [backupData, setBackupData] = useState({});

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const profile = await getProfile();
      const data = profile.data;

      // Map API data to state
      setName(data.name || "");
      setEmail(data.userId.email || "");
      setBio(data.introduction || "");
      setAvatarPreview(data.image_url || null);
      setBirthDate(data.birthday ? data.birthday.split('T')[0] : "");
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setJob(data.job || "");
      setGender(data.sex !== undefined ? String(data.sex) : "0");
    } catch (err) {
      setError("Không thể tải thông tin cá nhân. Vui lòng thử lại.");
      console.error("Error fetching profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Kích thước ảnh không được vượt quá 2MB");
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError("Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc GIF");
        return;
      }

      setAvatar(file);
      setImageChanged(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleEditClick = () => {
    // Backup current data
    setBackupData({
      name,
      bio,
      avatarPreview,
      birthDate,
      phone,
      address,
      job,
      gender,
    });
    setImageChanged(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Restore backup data
    setName(backupData.name);
    setBio(backupData.bio);
    setAvatarPreview(backupData.avatarPreview);
    setBirthDate(backupData.birthDate);
    setPhone(backupData.phone);
    setAddress(backupData.address);
    setJob(backupData.job);
    setGender(backupData.gender);
    setAvatar(null);
    setImageChanged(false);
    setIsEditing(false);
    setError(null);
  };

  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage("");

      // Step 1: Upload image if changed
      let uploadedImageData = null;
      if (imageChanged && avatar) {
        try {
          setIsUploadingImage(true);
          const imageResult = await updateAvatar(avatar);
          uploadedImageData = imageResult.data; // Contains image_url and image_publicId
          // Update preview immediately with server URL
          setAvatarPreview(uploadedImageData.image_url);
          setIsUploadingImage(false);
        } catch (uploadErr) {
          setIsUploadingImage(false);
          throw new Error("Không thể tải ảnh lên. Vui lòng thử lại.");
        }
      }

      // Step 2: Prepare profile data
      const updateData = {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        birthday: birthDate || undefined,
        sex: parseInt(gender),
        job: job.trim(),
        introduction: bio.trim(),
      };

      // Add image data if uploaded
      if (uploadedImageData) {
        updateData.image_url = uploadedImageData.image_url;
        updateData.image_publicId = uploadedImageData.image_publicId;
      }

      // Remove empty fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === "" || updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // Step 3: Update profile
      await updateProfile(updateData);

      setSuccessMessage("Cập nhật thông tin thành công!");
      setIsEditing(false);
      setImageChanged(false);
      setAvatar(null);

      // Fetch lại profile để đảm bảo dữ liệu đồng bộ với server
      await fetchProfileData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Không thể cập nhật thông tin. Vui lòng thử lại.");
      console.error("Error updating profile:", err);
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  };

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
                {!isEditing && (
                  <button
                    className={cx("edit-btn")}
                    onClick={handleEditClick}
                    title="Chỉnh sửa thông tin"
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                )}
              </div>
              <div className={cx("card-body")}>
                {error && (
                  <div className={cx("alert", "alert-error")}>
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className={cx("alert", "alert-success")}>
                    {successMessage}
                  </div>
                )}

                {isLoading ? (
                  <div className={cx("loading")}>Đang tải thông tin...</div>
                ) : (
                  <>
                    {/* Avatar Upload */}
                    <div className={cx("field")}>
                      <label className={cx("label")}>Ảnh đại diện</label>
                      <div className={cx("avatar-upload")}>
                        <div className={cx("avatar-preview")}>
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className={cx("avatar-img")} />
                          ) : (
                            <div className={cx("avatar-placeholder")}>
                              <FontAwesomeIcon icon={faUser} className={cx("avatar-icon")} />
                            </div>
                          )}
                        </div>
                        <div className={cx("avatar-actions")}>
                          <input
                            type="file"
                            id="avatar-input"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className={cx("avatar-input")}
                            disabled={!isEditing}
                          />
                          <label
                            htmlFor="avatar-input"
                            className={cx("upload-btn", { disabled: !isEditing })}
                          >
                            Chọn ảnh
                          </label>
                          <p className={cx("upload-hint")}>JPG, PNG hoặc GIF (tối đa 2MB)</p>
                        </div>
                      </div>
                    </div>

                    <div className={cx("field")}>
                      <label htmlFor="name" className={cx("label")}>
                        Tên hiển thị
                      </label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={"settings-input"}
                        disabled={!isEditing}
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
                        disabled={true}
                      />
                    </div>

                    {/* Birth Date */}
                    <div className={cx("field")}>
                      <label htmlFor="birthDate" className={cx("label")}>
                        Ngày sinh
                      </label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className={"settings-input"}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Gender */}
                    <div className={cx("field")}>
                      <label className={cx("label")}>Giới tính</label>
                      <div className={cx("gender-row")}>
                        <label className={cx("radio-label", { disabled: !isEditing })}>
                          <input
                            type="radio"
                            name="gender"
                            value="0"
                            checked={gender === "0"}
                            onChange={(e) => setGender(e.target.value)}
                            disabled={!isEditing}
                          />
                          <span>Nam</span>
                        </label>
                        <label className={cx("radio-label", { disabled: !isEditing })}>
                          <input
                            type="radio"
                            name="gender"
                            value="1"
                            checked={gender === "1"}
                            onChange={(e) => setGender(e.target.value)}
                            disabled={!isEditing}
                          />
                          <span>Nữ</span>
                        </label>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className={cx("field")}>
                      <label htmlFor="phone" className={cx("label")}>
                        Số điện thoại
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={"settings-input"}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Address */}
                    <div className={cx("field")}>
                      <label htmlFor="address" className={cx("label")}>
                        Địa chỉ
                      </label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className={"settings-input"}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Job */}
                    <div className={cx("field")}>
                      <label htmlFor="job" className={cx("label")}>
                        Công việc
                      </label>
                      <Input
                        id="job"
                        value={job}
                        onChange={(e) => setJob(e.target.value)}
                        className={"settings-input"}
                        disabled={!isEditing}
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
                        disabled={!isEditing}
                      />
                    </div>

                    {isEditing && (
                      <div className={cx("action-buttons")}>
                        <Button primary onClick={handleUpdateProfile} disabled={isSaving || isUploadingImage}>
                          {isUploadingImage ? "Đang tải ảnh..." : isSaving ? "Đang lưu..." : "Cập nhật"}
                        </Button>
                        <Button outline onClick={handleCancelEdit} disabled={isSaving || isUploadingImage}>
                          Hủy
                        </Button>
                      </div>
                    )}
                  </>
                )}
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