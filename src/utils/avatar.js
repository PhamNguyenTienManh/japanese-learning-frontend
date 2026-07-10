const gradientColors = [
  "linear-gradient(135deg, #00879a, #1f9bac)",
  "linear-gradient(135deg, #fc5f00, #ff9800)",
  "linear-gradient(135deg, #7c3aed, #a78bfa)",
  "linear-gradient(135deg, #059669, #34d399)",
  "linear-gradient(135deg, #dc2626, #f87171)",
  "linear-gradient(135deg, #2563eb, #60a5fa)",
  "linear-gradient(135deg, #c026d3, #d946ef)",
  "linear-gradient(135deg, #ca8a04, #facc15)",
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getAvatarGradient(name) {
  return gradientColors[hashString(name || "?") % gradientColors.length];
}

export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const DEFAULT_AVATAR_URL = "/user.png";

export function getAvatarUrl(...urls) {
  return urls.find((url) => {
    if (typeof url !== "string") return false;
    const normalized = url.trim().toLowerCase();
    return normalized && normalized !== "null" && normalized !== "undefined";
  }) || null;
}

export function handleAvatarError(event) {
  const target = event.currentTarget;
  if (target.dataset.fallbacked) return;
  target.dataset.fallbacked = "true";

  const name = target.dataset.name || "?";
  const parent = target.parentNode;
  if (!parent) return;

  const wrapper = document.createElement("span");
  wrapper.className = target.className;
  wrapper.style.cssText = target.style.cssText;
  wrapper.style.background = getAvatarGradient(name);
  wrapper.style.display = "inline-flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.fontWeight = "700";
  wrapper.style.fontSize = target.classList.contains("w-10") || target.classList.contains("h-10") ? "14px" : "12px";
  wrapper.style.color = "#fff";
  wrapper.textContent = getInitials(name);

  target.replaceWith(wrapper);
}
