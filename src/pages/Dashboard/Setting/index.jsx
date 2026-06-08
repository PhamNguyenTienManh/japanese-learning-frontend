import { useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames/bind";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Calendar,
  Camera,
  Check,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./Setting.module.scss";

import Button from "~/components/Button";
import Input from "~/components/Input";
import { getProfile, updateAvatar, updateProfile } from "~/services/profileService";
import authService from "~/services/authService";
import { getRecentUserActivities } from "~/services/userActivityService";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import { getAvatarUrl, handleAvatarError } from "~/utils/avatar";

const cx = classNames.bind(styles);

const getResponseData = (response) => response?.data ?? response ?? {};
const VIETNAM_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const SETTINGS_TABS = {
  overview: "overview",
  activity: "activity",
  security: "security",
};

const formatActivityDate = (value) => {
  if (!value) return "Vừa xong";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Vừa xong";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getActivityIcon = (type) => {
  if (type === "exam_completed") return Check;
  if (type === "post_created" || type === "comment_created") return MessageSquare;
  if (type === "study_time_added") return Clock;
  return Activity;
};

function Setting() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState(SETTINGS_TABS.overview);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState("local");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [job, setJob] = useState("");
  const [gender, setGender] = useState("0");

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [birthDateTouched, setBirthDateTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [backupData, setBackupData] = useState({});
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordVisible, setPasswordVisible] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const nameFieldRef = useRef(null);
  const birthDateFieldRef = useRef(null);
  const phoneFieldRef = useRef(null);

  const trimmedName = name.trim();
  const isNameInvalid = trimmedName.length < 3;
  const normalizedPhone = phone.replace(/[\s.-]/g, "");
  const isPhoneInvalid = Boolean(phone.trim()) && !VIETNAM_PHONE_REGEX.test(normalizedPhone);
  const birthDateErrorText = useMemo(() => {
    if (!birthDate) return "";

    const date = new Date(`${birthDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "Ngày sinh không hợp lệ.";

    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }

    if (age < 3) return "Ngày sinh cần thể hiện người dùng từ 3 tuổi trở lên.";
    if (age > 150) return "Ngày sinh không được vượt quá 150 tuổi.";
    return "";
  }, [birthDate]);
  const shouldShowNameError = isEditing && (nameTouched || formSubmitted) && isNameInvalid;
  const shouldShowPhoneError = isEditing && (phoneTouched || formSubmitted) && isPhoneInvalid;
  const shouldShowBirthDateError = isEditing && (birthDateTouched || formSubmitted) && Boolean(birthDateErrorText);
  const nameError =
    shouldShowNameError
      ? "Tên hiển thị cần ít nhất 3 ký tự."
      : "";
  const phoneError =
    shouldShowPhoneError
      ? "Số điện thoại không đúng định dạng."
      : "";
  const birthDateError = shouldShowBirthDateError ? birthDateErrorText : "";
  const canSave = isEditing && !isSaving && !isUploadingImage;

  const accountInitial = useMemo(() => {
    const source = trimmedName || email || "J";
    return source.charAt(0).toUpperCase();
  }, [email, trimmedName]);

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (activeTab !== SETTINGS_TABS.activity) return;
    fetchRecentActivities();
  }, [activeTab]);

  const fetchProfileData = async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      const profile = await getProfile();
      const data = getResponseData(profile);

      setName(data.name || "");
      setEmail(data.userId?.email || data.email || "");
      setProvider(data.userId?.provider || data.provider || "local");
      setBio(data.introduction || "");
      setAvatarPreview(data.image_url || null);
      setBirthDate(data.birthday ? data.birthday.split("T")[0] : "");
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setJob(data.job || "");
      setGender(data.sex !== undefined ? String(data.sex) : "0");
    } catch (err) {
      setError("Không thể tải thông tin cá nhân. Vui lòng thử lại.");
      console.error("Error fetching profile:", err);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const fetchRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError("");
      const response = await getRecentUserActivities(10);
      const data = response?.data ?? response ?? [];
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      setActivitiesError("Không tải được hoạt động gần đây.");
      console.error("Error fetching recent activities:", err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Kích thước ảnh không được vượt quá 2MB.");
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Chỉ chấp nhận file ảnh JPG, PNG, WEBP hoặc GIF.");
      return;
    }

    setAvatar(file);
    setImageChanged(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleEditClick = () => {
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
    setNameTouched(false);
    setBirthDateTouched(false);
    setPhoneTouched(false);
    setFormSubmitted(false);
    setError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setName(backupData.name || "");
    setBio(backupData.bio || "");
    setAvatarPreview(backupData.avatarPreview || null);
    setBirthDate(backupData.birthDate || "");
    setPhone(backupData.phone || "");
    setAddress(backupData.address || "");
    setJob(backupData.job || "");
    setGender(backupData.gender || "0");
    setAvatar(null);
    setImageChanged(false);
    setNameTouched(false);
    setBirthDateTouched(false);
    setPhoneTouched(false);
    setFormSubmitted(false);
    setIsEditing(false);
    setError(null);
  };

  const scrollToField = (fieldRef) => {
    window.setTimeout(() => {
      fieldRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      fieldRef.current?.querySelector("input, textarea")?.focus();
    }, 0);
  };

  const validateProfileForm = () => {
    if (isNameInvalid) {
      scrollToField(nameFieldRef);
      return false;
    }

    if (birthDateErrorText) {
      scrollToField(birthDateFieldRef);
      return false;
    }

    if (isPhoneInvalid) {
      scrollToField(phoneFieldRef);
      return false;
    }

    return true;
  };

  const handleUpdateProfile = async (event) => {
    event?.preventDefault();
    setNameTouched(true);
    setBirthDateTouched(true);
    setPhoneTouched(true);
    setFormSubmitted(true);

    if (!validateProfileForm()) {
      setError(null);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      let uploadedImageData = null;
      if (imageChanged && avatar) {
        try {
          setIsUploadingImage(true);
          const imageResult = await updateAvatar(avatar);
          const imagePayload = getResponseData(imageResult);
          const uploadedProfile = imagePayload.profile || imagePayload;
          const imageUrl = uploadedProfile.image_url || imagePayload.url;
          const imagePublicId = uploadedProfile.image_publicId || imagePayload.publicId;

          uploadedImageData = {
            image_url: imageUrl,
            image_publicId: imagePublicId,
          };

          if (imageUrl) {
            setAvatarPreview(imageUrl);
          }
        } catch (uploadErr) {
          throw new Error("Không thể tải ảnh lên. Vui lòng thử lại.");
        } finally {
          setIsUploadingImage(false);
        }
      }

      const updateData = {
        name: trimmedName,
        address: address.trim(),
        phone: normalizedPhone,
        birthday: birthDate || undefined,
        sex: Number(gender),
        job: job.trim(),
        introduction: bio.trim(),
      };

      if (uploadedImageData?.image_url) {
        updateData.image_url = uploadedImageData.image_url;
      }
      if (uploadedImageData?.image_publicId) {
        updateData.image_publicId = uploadedImageData.image_publicId;
      }

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === "" || updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateProfile(updateData);
      await fetchProfileData({ showLoading: false });
      await refreshProfile?.();

      addToast("Cập nhật thông tin cá nhân thành công!", "success");
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      setIsEditing(false);
      setImageChanged(false);
      setAvatar(null);
      setNameTouched(false);
    } catch (err) {
      setError(err.message || "Không thể cập nhật thông tin. Vui lòng thử lại.");
      console.error("Error updating profile:", err);
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  };

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    setError(null);
    setPasswordError("");
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordError("");
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisible((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (provider === "google") {
      setPasswordError("Tài khoản của bạn đang liên kết qua Google, không thể đổi mật khẩu tại đây.");
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("Vui lòng nhập đầy đủ thông tin mật khẩu.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Mật khẩu mới cần ít nhất 6 ký tự.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordError("");
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      addToast("Đổi mật khẩu thành công!", "success");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordError(err.message || "Không thể đổi mật khẩu. Vui lòng thử lại.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleActivityClick = (activity) => {
    if (activity?.href) {
      navigate(activity.href);
    }
  };

  return (
    <div className={cx("wrapper")}>
      <main className={cx("main")}>
        <div className={cx("container")}>
          <button type="button" onClick={() => window.history.back()} className={cx("backLink")}>
            <ArrowLeft size={17} />
            <span>Bảng điều khiển</span>
          </button>

          <div className={cx("layout")}>
            <aside className={cx("sidebar")}>
              <div className={cx("profileCard")}>
                <div className={cx("avatarShell")}>
                  <img
                    src={getAvatarUrl(avatarPreview)}
                    alt={trimmedName || "Avatar"}
                    className={cx("avatarImg")}
                    onError={handleAvatarError}
                  />
                  <span className={cx("avatarFallback")}>{accountInitial}</span>
                </div>
                <div className={cx("profileName")}>{trimmedName || "Người học JAVI"}</div>
                <div className={cx("profileEmail")}>{email || "Chưa có email"}</div>
                <div className={cx("statusPill")}>
                  <Check size={14} />
                  <span>Hồ sơ đang hoạt động</span>
                </div>

                <div className={cx("profileNav")}>
                  <button
                    type="button"
                    className={cx("profileNavButton", {
                      active: activeTab === SETTINGS_TABS.overview,
                    })}
                    onClick={() => handleTabChange(SETTINGS_TABS.overview)}
                  >
                    <User size={18} />
                    <span>Giới thiệu chung</span>
                  </button>
                  <button
                    type="button"
                    className={cx("profileNavButton", {
                      active: activeTab === SETTINGS_TABS.activity,
                    })}
                    onClick={() => handleTabChange(SETTINGS_TABS.activity)}
                  >
                    <Activity size={18} />
                    <span>Hoạt động gần đây</span>
                  </button>
                  <button
                    type="button"
                    className={cx("profileNavButton", {
                      active: activeTab === SETTINGS_TABS.security,
                    })}
                    onClick={() => handleTabChange(SETTINGS_TABS.security)}
                  >
                    <Lock size={18} />
                    <span>Bảo mật</span>
                  </button>
                </div>
              </div>
            </aside>

            <section className={cx("panel")}>
              {activeTab === SETTINGS_TABS.overview && (
                <>
                  <div className={cx("panelHeader")}>
                    <div>
                      <h2>Thông tin cá nhân</h2>
                      <p>Những thông tin này được dùng trong dashboard và bài viết cộng đồng.</p>
                    </div>
                    {!isEditing ? (
                      <Button
                        outline
                        type="button"
                        onClick={handleEditClick}
                        className={cx("editButton")}
                        leftIcon={<Edit3 size={16} />}
                      >
                        Chỉnh sửa
                      </Button>
                    ) : (
                      <div className={cx("editState")}>Đang chỉnh sửa</div>
                    )}
                  </div>

                  {error && <div className={cx("alert", "alertError")}>{error}</div>}

                  {isLoading ? (
                    <div className={cx("loading")}>
                      <span />
                      Đang tải thông tin...
                    </div>
                  ) : (
                    <form className={cx("form")} onSubmit={handleUpdateProfile}>
                  <div className={cx("avatarRow")}>
                    <div className={cx("avatarPreview")}>
                      <img
                        src={getAvatarUrl(avatarPreview)}
                        alt={trimmedName || "Avatar"}
                        className={cx("avatarImg")}
                        onError={handleAvatarError}
                      />
                    </div>
                    <div className={cx("avatarActions")}>
                      <strong>Ảnh đại diện</strong>
                      <span>JPG, PNG, WEBP hoặc GIF, tối đa 2MB.</span>
                      <input
                        type="file"
                        id="avatar-input"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className={cx("avatarInput")}
                        disabled={!isEditing}
                      />
                      <label
                        htmlFor="avatar-input"
                        className={cx("uploadButton", { disabled: !isEditing })}
                      >
                        <Camera size={16} />
                        <span>Đổi ảnh</span>
                      </label>
                    </div>
                  </div>

                  <div className={cx("formGrid")}>
                    <div
                      ref={nameFieldRef}
                      className={cx("field", { fieldError: Boolean(nameError) })}
                    >
                      <label htmlFor="name" className={cx("label")}>
                        <User size={15} />
                        <span>Tên hiển thị</span>
                      </label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => setNameTouched(true)}
                        className={cx("settingsInput")}
                        disabled={!isEditing}
                      />
                      {nameError && <p className={cx("fieldHint", "errorHint")}>{nameError}</p>}
                    </div>

                    <div className={cx("field")}>
                      <label htmlFor="email" className={cx("label")}>
                        <Mail size={15} />
                        <span>Email</span>
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        className={cx("settingsInput", "disabledInput")}
                        disabled
                      />
                      <p className={cx("fieldHint")}>Email đăng nhập không thể chỉnh sửa.</p>
                    </div>

                    <div
                      ref={birthDateFieldRef}
                      className={cx("field", { fieldError: Boolean(birthDateError) })}
                    >
                      <label htmlFor="birthDate" className={cx("label")}>
                        <Calendar size={15} />
                        <span>Ngày sinh</span>
                      </label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        onBlur={() => setBirthDateTouched(true)}
                        className={cx("settingsInput")}
                        disabled={!isEditing}
                      />
                      {birthDateError && <p className={cx("fieldHint", "errorHint")}>{birthDateError}</p>}
                    </div>

                    <div className={cx("field")}>
                      <label className={cx("label")}>
                        <ShieldCheck size={15} />
                        <span>Giới tính</span>
                      </label>
                      <div className={cx("segmented", { disabled: !isEditing })}>
                        <label className={cx({ active: gender === "0" })}>
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
                        <label className={cx({ active: gender === "1" })}>
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

                    <div
                      ref={phoneFieldRef}
                      className={cx("field", { fieldError: Boolean(phoneError) })}
                    >
                      <label htmlFor="phone" className={cx("label")}>
                        <Phone size={15} />
                        <span>Số điện thoại</span>
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onBlur={() => setPhoneTouched(true)}
                        className={cx("settingsInput")}
                        disabled={!isEditing}
                      />
                      {phoneError && <p className={cx("fieldHint", "errorHint")}>{phoneError}</p>}
                    </div>

                    <div className={cx("field")}>
                      <label htmlFor="job" className={cx("label")}>
                        <Briefcase size={15} />
                        <span>Công việc</span>
                      </label>
                      <Input
                        id="job"
                        value={job}
                        onChange={(e) => setJob(e.target.value)}
                        className={cx("settingsInput")}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className={cx("field", "wide")}>
                      <label htmlFor="address" className={cx("label")}>
                        <MapPin size={15} />
                        <span>Địa chỉ</span>
                      </label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className={cx("settingsInput")}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className={cx("field", "wide")}>
                      <label htmlFor="bio" className={cx("label")}>
                        <User size={15} />
                        <span>Giới thiệu</span>
                      </label>
                      <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className={cx("textarea")}
                        disabled={!isEditing}
                        rows={4}
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className={cx("actionBar")}>
                      <Button
                        primary
                        type="submit"
                        disabled={!canSave}
                        className={cx("saveButton")}
                        leftIcon={<Save size={16} />}
                      >
                        {isUploadingImage ? "Đang tải ảnh..." : isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>
                      <Button
                        outline
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isSaving || isUploadingImage}
                        className={cx("cancelButton")}
                        leftIcon={<X size={16} />}
                      >
                        Hủy
                      </Button>
                    </div>
                  )}
                    </form>
                  )}
                </>
              )}

              {activeTab === SETTINGS_TABS.activity && (
                <div className={cx("tabContent")}>
                  <div className={cx("panelHeader")}>
                    <div>
                      <h2>Hoạt động gần đây</h2>
                      <p>Theo dõi các lần học, luyện thi, tra cứu và tương tác gần nhất.</p>
                    </div>
                  </div>

                  {activitiesLoading ? (
                    <div className={cx("loading")}>
                      <span />
                      Đang tải hoạt động...
                    </div>
                  ) : activitiesError ? (
                    <div className={cx("emptyState")}>{activitiesError}</div>
                  ) : activities.length === 0 ? (
                    <div className={cx("emptyState")}>
                      Chưa có hoạt động nào. Khi bạn học, làm bài thi hoặc tham gia cộng đồng,
                      lịch sử sẽ hiển thị tại đây.
                    </div>
                  ) : (
                    <div className={cx("activityList")}>
                      {activities.map((activity) => {
                        const Icon = getActivityIcon(activity.type);
                        return (
                          <button
                            type="button"
                            key={activity.id}
                            className={cx("activityItem")}
                            onClick={() => handleActivityClick(activity)}
                          >
                            <span className={cx("activityIcon")}>
                              <Icon size={18} />
                            </span>
                            <span className={cx("activityBody")}>
                              <strong>{activity.title}</strong>
                              {activity.description && <span>{activity.description}</span>}
                              <em>{formatActivityDate(activity.createdAt)}</em>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === SETTINGS_TABS.security && (
                <div className={cx("tabContent")}>
                  <div className={cx("panelHeader")}>
                    <div>
                      <h2>Bảo mật</h2>
                      <p>Đổi mật khẩu đăng nhập cho tài khoản JAVI của bạn.</p>
                    </div>
                  </div>

                  {provider === "google" ? (
                    <div className={cx("googleNotice")}>
                      <AlertCircle size={20} />
                      <div>
                        <strong>Tài khoản liên kết Google</strong>
                        <span>
                          Tài khoản của bạn đăng nhập qua Google nên không thể đổi mật khẩu tại JAVI.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <form className={cx("securityForm")} onSubmit={handleChangePassword}>
                      {passwordError && <div className={cx("alert", "alertError")}>{passwordError}</div>}

                      <div className={cx("field")}>
                        <label htmlFor="currentPassword" className={cx("label")}>
                          <Lock size={15} />
                          <span>Mật khẩu hiện tại</span>
                        </label>
                        <Input
                          id="currentPassword"
                          type={passwordVisible.currentPassword ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                          className={cx("settingsInput")}
                          rightIcon={
                            <button
                              type="button"
                              className={cx("passwordToggle")}
                              onClick={() => togglePasswordVisibility("currentPassword")}
                              aria-label={passwordVisible.currentPassword ? "Ẩn mật khẩu hiện tại" : "Hiện mật khẩu hiện tại"}
                            >
                              {passwordVisible.currentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          }
                        />
                      </div>

                      <div className={cx("field")}>
                        <label htmlFor="newPassword" className={cx("label")}>
                          <KeyRound size={15} />
                          <span>Mật khẩu mới</span>
                        </label>
                        <Input
                          id="newPassword"
                          type={passwordVisible.newPassword ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                          className={cx("settingsInput")}
                          rightIcon={
                            <button
                              type="button"
                              className={cx("passwordToggle")}
                              onClick={() => togglePasswordVisibility("newPassword")}
                              aria-label={passwordVisible.newPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                            >
                              {passwordVisible.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          }
                        />
                        <p className={cx("fieldHint")}>Mật khẩu mới cần ít nhất 6 ký tự.</p>
                      </div>

                      <div className={cx("field")}>
                        <label htmlFor="confirmPassword" className={cx("label")}>
                          <ShieldCheck size={15} />
                          <span>Xác nhận mật khẩu mới</span>
                        </label>
                        <Input
                          id="confirmPassword"
                          type={passwordVisible.confirmPassword ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                          className={cx("settingsInput")}
                          rightIcon={
                            <button
                              type="button"
                              className={cx("passwordToggle")}
                              onClick={() => togglePasswordVisibility("confirmPassword")}
                              aria-label={passwordVisible.confirmPassword ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
                            >
                              {passwordVisible.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          }
                        />
                      </div>

                      <div className={cx("actionBar")}>
                        <Button
                          primary
                          type="submit"
                          disabled={passwordSaving}
                          className={cx("saveButton")}
                          leftIcon={<Save size={16} />}
                        >
                          {passwordSaving ? "Đang lưu..." : "Đổi mật khẩu"}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Setting;
