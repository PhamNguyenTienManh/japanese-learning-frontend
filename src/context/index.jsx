// AppProviders.jsx
import { AuthProvider } from "./AuthContext";
import { ToastProvider } from "./ToastContext";


export default function AppProviders({ children }) {
  return (

    <ToastProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ToastProvider>

  );
}
