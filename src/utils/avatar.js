export const DEFAULT_AVATAR_URL = "/user.png";

export function getAvatarUrl(...urls) {
  return urls.find((url) => typeof url === "string" && url.trim()) || DEFAULT_AVATAR_URL;
}

export function handleAvatarError(event) {
  if (event.currentTarget.src.endsWith(DEFAULT_AVATAR_URL)) return;
  event.currentTarget.src = DEFAULT_AVATAR_URL;
}
