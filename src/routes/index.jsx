import config from "~/config";
import About from "~/pages/About";
import ForgotPasswordPage from "~/pages/auth/ForgotPass";
import LoginPage from "~/pages/auth/Login";
import RegisterPage from "~/pages/auth/Register";
import Dictionary from "~/pages/Dictionary";
import Home from "~/pages/home";
import Notebook from "~/pages/Dictionary/Notebook";
import Flashcards from "~/pages/Dictionary/Notebook/Flashcards";

export const publicRouter = [
  { path: config.routes.home, component: Home },
  { path: config.routes.login, component: LoginPage },
  { path: config.routes.register, component: RegisterPage },
  { path: config.routes.forgotPassword, component: ForgotPasswordPage },
  { path: config.routes.about, component: About },
  { path: config.routes.dictionary, component: Dictionary },
  { path: config.routes.notebook, component: Notebook },
  { path: config.routes.flashcards, component: Flashcards },
];

export const privateRoutes = [];
