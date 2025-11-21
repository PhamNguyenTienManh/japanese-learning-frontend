const routes = {
  home: "/",
  login: "/login",
  register: "/signup",
  forgotPassword: "/forgot-password",
  about: "/about",
  dictionary: "/dictionary",
  notebook: "/dictionary/notebook",
  flashcards: "dictionary/notebook/flashcards",
  practice: "/practice",
  level: "/practice/:level",
  test: "/practice/:level/:testId/test",
  results: "/practice/:level/:testId/results",
};

export default routes;
