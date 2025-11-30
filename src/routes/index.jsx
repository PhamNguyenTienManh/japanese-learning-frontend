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
import ChatAI from "~/pages/ChatAI";
import Community from "~/pages/Community";
import PostDetail from "~/pages/Community/PostDetail";
import NewPost from "~/pages/Community/NewPost";
import Dashboard from "~/pages/Dashboard";
import Achievements from "~/pages/Dashboard/Achievements";
import Goals from "~/pages/Dashboard/Goals";
import Setting from "~/pages/Dashboard/Setting";
import KanjiLookup from "~/pages/KanjiLookup";
import ResetPassword from "~/pages/auth/ResetPass";
import JLPT from "~/pages/Dictionary/JLPT";
import Reading from "~/pages/Reading";
import ExamReview from "~/pages/ExamReview/ExamReview";
import JLPTFlashcard from "~/pages/Dictionary/JLPT/Flashcards";
import Admin from "~/pages/Admin";
import User from "~/pages/Admin/User";
import DictionaryAdmin from "~/pages/Admin/Dictionary";
import AdminTest from "~/pages/Admin/AdminTest";
import CreateTest from "~/pages/Admin/AdminTest/CreateTest";
import AdminPosts from "~/pages/Admin/AdminPosts";
import AdminReading from "~/pages/Admin/AdminReading";
import EditTest from "~/pages/Admin/AdminTest/UpdateTest";

export const publicRouter = [
  { path: config.routes.home, component: Home },
  { path: config.routes.login, component: LoginPage },
  { path: config.routes.register, component: RegisterPage },
  { path: config.routes.forgotPassword, component: ForgotPasswordPage },
  { path: config.routes.resetPassword, component: ResetPassword },
  { path: config.routes.about, component: About },
  { path: config.routes.dictionary, component: Dictionary },
  { path: config.routes.notebook, component: Notebook },
  { path: config.routes.flashcards, component: Flashcards },
  { path: config.routes.practice, component: Practice },
  { path: config.routes.level, component: TestPage },
  { path: config.routes.test, component: TestRunner },
  { path: config.routes.results, component: Results },
  { path: config.routes.chatAI, component: ChatAI },
  { path: config.routes.community, component: Community },
  { path: config.routes.postDetail, component: PostDetail },
  { path: config.routes.newPost, component: NewPost },
  { path: config.routes.dashboard, component: Dashboard },
  { path: config.routes.achievements, component: Achievements },
  { path: config.routes.goals, component: Goals },
  { path: config.routes.setting, component: Setting },
  { path: config.routes.kanjiLookup, component: KanjiLookup },
  { path: config.routes.jlpt, component: JLPT },
  { path: config.routes.reading, component: Reading },
  { path: config.routes.resultDetail, component: ExamReview },
  { path: config.routes.admin, component: Admin },
  { path: config.routes.user, component: User },
  { path: config.routes.dictionaryAdmin, component: DictionaryAdmin },
  { path: config.routes.adminTest, component: AdminTest },
  { path: config.routes.createTest, component: CreateTest },
  { path: config.routes.adminPosts, component: AdminPosts },
  { path: config.routes.adminReading, component: AdminReading },
  { path: config.routes.jlptFlashcard, component: JLPTFlashcard },
  { path: config.routes.updateTest, component: EditTest },

];
export const requireAuthRouter = [
];

export const privateRouter = [];
