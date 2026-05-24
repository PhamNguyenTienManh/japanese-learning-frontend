export function isFutureDate(value) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > Date.now();
}

function getNestedUser(source) {
  if (!source || typeof source !== "object") return null;
  if (source.user && typeof source.user === "object") return source.user;
  if (source.userId && typeof source.userId === "object") return source.userId;
  return null;
}

export function extractPremiumState(source = {}, fallback = {}) {
  const nestedUser = getNestedUser(source);
  const premiumExpiredDate =
    source.premiumExpiredDate ||
    source.premium_expired_date ||
    nestedUser?.premiumExpiredDate ||
    nestedUser?.premium_expired_date ||
    fallback.premiumExpiredDate ||
    fallback.premium_expired_date ||
    null;
  const premiumDate =
    source.premiumDate ||
    source.premium_date ||
    nestedUser?.premiumDate ||
    nestedUser?.premium_date ||
    fallback.premiumDate ||
    fallback.premium_date ||
    null;
  const explicitPremium =
    source.isPremium ??
    source.premium ??
    nestedUser?.isPremium ??
    nestedUser?.premium ??
    fallback.isPremium ??
    false;

  return {
    isPremium: premiumExpiredDate
      ? isFutureDate(premiumExpiredDate)
      : Boolean(explicitPremium),
    premiumDate,
    premiumExpiredDate,
  };
}

export function formatPremiumExpiry(value) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
