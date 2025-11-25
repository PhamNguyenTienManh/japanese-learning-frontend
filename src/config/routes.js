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
  test: "/practice/:level/test/:testId",
  results: "/practice/:level/results/:testId",
  chatAI: "/chat-ai",
  community: "/community",
  postDetail: "/community/:post",
  newPost: "/community/new",
  dashboard: "/dashboard",
  achievements: "/dashboard/achievements",
  goals: "/dashboard/goals",
  setting: "/dashboard/settings",
};

export default routes;
