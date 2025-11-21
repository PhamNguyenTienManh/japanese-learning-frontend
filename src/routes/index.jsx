import config from "~/config";
import About from "~/pages/About";
import ForgotPasswordPage from "~/pages/auth/ForgotPass";
import LoginPage from "~/pages/auth/Login";
import RegisterPage from "~/pages/auth/Register";
import Dictionary from "~/pages/Dictionary";
import Home from "~/pages/home";
import Notebook from "~/pages/Dictionary/Notebook";
import Flashcards from "~/pages/Dictionary/Notebook/Flashcards";
import Practice from "~/pages/Practice";
import TestPage from "~/pages/Practice/TestPage";
import TestRunner from "~/pages/Practice/TestPage/TestRunner";
import Results from "~/pages/Practice/TestPage/Results";

export const publicRouter = [
  { path: config.routes.home, component: Home },
  { path: config.routes.login, component: LoginPage },
  { path: config.routes.register, component: RegisterPage },
  { path: config.routes.forgotPassword, component: ForgotPasswordPage },
  { path: config.routes.about, component: About },
  { path: config.routes.dictionary, component: Dictionary },
  { path: config.routes.notebook, component: Notebook },
  { path: config.routes.flashcards, component: Flashcards },
  { path: config.routes.practice, component: Practice },
  { path: config.routes.level, component: TestPage },
  { path: config.routes.test, component: TestRunner },
  { path: config.routes.results, component: Results },
];

export const privateRoutes = [];
