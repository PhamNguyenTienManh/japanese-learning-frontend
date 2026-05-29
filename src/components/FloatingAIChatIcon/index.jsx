import { useEffect, useRef, useState } from "react";
import classNames from "classnames/bind";
import { useLocation, useNavigate } from "react-router-dom";

import config from "~/config";
import styles from "./FloatingAIChatIcon.module.scss";

const cx = classNames.bind(styles);

function FloatingAIChatIcon() {
  const iconRef = useRef(null);
  const idleTimerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isTracking, setIsTracking] = useState(false);

  const isAdminPage = location.pathname.startsWith(config.routes.admin);
  const isTestRunnerPage = /^\/practice\/[^/]+\/test\/[^/]+\/?$/.test(
    location.pathname,
  );
  const shouldHide = isAdminPage || isTestRunnerPage;

  useEffect(() => {
    if (shouldHide) return undefined;

    const handlePointerMove = (event) => {
      const icon = iconRef.current;
      if (!icon) return;

      const rect = icon.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = event.clientX - centerX;
      const deltaY = event.clientY - centerY;
      const distance = Math.hypot(deltaX, deltaY) || 1;
      const maxOffset = 5;

      setEyeOffset({
        x: (deltaX / distance) * maxOffset,
        y: (deltaY / distance) * maxOffset,
      });
      setIsTracking(true);

      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        setEyeOffset({ x: 0, y: 0 });
        setIsTracking(false);
      }, 1800);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.clearTimeout(idleTimerRef.current);
    };
  }, [shouldHide]);

  if (shouldHide) {
    return null;
  }

  const handleClick = () => {
    if (location.pathname !== config.routes.chatAI) {
      navigate(config.routes.chatAI);
    }
  };

  return (
    <button
      ref={iconRef}
      type="button"
      className={cx("trigger", { tracking: isTracking })}
      style={{
        "--eye-x": `${eyeOffset.x}px`,
        "--eye-y": `${eyeOffset.y}px`,
      }}
      onClick={handleClick}
      title="Chat AI"
      aria-label="Mo Chat AI"
    >
      <span className={cx("antenna")} aria-hidden="true" />
      <span className={cx("face")} aria-hidden="true">
        <span className={cx("badge")}>JP</span>
        <span className={cx("eyes")}>
          <span className={cx("eye")}>
            <span className={cx("pupil")} />
          </span>
          <span className={cx("eye")}>
            <span className={cx("pupil")} />
          </span>
        </span>
        <span className={cx("mouth")} />
      </span>
      <span className={cx("tail")} aria-hidden="true" />
    </button>
  );
}

export default FloatingAIChatIcon;
