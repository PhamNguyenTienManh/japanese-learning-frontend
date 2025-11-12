import { createContext, useContext, useState } from "react";
import Toast from "~/components/Toast";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = ({ text, type, duration = 5000 }) => {
    setToast({ text, type, duration });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          type={toast.type}
          text={toast.text}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
