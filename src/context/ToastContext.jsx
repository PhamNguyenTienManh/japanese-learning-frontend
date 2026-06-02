import React, { useState, useCallback, useContext, createContext, useEffect } from "react";
import { createPortal } from "react-dom";
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
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toast = { id, message, type: type || "info", duration };
    setToasts((prev) => [...prev, toast]);
  }, []);

  useEffect(() => {
    const handleAppToast = (event) => {
      const { message, type = "info", duration = 3000 } = event.detail || {};
      if (!message) return;
      addToast(message, type, duration);
    };

    window.addEventListener("app-toast", handleAppToast);
    return () => window.removeEventListener("app-toast", handleAppToast);
  }, [addToast]);

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

function ToastContainer({ toasts, removeToast }) {
  return createPortal(
    <div className={cx("toast-container")}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>,
    document.body
  );
}

function ToastItem({ toast, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 3000;
    const hideTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration);
    const closeTimer = setTimeout(onClose, duration + 260);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(closeTimer);
    };
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
        style={{ animationDuration: `${toast.duration || 3000}ms` }}
      />
    </div>
  );
}
