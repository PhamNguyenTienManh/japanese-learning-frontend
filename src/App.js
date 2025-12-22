import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { privateRouter, publicRouter, requireAuthRouter } from "./routes";
import { DefaultLayout } from "~/layouts";
import { Fragment } from "react/jsx-runtime";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useStudyTimeTracker } from "./hooks/useStudyTimeTracker";
import { AdminGuard } from "./utils/authUtils";
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

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {publicRouter.map((route, index) => {
          let Layout = DefaultLayout;
          if (route.layout) {
            Layout = route.layout;
          } else if (route.layout === null) {
            Layout = Fragment;
          }
          const Page = route.component;
          if (route.path.startsWith("/admin")) {
            return (
              <Route
                key={index}
                path={route.path}
                element={
                  <AdminGuard>
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
                  </AdminGuard>
                }
              />
            );
          }

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

function App() {
  return (
    <Router>
      <div className="App">
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;
