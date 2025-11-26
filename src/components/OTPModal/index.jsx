import { useState, useEffect } from "react";

function OTPModal({ email, onClose, onVerify }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); 
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newOtp = pastedData.split("").filter((char) => /^\d$/.test(char));
    
    if (newOtp.length === 6) {
      setOtp(newOtp);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError("Vui lòng nhập đủ 6 số");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await onVerify(otpCode);
    } catch (err) {
      setError(err.message || "Mã OTP không đúng");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.getElementById("otp-0")?.focus();
  }, []);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <div style={styles.content}>
          <h2 style={styles.title}>Xác thực Email</h2>
          <p style={styles.description}>
            Mã OTP đã được gửi đến email
            <strong> {email}</strong>
          </p>

          <form onSubmit={handleSubmit}>
            <div style={styles.otpInputs} onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  style={{
                    ...styles.otpInput,
                    ...(isLoading && styles.otpInputDisabled),
                  }}
                  disabled={isLoading}
                />
              ))}
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...styles.submitBtn,
                ...(isLoading && styles.submitBtnDisabled),
              }}
            >
              {isLoading ? "Đang xác thực..." : "Xác nhận"}
            </button>
          </form>

          <p style={styles.resendText}>
            Không nhận được mã?
            <button
              type="button"
              style={styles.resendBtn}
              disabled={isLoading}
              onClick={() => alert("Chức năng gửi lại OTP sẽ được cập nhật")}
            >
              Gửi lại
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    animation: "fadeIn 0.2s ease",
  },
  modal: {
    background: "white",
    borderRadius: "16px",
    padding: "32px",
    maxWidth: "440px",
    width: "90%",
    position: "relative",
    animation: "slideUp 0.3s ease",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
  },
  closeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "transparent",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#666",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    textAlign: "center",
  },
  title: {
    fontSize: "24px",
    marginBottom: "8px",
    color: "#1a1a1a",
  },
  description: {
    color: "#666",
    marginBottom: "32px",
    fontSize: "15px",
  },
  otpInputs: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    marginBottom: "24px",
  },
  otpInput: {
    width: "56px",
    height: "56px",
    border: "2px solid #e0e0e0",
    borderRadius: "12px",
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "600",
    transition: "all 0.2s",
    outline: "none",
  },
  otpInputDisabled: {
    backgroundColor: "#f5f5f5",
    cursor: "not-allowed",
  },
  error: {
    color: "#e74c3c",
    fontSize: "14px",
    marginBottom: "16px",
    marginTop: "-8px",
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#4a90e2",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  submitBtnDisabled: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  },
  resendText: {
    marginTop: "24px",
    fontSize: "14px",
    color: "#666",
  },
  resendBtn: {
    background: "none",
    border: "none",
    color: "#4a90e2",
    fontWeight: "600",
    cursor: "pointer",
    marginLeft: "4px",
    padding: "0",
  },
};

export default OTPModal;