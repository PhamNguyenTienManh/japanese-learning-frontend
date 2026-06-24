import config from "~/config";
import About from "~/pages/About";
import ForgotPasswordPage from "~/pages/auth/ForgotPass";
import LoginPage from "~/pages/auth/Login";
import RegisterPage from "~/pages/auth/Register";
import Dictionary from "~/pages/Dictionary";
import Home from "~/pages/home";
import NotebookList from "~/pages/Dictionary/Notebook/NotebookList";
import NotebookDetail from "~/pages/Dictionary/Notebook/NotebookDetail";
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
import Onboarding from "~/pages/Onboarding";
import LearningPathProgress from "~/pages/Dashboard/LearningPathProgress";
import Achievements from "~/pages/Dashboard/Achievements";
import Goals from "~/pages/Dashboard/Goals";
import Setting from "~/pages/Dashboard/Setting";
import KanjiLookup from "~/pages/KanjiLookup";
import Kana from "~/pages/Kana";
import KanaCombinations from "~/pages/KanaCombinations";
import KanaBasics from "~/pages/KanaBasics";
import ResetPassword from "~/pages/auth/ResetPass";
import JLPT from "~/pages/Dictionary/JLPT";
import Reading from "~/pages/Reading";
import ConversationPractice from "~/pages/ConversationPractice";
import ExamReview from "~/pages/ExamReview/ExamReview";
import JLPTFlashcard from "~/pages/Dictionary/JLPT/Flashcards";
import Translate from "~/pages/Translate";
import Payment from "~/pages/Payment";
import PaymentCheckout from "~/pages/Payment/Checkout";
import PaymentSuccess from "~/pages/Payment/Success";
import Admin from "~/pages/Admin";
import User from "~/pages/Admin/User";
import DictionaryAdmin from "~/pages/Admin/Dictionary";
import DictionaryForm from "~/pages/Admin/Dictionary/Form";
import AdminTest from "~/pages/Admin/AdminTest";
import CreateTest from "~/pages/Admin/AdminTest/CreateTest";
import AdminPosts from "~/pages/Admin/AdminPosts";
import Violations from "~/pages/Admin/Violations";
import AdminTransactions from "~/pages/Admin/AdminTransactions";
import AdminReading from "~/pages/Admin/AdminReading";
import AdminConversation from "~/pages/Admin/AdminConversation";
import AdminLearningPaths from "~/pages/Admin/AdminLearningPaths";
import EditTest from "~/pages/Admin/AdminTest/UpdateTest";
import AdminTestStatistics from "~/pages/Admin/AdminTest/Statistics";

export const publicRouter = [
  { path: config.routes.home, component: Home },
  { path: config.routes.login, component: LoginPage, layout: null },
  { path: config.routes.register, component: RegisterPage, layout: null },
  { path: config.routes.forgotPassword, component: ForgotPasswordPage, layout: null },
  { path: config.routes.resetPassword, component: ResetPassword, layout: null },
  { path: config.routes.about, component: About },
  { path: config.routes.dictionary, component: Dictionary },
  { path: config.routes.notebook, component: NotebookList },
  { path: config.routes.flashcardsLegacy, component: Flashcards },
  { path: config.routes.flashcards, component: Flashcards },
  { path: config.routes.notebookDetail, component: NotebookDetail },
  { path: config.routes.practice, component: Practice },
  { path: config.routes.conversationPractice, component: ConversationPractice },
  { path: config.routes.level, component: TestPage },
  { path: config.routes.test, component: TestRunner },
  { path: config.routes.results, component: Results },
  { path: config.routes.chatAI, component: ChatAI },
  { path: config.routes.community, component: Community },
  { path: config.routes.postDetail, component: PostDetail },
  { path: config.routes.newPost, component: NewPost },
  { path: config.routes.dashboard, component: Dashboard },
  { path: config.routes.onboarding, component: Onboarding, layout: null },
  { path: config.routes.learningPathProgress, component: LearningPathProgress },
  { path: config.routes.achievements, component: Achievements },
  { path: config.routes.goals, component: Goals },
  { path: config.routes.setting, component: Setting },
  { path: config.routes.settingLegacy, component: Setting },
  { path: config.routes.kanjiLookup, component: KanjiLookup },
  { path: config.routes.kana, component: Kana },
  { path: config.routes.kanaCombinations, component: KanaCombinations },
  { path: config.routes.kanaBasics, component: KanaBasics },
  { path: config.routes.jlpt, component: JLPT },
  { path: config.routes.reading, component: Reading },
  { path: config.routes.resultDetail, component: ExamReview },
  { path: config.routes.translate, component: Translate },
  { path: config.routes.payment, component: Payment },
  { path: config.routes.paymentCheckout, component: PaymentCheckout },
  { path: config.routes.payment + "/success", component: PaymentSuccess },

  { path: config.routes.admin, component: Admin },
  { path: config.routes.user, component: User },
  { path: config.routes.dictionaryAdmin, component: DictionaryAdmin },
  { path: config.routes.dictionaryAdminAdd, component: DictionaryForm },
  { path: config.routes.dictionaryAdminUpdate, component: DictionaryForm },
  { path: config.routes.adminTest, component: AdminTest },
  { path: config.routes.createTest, component: CreateTest },
  { path: config.routes.adminTestStatistics, component: AdminTestStatistics },
  { path: config.routes.adminPosts, component: AdminPosts },
  { path: config.routes.adminViolations, component: Violations },
  { path: config.routes.adminTransactions, component: AdminTransactions },
  { path: config.routes.adminReading, component: AdminReading },
  { path: config.routes.adminConversation, component: AdminConversation },
  { path: config.routes.adminLearningPaths, component: AdminLearningPaths },
  { path: config.routes.adminLearningPathPlacementNew, component: AdminLearningPaths },
  { path: config.routes.adminLearningPathPlacementEdit, component: AdminLearningPaths },
  { path: config.routes.adminLearningPathDetail, component: AdminLearningPaths },
  { path: config.routes.jlptFlashcard, component: JLPTFlashcard },
  { path: config.routes.updateTest, component: EditTest },

  


];
export const requireAuthRouter = [
];

export const privateRouter = [];
