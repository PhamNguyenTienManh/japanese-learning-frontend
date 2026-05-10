import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from "react-router-dom";
import { privateRouter, publicRouter, requireAuthRouter } from "./routes";
import { DefaultLayout, AdminLayout } from "~/layouts";
import { Fragment } from "react/jsx-runtime";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useStudyTimeTracker } from "./hooks/useStudyTimeTracker";
import { AdminGuard } from "./utils/authUtils";
import useTextSelection from "./hooks/useTextSelection";
import SelectionIcon from "./components/SelectionIcon";
import TranslateModal from "./components/TranslateModal";
import { translateArgos } from "./services/traslate";
// import { RequireAuth, RequireAdmin } from "~/components/Auth";

function AnimatedRoutes() {
  const location = useLocation();

  useStudyTimeTracker();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);

      // Xóa token khỏi URL để sạch sẽ
      window.history.replaceState({}, document.title, window.location.pathname);

      // Chuyển về trang chủ
      window.location.href = "/";
    }
  }, []);

  // Tách admin routes để gom dưới 1 parent route → AdminLayout không remount
  // khi chuyển giữa các tab admin (sidebar giữ state, không bị flash trắng).
  const adminRoutes = publicRouter.filter((r) => r.path.startsWith("/admin"));
  const nonAdminRoutes = publicRouter.filter(
    (r) => !r.path.startsWith("/admin")
  );

  // Key cho AnimatePresence: trong admin chỉ thay đổi khi rời khỏi admin
  // → animation transition giữa public ↔ admin vẫn chạy, nhưng admin nội bộ
  // không bị remount.
  const routeKey = location.pathname.startsWith("/admin")
    ? "admin"
    : location.pathname;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={routeKey}>
        {nonAdminRoutes.map((route, index) => {
          let Layout = DefaultLayout;
          if (route.layout) {
            Layout = route.layout;
          } else if (route.layout === null) {
            Layout = Fragment;
          }
          const Page = route.component;

          return (
            <Route
              key={index}
              path={route.path}
              element={
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Layout>
                    <Page />
                  </Layout>
                </motion.div>
              }
            />
          );
        })}

        {/* Admin: parent route render AdminLayout 1 lần, các route con dùng <Outlet /> để swap content */}
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout>
                <Outlet />
              </AdminLayout>
            </AdminGuard>
          }
        >
          {adminRoutes.map((route, index) => {
            const Page = route.component;
            // Bỏ prefix "/admin/" để có path tương đối; "/admin" chính nó là index
            const relPath =
              route.path === "/admin"
                ? null
                : route.path.replace(/^\/admin\//, "");
            if (relPath === null) {
              return <Route key={index} index element={<Page />} />;
            }
            return <Route key={index} path={relPath} element={<Page />} />;
          })}
        </Route>
        {/* {privateRouter.map((route, index) => {
          let Layout = DefaultLayout;
          if (route.layout) {
            Layout = route.layout;
          } else if (route.layout === null) {
            Layout = Fragment;
          }
          const Page = route.component;
          return (
            <Route
              key={index}
              path={route.path}
              element={
                <RequireAdmin>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    <Layout>
                      <Page />
                    </Layout>
                  </motion.div>
                </RequireAdmin>
              }
            />
          );
        })}
        {requireAuthRouter.map((route, index) => {
          let Layout = DefaultLayout;
          if (route.layout) {
            Layout = route.layout;
          } else if (route.layout === null) {
            Layout = Fragment;
          }
          const Page = route.component;
          return (
            <Route
              key={index}
              path={route.path}
              element={
                <RequireAuth>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    <Layout>
                      <Page />
                    </Layout>
                  </motion.div>
                </RequireAuth>
              }
            />
          );
        })} */}

      </Routes>
    </AnimatePresence>
  );
}

const JP_REGEX = /[぀-ヿ一-鿿ｦ-ﾝ]/;

function detectLangPair(text) {
  if (JP_REGEX.test(text)) {
    return { source: "ja", target: "vi" };
  }
  return { source: "vi", target: "ja" };
}

function App() {
  const { selection, clearSelection } = useTextSelection();
  const [modalState, setModalState] = useState({
    isOpen: false,
    sourceText: "",
    translatedText: "",
    sourceLang: "ja",
    targetLang: "vi",
    loading: false,
    error: "",
  });

  const handleLookup = async (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed) return;

    const { source, target } = detectLangPair(trimmed);

    setModalState({
      isOpen: true,
      sourceText: trimmed,
      translatedText: "",
      sourceLang: source,
      targetLang: target,
      loading: true,
      error: "",
    });
    clearSelection();

    try {
      const res = await translateArgos(trimmed, source, target);
      const translated = res?.data?.result ?? res?.result ?? "";

      setModalState((prev) => ({
        ...prev,
        translatedText: translated,
        loading: false,
        error: translated ? "" : "Không nhận được kết quả dịch.",
      }));
    } catch (err) {
      setModalState((prev) => ({
        ...prev,
        loading: false,
        error: "Lỗi dịch văn bản. Vui lòng thử lại.",
      }));
    }
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <Router>
      <div className="App">
        <AnimatedRoutes />
        {!modalState.isOpen && (
          <SelectionIcon selection={selection} onClick={handleLookup} />
        )}
        <TranslateModal
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          sourceText={modalState.sourceText}
          translatedText={modalState.translatedText}
          sourceLang={modalState.sourceLang}
          targetLang={modalState.targetLang}
          loading={modalState.loading}
          error={modalState.error}
        />
      </div>
    </Router>
  );
}

export default App;
