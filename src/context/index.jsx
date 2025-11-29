// AppProviders.jsx
import { AuthProvider } from "./AuthContext";
import { ToastProvider } from "./ToastContext";
import { GlobalModalProvider } from "./GlobalModalContext";
export default function AppProviders({ children }) {
  return (
    <GlobalModalProvider>
      <ToastProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ToastProvider>
    </GlobalModalProvider>
  );
}
