import { useState } from "react";
import { getAvatarGradient, getAvatarUrl, getInitials } from "~/utils/avatar";

function UserAvatar({
  name,
  src,
  alt,
  className = "",
  fallbackClassName = "",
  style,
  fallbackStyle,
}) {
  const displayName = name || "Người dùng";
  const avatarUrl = getAvatarUrl(src);
  const [imageFailed, setImageFailed] = useState(false);
  const sharedClassName = fallbackClassName || className;

  if (avatarUrl && !imageFailed) {
    return (
      <img
        src={avatarUrl}
        alt={alt || displayName}
        className={className}
        style={style}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span
      className={sharedClassName}
      style={{
        ...style,
        ...fallbackStyle,
        background: getAvatarGradient(displayName),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
      }}
      aria-label={alt || displayName}
      role="img"
    >
      {getInitials(displayName)}
    </span>
  );
}

export default UserAvatar;
