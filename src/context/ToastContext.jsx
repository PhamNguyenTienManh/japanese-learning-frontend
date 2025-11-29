import React, { useState, useCallback, useContext, createContext, useEffect } from "react";
import classNames from "classnames/bind";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faExclamationCircle, faInfoCircle, faExclamationTriangle, faX } from "@fortawesome/free-solid-svg-icons";
import styles from "./Toast.module.scss";

const cx = classNames.bind(styles);

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type, duration = 3000) => {
    const id = Date.now().toString();
    const toast = { id, message, type, duration };
    setToasts((prev) => [...prev, toast]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

// ---------------- ToastContainer ----------------
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className={cx("toast-container")}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

// ---------------- ToastItem ----------------
function ToastItem({ toast, onClose }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let start = Date.now();
    const duration = toast.duration || 3000;

    const tick = () => {
      const elapsed = Date.now() - start;
      const percent = Math.min((elapsed / duration) * 100, 100);
      setProgress(percent);
      if (percent < 100) {
        requestAnimationFrame(tick);
      } else {
        setIsExiting(true);
        setTimeout(onClose, 300);
      }
    };

    tick();
  }, [toast.duration, onClose]);

  const getIcon = (type) => {
    switch (type) {
      case "success": return faCheckCircle;
      case "error": return faExclamationCircle;
      case "warning": return faExclamationTriangle;
      case "info": return faInfoCircle;
      default: return faInfoCircle;
    }
  };

  return (
    <div className={cx("toast", toast.type, { enter: !isExiting, exit: isExiting })}>
      <div className={cx("icon-wrapper")}>
        <FontAwesomeIcon icon={getIcon(toast.type)} />
      </div>
      <div className={cx("message")}>{toast.message}</div>
      <button className={cx("close-btn")} onClick={onClose}>
        <FontAwesomeIcon icon={faX} />
      </button>
      <div
        className={cx("progress-bar")}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
