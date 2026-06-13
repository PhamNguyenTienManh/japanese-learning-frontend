import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { USER_ROLES, USER_STATUS } from "~/services/userConstants";

const emptyForm = {
  email: "",
  password: "",
  confirmPassword: "",
  name: "",
  role: USER_ROLES.STUDENT,
  status: USER_STATUS.ACTIVE,
  sex: "",
  phone: "",
  birthday: "",
  address: "",
  job: "",
  introduction: "",
};

const inputClass =
  "h-11 w-full rounded-lg border-2 border-slate-700 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 hover:border-slate-500 focus:border-slate-700 focus:ring-4 focus:ring-slate-100";

const selectClass =
  "h-11 w-full rounded-lg border-1 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition hover:border-slate-500 focus:border-slate-700 focus:ring-4 focus:ring-slate-100";

const labelClass = "grid gap-2 text-xs font-bold uppercase tracking-normal text-slate-500";

function FieldError({ message }) {
  if (!message) return null;
  return <p className="m-0 text-xs font-bold normal-case text-rose-600">{message}</p>;
}

function formatDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function buildInitialForm(user) {
  if (!user) return emptyForm;

  return {
    email: user.email || "",
    password: "",
    name: user.profile?.name || "",
    role: user.role || USER_ROLES.STUDENT,
    status: user.status || USER_STATUS.ACTIVE,
    sex:
      user.profile?.sex === 0 || user.profile?.sex === 1
        ? String(user.profile.sex)
        : "",
    phone: user.profile?.phone || "",
    birthday: formatDateInput(user.profile?.birthday),
    address: user.profile?.address || "",
    job: user.profile?.job || "",
    introduction: user.profile?.introduction || "",
  };
}

function AdminUserModal({
  mode,
  user,
  open,
  saving,
  error,
  fieldErrors = {},
  onClose,
  onSubmit,
  onClearFieldError,
}) {
  const [form, setForm] = useState(emptyForm);
  const [localError, setLocalError] = useState("");
  const [localFieldErrors, setLocalFieldErrors] = useState({});
  const isEdit = mode === "edit";

  useEffect(() => {
    if (open) {
      setForm(buildInitialForm(user));
      setLocalError("");
      setLocalFieldErrors({});
    }
  }, [open, user]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const updateField = (field, value) => {
    setLocalError("");
    setLocalFieldErrors((current) => ({ ...current, [field]: "" }));
    onClearFieldError?.(field);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const getFieldError = (field) => localFieldErrors[field] || fieldErrors[field];

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!isEdit && form.password !== form.confirmPassword) {
      setLocalFieldErrors((current) => ({
        ...current,
        confirmPassword: "Mật khẩu nhập lại không khớp.",
      }));
      return;
    }

    const payload = {
      email: form.email,
      password: form.password,
      name: form.name,
      role: form.role,
      status: form.status,
    };

    if (isEdit && !payload.password) {
      delete payload.password;
    }

    if (isEdit) {
      payload.phone = form.phone.trim() || undefined;
      payload.sex = form.sex === "" ? undefined : Number(form.sex);
      payload.birthday = form.birthday || undefined;
      payload.address = form.address.trim() || undefined;
      payload.job = form.job.trim() || undefined;
      payload.introduction = form.introduction.trim() || undefined;
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center overscroll-contain bg-slate-950/45 px-4 py-4">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[calc(100vh-32px)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="m-0 text-xl font-extrabold text-slate-950">
              {isEdit ? "Sửa người dùng" : "Thêm account"}
            </h2>
            <p className="m-0 mt-1 text-sm font-semibold text-slate-500">
              {isEdit
                ? "Cập nhật tài khoản, profile và trạng thái đăng nhập."
                : "Tạo user local mới kèm profile mặc định."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            aria-label="Đóng modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {(error || localError) && (
          <div className="mx-5 mt-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
            {error || localError}
          </div>
        )}

        <div className="grid gap-4 overflow-y-auto overscroll-contain px-5 py-5 sm:grid-cols-2">
          <label className={labelClass}>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className={inputClass}
              placeholder="account@example.com"
            />
            <FieldError message={getFieldError("email")} />
          </label>

          <label className={labelClass}>
            {isEdit ? "Mật khẩu mới (nếu đổi)" : "Mật khẩu"}
            <input
              type="password"
              required={!isEdit}
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              className={inputClass}
              placeholder={isEdit ? "Để trống nếu không đổi" : "Ít nhất 6 ký tự"}
            />
            <FieldError message={getFieldError("password")} />
          </label>

          <label className={labelClass}>
            Tên profile
            <input
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className={inputClass}
              placeholder="Tên hiển thị"
            />
            <FieldError message={getFieldError("name")} />
          </label>

          {isEdit ? (
            <label className={labelClass}>
              Số điện thoại
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className={inputClass}
              />
              <FieldError message={getFieldError("phone")} />
            </label>
          ) : (
            <label className={labelClass}>
              Nhập lại mật khẩu
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(event) => updateField("confirmPassword", event.target.value)}
                className={inputClass}
                placeholder="Nhập lại mật khẩu"
              />
              <FieldError message={getFieldError("confirmPassword")} />
            </label>
          )}

          <label className={labelClass}>
            Vai trò
            <select
              value={form.role}
              onChange={(event) => updateField("role", event.target.value)}
              className={selectClass}
            >
              <option value={USER_ROLES.STUDENT}>Học viên</option>
              <option value={USER_ROLES.ADMIN}>Quản trị viên</option>
            </select>
            <FieldError message={getFieldError("role")} />
          </label>

          <label className={labelClass}>
            Trạng thái
            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
              className={selectClass}
            >
              <option value={USER_STATUS.ACTIVE}>Hoạt động</option>
              <option value={USER_STATUS.BANNED}>Bị cấm</option>
            </select>
            <FieldError message={getFieldError("status")} />
          </label>

          {isEdit && (
            <>
              <label className={labelClass}>
                Giới tính
                <select
                  value={form.sex}
                  onChange={(event) => updateField("sex", event.target.value)}
                  className={selectClass}
                >
                  <option value="">Chưa chọn</option>
                  <option value="1">Nam</option>
                  <option value="0">Nữ</option>
                </select>
                <FieldError message={getFieldError("sex")} />
              </label>

              <label className={labelClass}>
                Ngày sinh
                <input
                  type="date"
                  value={form.birthday}
                  onChange={(event) => updateField("birthday", event.target.value)}
                  className={inputClass}
                />
                <FieldError message={getFieldError("birthday")} />
              </label>

              <label className={labelClass}>
                Địa chỉ
                <input
                  value={form.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  className={inputClass}
                />
                <FieldError message={getFieldError("address")} />
              </label>

              <label className={labelClass}>
                Nghề nghiệp
                <input
                  value={form.job}
                  onChange={(event) => updateField("job", event.target.value)}
                  className={inputClass}
                />
                <FieldError message={getFieldError("job")} />
              </label>

              <label className={`${labelClass} sm:col-span-2`}>
                Giới thiệu
                <textarea
                  value={form.introduction}
                  onChange={(event) => updateField("introduction", event.target.value)}
                  className="min-h-24 w-full resize-y rounded-lg border-1 border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 hover:border-slate-500 focus:border-slate-700 focus:ring-4 focus:ring-slate-100"
                />
                <FieldError message={getFieldError("introduction")} />
              </label>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {isEdit ? "Lưu thay đổi" : "Tạo user"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminUserModal;
