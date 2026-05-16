import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "~/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard, faMobile, faWallet, faBuilding,
  faCheck, faShield, faLock, faArrowLeft,
  faChevronRight, faArrowsRotate, faTag,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./Checkout.module.scss";
import { useToast } from "~/context/ToastContext";
import {
  createMomoPayment,
  createStripePayment,
  createVnpayPayment,
} from "~/services/paymentService";

/* ── Brand logo badges ─────────────────────────────────────── */
const BrandVisa = () => (
  <div style={{ width: 38, height: 24, borderRadius: 4, background: '#1a1f71', color: '#fff', fontWeight: 800, fontSize: 10, fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>VISA</div>
);
const BrandMC = () => (
  <div style={{ width: 38, height: 24, borderRadius: 4, background: '#fff', border: '1px solid #e3e9e9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#eb001b', position: 'absolute', left: 6 }} />
    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#f79e1b', position: 'absolute', right: 6, opacity: 0.9 }} />
  </div>
);
const BrandJCB = () => (
  <div style={{ width: 38, height: 24, borderRadius: 4, overflow: 'hidden', display: 'flex', border: '1px solid #e3e9e9' }}>
    <div style={{ flex: 1, background: '#0e4c96', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800 }}>J</div>
    <div style={{ flex: 1, background: '#bf0c26', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800 }}>C</div>
    <div style={{ flex: 1, background: '#0a8744', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800 }}>B</div>
  </div>
);
const BrandMoMo = () => (
  <div style={{ width: 38, height: 24, borderRadius: 4, background: '#a50064', color: '#fff', fontWeight: 800, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>MoMo</div>
);
const BrandVNPay = () => (
  <div style={{ width: 38, height: 24, borderRadius: 4, background: '#005baa', color: '#fff', fontWeight: 800, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>VNPay</div>
);

const METHODS = [
  { id: "card", label: "Thẻ tín dụng / ghi nợ", sub: "Visa · Mastercard · JCB", logos: [BrandVisa, BrandMC, BrandJCB] },
  { id: "momo", label: "Ví MoMo", sub: "Quét QR thanh toán", logos: [BrandMoMo] },
  { id: "vnpay", label: "VNPay", sub: "Liên kết tài khoản hoặc QR", logos: [BrandVNPay] },
];

const PLAN_FEATURES = [
  "AI Chat không giới hạn",
  "Đề thi JLPT N5 → N1",
  "Phân tích chi tiết",
  "Luyện hội thoại",
  "Ưu tiên hỗ trợ",
];

const MONTHLY_PRICE = 249000;
const YEARLY_PRICE = 2390000; // ~20% off

const formatVND = (amount) =>
  `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "Pro";
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [cycle, setCycle] = useState("monthly");
  const [coupon, setCoupon] = useState("");
  const [agree, setAgree] = useState(true);

  const isFree = plan === "Miễn phí";
  const subtotal = cycle === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE;
  const yearlyDiscount = cycle === "yearly" ? MONTHLY_PRICE * 12 - YEARLY_PRICE : 0;
  const total = isFree ? 0 : subtotal;

  const handleProceed = async () => {
    if (!agree && !isFree) return;

    if (isFree) {
      addToast("Bạn đã ở gói Miễn phí.", "info");
      navigate("/");
      return;
    }

    // Tất cả phương thức đều redirect sang cổng thanh toán thật do BE tạo.
    const creators = {
      momo: createMomoPayment,
      vnpay: createVnpayPayment,
      card: createStripePayment,
    };
    const create = creators[method];
    if (!create) {
      addToast("Phương thức thanh toán không hỗ trợ.", "error");
      return;
    }

    setLoading(true);
    try {
      const { paymentUrl } = await create({ cycle });
      if (!paymentUrl) throw new Error("Không nhận được paymentUrl từ máy chủ");
      window.location.href = paymentUrl;
    } catch (err) {
      setLoading(false);
      addToast(err.message || "Không tạo được giao dịch", "error");
    }
  };

  return (
    <div className={styles.wrap}>
      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} /> Quay lại trang gói cước
        </button>
      </div>

      <div className={styles.titleBlock}>
        <h1 className={styles.pageTitle}>Xác nhận thanh toán</h1>
        <p className={styles.pageSubtitle}>
          Hoàn tất thông tin để kích hoạt gói <strong className={styles.accent}>Pro</strong> ngay lập tức.
        </p>
      </div>

      {/* ── Stepper ── */}
      <div className={styles.stepper}>
        {[
          { n: 1, label: "Chọn gói", done: true },
          { n: 2, label: "Thanh toán", active: true },
          { n: 3, label: "Hoàn tất" },
        ].map((s, i, arr) => (
          <div key={s.n} className={styles.stepGroup}>
            <div className={styles.stepItem}>
              <div className={`${styles.stepCircle} ${s.done ? styles.stepDone : ""} ${s.active ? styles.stepActive : ""}`}>
                {s.done ? <FontAwesomeIcon icon={faCheck} style={{ fontSize: 11 }} /> : s.n}
              </div>
              <span className={`${styles.stepLabel} ${s.active ? styles.stepLabelActive : ""}`}>{s.label}</span>
            </div>
            {i < arr.length - 1 && <div className={styles.stepLine} />}
          </div>
        ))}
      </div>

      {/* ── Two-column layout ── */}
      <div className={styles.layout}>
        {/* LEFT – payment method */}
        <div className={styles.left}>
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Phương thức thanh toán</h2>
            <p className={styles.sectionSub}>Chọn cách thanh toán phù hợp nhất với bạn.</p>

            <div className={styles.methods}>
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  className={`${styles.methodItem} ${method === m.id ? styles.methodSelected : ""}`}
                  onClick={() => setMethod(m.id)}
                >
                  <span className={`${styles.radioCircle} ${method === m.id ? styles.radioActive : ""}`}>
                    {method === m.id && <span className={styles.radioDot} />}
                  </span>
                  <span className={styles.methodLogos}>
                    {m.logos.map((Logo, i) => <Logo key={i} />)}
                  </span>
                  <span className={styles.methodInfo}>
                    <span className={styles.methodLabel}>{m.label}</span>
                    <span className={styles.methodDesc}>{m.sub}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Stripe redirect note */}
            {method === "card" && (
              <div className={styles.subPanel}>
                <p className={styles.subPanelTitle}>
                  <FontAwesomeIcon icon={faLock} style={{ fontSize: 11 }} />
                  Thanh toán an toàn qua Stripe
                </p>
                <p style={{ fontSize: 14, color: 'var(--grey-low)', margin: 0 }}>
                  Bạn sẽ được chuyển đến trang thanh toán <strong>Stripe</strong>{" "}
                  để nhập thông tin thẻ. Thông tin thẻ không lưu trên hệ thống của
                  JAVI — Stripe xử lý theo chuẩn PCI DSS.
                </p>
              </div>
            )}

            {/* MoMo QR */}
            {method === "momo" && (
              <div className={styles.subPanel}>
                <div className={styles.qrBox}>
                  <div className={styles.qrGrid}>
                    {Array.from({ length: 144 }).map((_, i) => {
                      const seed = (i * 9301 + 49297) % 233280;
                      const dark = seed / 233280 > 0.5;
                      const r = Math.floor(i / 12), c = i % 12;
                      const corner = (r < 3 && c < 3) || (r < 3 && c > 8) || (r > 8 && c < 3);
                      return <div key={i} className={dark || corner ? styles.qrDark : styles.qrLight} />;
                    })}
                  </div>
                  <p className={styles.qrNote}>Quét QR bằng app <strong>MoMo</strong></p>
                  <p className={styles.qrHint}>Mã hết hạn sau 4:59 · tự động xác nhận</p>
                </div>
              </div>
            )}

            {/* VNPay redirect */}
            {method === "vnpay" && (
              <div className={styles.subPanel}>
                <p style={{ fontSize: 14, color: 'var(--grey-low)' }}>
                  Bạn sẽ được chuyển đến <strong>VNPay</strong> để hoàn tất giao dịch sau khi nhấn <strong>Thanh toán</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Invoice email */}
          <div className={styles.sectionCard} style={{ marginTop: 20 }}>
            <h2 className={styles.sectionTitle}>Hoá đơn điện tử</h2>
            <p className={styles.sectionSub}>Chúng tôi sẽ gửi xác nhận và hoá đơn về email này.</p>
            <input className={styles.input} defaultValue="nguyenvana@email.com" style={{ width: '100%' }} />
          </div>
        </div>

        {/* RIGHT – order summary */}
        <aside className={styles.right}>
          <div className={styles.summaryCard}>
            {/* Gradient header */}
            <div className={styles.summaryHeader}>
              <div className={styles.summaryHeaderTop}>
                <div>
                  <div className={styles.summaryPlanLabel}>Gói đã chọn</div>
                  <div className={styles.summaryPlanName}>JAVI {plan}</div>
                </div>
                <span className={styles.popularBadge}>Phổ biến</span>
              </div>

              {/* Cycle toggle */}
              {!isFree && (
                <div className={styles.cycleToggle}>
                  {[
                    { id: "monthly", label: "Hằng tháng" },
                    { id: "yearly", label: "Hằng năm", save: "−20%" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      className={`${styles.cycleBtn} ${cycle === c.id ? styles.cycleBtnActive : ""}`}
                      onClick={() => setCycle(c.id)}
                    >
                      {c.label}
                      {c.save && (
                        <span className={`${styles.cycleSave} ${cycle === c.id ? styles.cycleSaveActive : ""}`}>
                          {c.save}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Body */}
            <div className={styles.summaryBody}>
              {/* Features */}
              <div className={styles.featureList}>
                {PLAN_FEATURES.map((f) => (
                  <div key={f} className={styles.featureItem}>
                    <span className={styles.featureCheck}>
                      <FontAwesomeIcon icon={faCheck} style={{ fontSize: 9 }} />
                    </span>
                    {f}
                  </div>
                ))}
              </div>

              {/* Coupon */}
              {!isFree && (
                <div className={styles.couponRow}>
                  <div className={styles.couponInputWrap}>
                    <FontAwesomeIcon icon={faTag} className={styles.couponIcon} />
                    <input
                      className={styles.couponInput}
                      placeholder="Mã giảm giá"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                    />
                  </div>
                  <button className={styles.couponBtn}>Áp dụng</button>
                </div>
              )}

              {/* Price breakdown */}
              <div className={styles.breakdown}>
                <div className={styles.breakdownRow}>
                  <span>Tạm tính</span>
                  <span>{formatVND(subtotal)}</span>
                </div>
                {yearlyDiscount > 0 && (
                  <div className={`${styles.breakdownRow} ${styles.breakdownDiscount}`}>
                    <span>Tiết kiệm khi trả năm</span>
                    <span>−{formatVND(yearlyDiscount)}</span>
                  </div>
                )}
                <div className={`${styles.breakdownRow} ${styles.breakdownMuted}`}>
                  <span>Khuyến mãi</span>
                  <span>−0 ₫</span>
                </div>
                <div className={`${styles.breakdownRow} ${styles.breakdownMuted}`}>
                  <span>VAT (0%)</span>
                  <span>0 ₫</span>
                </div>
              </div>

              {/* Total */}
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Tổng thanh toán</span>
                <div className={styles.totalPrice}>
                  <span className={styles.totalAmount}>{formatVND(total)}</span>
                  <span className={styles.totalPer}>/ {cycle === "monthly" ? "tháng" : "năm"}</span>
                </div>
              </div>

              {/* Renewal note */}
              {!isFree && (
                <div className={styles.renewalNote}>
                  <FontAwesomeIcon icon={faArrowsRotate} style={{ flexShrink: 0 }} />
                  <span>Tự động gia hạn ngày 09/06/2026. Bạn có thể huỷ bất kỳ lúc nào.</span>
                </div>
              )}

              {/* Agreement */}
              {!isFree && (
                <label className={styles.agreeRow} onClick={() => setAgree((a) => !a)}>
                  <span className={`${styles.checkbox} ${agree ? styles.checkboxChecked : ""}`}>
                    {agree && <FontAwesomeIcon icon={faCheck} style={{ fontSize: 9, color: '#fff' }} />}
                  </span>
                  <span>
                    Tôi đồng ý với{" "}
                    <a href="#" onClick={(e) => e.preventDefault()} className={styles.agreeLink}>Điều khoản dịch vụ</a>{" "}
                    và{" "}
                    <a href="#" onClick={(e) => e.preventDefault()} className={styles.agreeLink}>Chính sách bảo mật</a>{" "}
                    của JAVI.
                  </span>
                </label>
              )}

              {/* CTA */}
              <button
                className={styles.ctaBtn}
                onClick={handleProceed}
                disabled={loading || (!agree && !isFree)}
              >
                {loading ? "Đang xử lý..." : `Thanh toán ${formatVND(total)}`}
                {!loading && <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 13 }} />}
              </button>

              {/* Trust badges */}
              <div className={styles.trustRow}>
                <span><FontAwesomeIcon icon={faShield} /> SSL 256-bit</span>
                <span className={styles.trustDot} />
                <span><FontAwesomeIcon icon={faLock} /> PCI DSS</span>
                <span className={styles.trustDot} />
                <span>Hoàn tiền 7 ngày</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
