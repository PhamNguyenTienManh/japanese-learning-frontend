import config from "~/config";
import ForgotPasswordPage from "~/pages/auth/ForgotPass";
import LoginPage from "~/pages/auth/Login";
import RegisterPage from "~/pages/auth/Register";
import Home from "~/pages/home";

export const publicRouter = [
  { path: config.routes.home, component: Home },
  { path: config.routes.login, component: LoginPage },
  { path: config.routes.register, component: RegisterPage },
  { path: config.routes.forgotPassword, component: ForgotPasswordPage },
];

export const privateRoutes = [];
