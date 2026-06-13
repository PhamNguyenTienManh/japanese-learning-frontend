import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames/bind";

import styles from "./GuidedCoachmark.module.scss";

const cx = classNames.bind(styles);

const PADDING = 4;
const TOOLTIP_WIDTH = 320;
const shownTours = new Set();

function normalizePadding(value) {
  if (typeof value === "number") {
    return {
      x: value,
      y: value,
      top: value,
      right: value,
      bottom: value,
      left: value,
    };
  }

  const x = value?.x ?? PADDING;
  const y = value?.y ?? PADDING;

  return {
    x,
    y,
    top: value?.top ?? y,
    right: value?.right ?? x,
    bottom: value?.bottom ?? y,
    left: value?.left ?? x,
  };
}

function expandRadius(value, padding) {
  return value ? `calc(${value} + ${padding}px)` : "16px";
}

function isPointInsideRect(event, rect) {
  return (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
}

function getClickableTarget(target) {
  if (!target) return null;

  const interactiveSelector = [
    "button",
    "a[href]",
    "input",
    "select",
    "textarea",
    "[role='button']",
    "[tabindex]",
  ].join(",");

  return target.matches?.(interactiveSelector)
    ? target
    : target.querySelector?.(interactiveSelector) || target;
}

function rectsAreClose(first, second) {
  if (!first || !second) return false;

  return (
    Math.abs(first.top - second.top) < 1 &&
    Math.abs(first.left - second.left) < 1 &&
    Math.abs(first.width - second.width) < 1 &&
    Math.abs(first.height - second.height) < 1
  );
}

function getElementRect(target) {
  if (!target) return null;

  const nextRect = target.getBoundingClientRect();
  if (nextRect.width <= 0 || nextRect.height <= 0) return null;

  const style = window.getComputedStyle(target);

  return {
    top: nextRect.top,
    right: nextRect.right,
    bottom: nextRect.bottom,
    left: nextRect.left,
    width: nextRect.width,
    height: nextRect.height,
    radius: {
      topLeft: style.borderTopLeftRadius,
      topRight: style.borderTopRightRadius,
      bottomRight: style.borderBottomRightRadius,
      bottomLeft: style.borderBottomLeftRadius,
    },
  };
}

function getTooltipPosition(rect, placement, tooltipOffset) {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const centerX = rect.left + rect.width / 2;
  const left = Math.min(
    Math.max(centerX, TOOLTIP_WIDTH / 2 + 16),
    viewportWidth - TOOLTIP_WIDTH / 2 - 16,
  );

  if (placement === "top") {
    return {
      left,
      top: Math.max(16, rect.top - 18),
      transform: "translate(-50%, -100%)",
    };
  }

  if (placement === "left") {
    return {
      left: Math.max(16, rect.left - tooltipOffset),
      top: Math.min(Math.max(rect.top + rect.height / 2, 72), viewportHeight - 72),
      transform: "translate(-100%, -50%)",
    };
  }

  if (placement === "right") {
    return {
      left: Math.min(viewportWidth - 16, rect.right + tooltipOffset),
      top: Math.min(Math.max(rect.top + rect.height / 2, 72), viewportHeight - 72),
      transform: "translate(0, -50%)",
    };
  }

  return {
    left,
    top: Math.min(viewportHeight - 16, rect.bottom + 18),
    transform: "translate(-50%, 0)",
  };
}

function shouldScrollToTarget(rect) {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const margin = 96;

  return (
    rect.top < margin ||
    rect.left < margin ||
    rect.bottom > viewportHeight - margin ||
    rect.right > viewportWidth - margin
  );
}

function GuidedCoachmark({
  targetRef,
  scrollTargetRef,
  tourKey,
  message,
  placement = "bottom",
  pointerAnchor = "center",
  pointerOffsetX = 0,
  pointerOffsetY = 0,
  fingerDirection,
  spotlightPadding = PADDING,
  tooltipOffset,
  onDismiss,
  showOnce = true,
}) {
  const [rect, setRect] = useState(null);
  const [visible, setVisible] = useState(false);
  const hasShownRef = useRef(false);
  const dismissedRef = useRef(false);

  const updateRect = useCallback(() => {
    const nextRect = getElementRect(targetRef?.current);
    if (!nextRect) return false;

    setRect(nextRect);
    return true;
  }, [targetRef]);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    const shouldHide = onDismiss?.() !== false;

    if (!shouldHide) {
      window.setTimeout(() => {
        dismissedRef.current = false;
      }, 0);
      return;
    }

    setVisible(false);
  }, [onDismiss]);

  const handleLayerPointerDown = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleLayerClick = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();

    const shouldForwardToTarget = rect && isPointInsideRect(event, rect);
    dismiss();

    if (!shouldForwardToTarget) return;

    const target = getClickableTarget(targetRef?.current);
    window.setTimeout(() => target?.click?.(), 0);
  }, [dismiss, rect, targetRef]);

  useEffect(() => {
    if (!targetRef?.current || !tourKey || !message) return undefined;
    if (hasShownRef.current || (showOnce && shownTours.has(tourKey))) return undefined;

    const scrollTarget = scrollTargetRef?.current || targetRef.current;
    const initialRect = scrollTarget.getBoundingClientRect();
    if (scrollTargetRef?.current || shouldScrollToTarget(initialRect)) {
      scrollTarget.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }

    let frameId = 0;
    let lastRect = null;
    let stableFrames = 0;

    const showWhenStable = () => {
      const nextRect = getElementRect(targetRef.current);

      if (nextRect && rectsAreClose(nextRect, lastRect)) {
        stableFrames += 1;
      } else {
        stableFrames = 0;
      }

      lastRect = nextRect;

      if (nextRect && stableFrames >= 3) {
        setRect(nextRect);
        hasShownRef.current = true;
        dismissedRef.current = false;
        if (showOnce) shownTours.add(tourKey);
        setVisible(true);
        return;
      }

      frameId = window.requestAnimationFrame(showWhenStable);
    };

    const showTimer = window.setTimeout(
      showWhenStable,
      scrollTargetRef?.current || shouldScrollToTarget(initialRect) ? 520 : 180
    );

    return () => {
      window.clearTimeout(showTimer);
      window.cancelAnimationFrame(frameId);
    };
  }, [message, scrollTargetRef, showOnce, targetRef, tourKey]);

  useEffect(() => {
    if (!visible || !tourKey || !showOnce) return;

    shownTours.add(tourKey);
  }, [showOnce, tourKey, visible]);

  useEffect(() => {
    if (!visible) return undefined;

    updateRect();
  }, [scrollTargetRef, targetRef, updateRect, visible]);

  useEffect(() => {
    if (!visible) return undefined;

    const body = document.body;
    const html = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyTouchAction = body.style.touchAction;
    const previousHtmlTouchAction = html.style.touchAction;
    const preventScroll = (event) => event.preventDefault();

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    body.style.touchAction = "none";
    html.style.touchAction = "none";
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
      body.style.touchAction = previousBodyTouchAction;
      html.style.touchAction = previousHtmlTouchAction;
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;

    const handlePositionChange = () => updateRect();

    window.addEventListener("resize", handlePositionChange);
    window.addEventListener("scroll", handlePositionChange, true);

    return () => {
      window.removeEventListener("resize", handlePositionChange);
      window.removeEventListener("scroll", handlePositionChange, true);
    };
  }, [updateRect, visible]);

  useEffect(() => {
    if (!visible) return undefined;

    const handleKeyDown = (event) => {
      event.preventDefault();
      event.stopPropagation();
      dismiss();
    };

    const attachTimer = window.setTimeout(() => {
      document.addEventListener("keydown", handleKeyDown, true);
    }, 0);

    return () => {
      window.clearTimeout(attachTimer);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [dismiss, visible]);

  if (!visible || !rect || typeof document === "undefined") return null;

  const padding = normalizePadding(spotlightPadding);
  const spotlightStyle = {
    left: rect.left - padding.left,
    top: rect.top - padding.top,
    width: rect.width + padding.left + padding.right,
    height: rect.height + padding.top + padding.bottom,
    borderTopLeftRadius: expandRadius(rect.radius?.topLeft, Math.max(padding.left, padding.top)),
    borderTopRightRadius: expandRadius(rect.radius?.topRight, Math.max(padding.right, padding.top)),
    borderBottomRightRadius: expandRadius(rect.radius?.bottomRight, Math.max(padding.right, padding.bottom)),
    borderBottomLeftRadius: expandRadius(rect.radius?.bottomLeft, Math.max(padding.left, padding.bottom)),
  };
  const resolvedTooltipOffset =
    tooltipOffset ?? (placement === "right" ? 34 : 18);
  const tooltipStyle = getTooltipPosition(rect, placement, resolvedTooltipOffset);
  const pointerStyle = {
    left:
      pointerAnchor === "right-edge"
        ? rect.right + pointerOffsetX
        : pointerAnchor === "left-edge"
          ? rect.left + pointerOffsetX
          : rect.left + rect.width / 2 + pointerOffsetX,
    top: rect.top + rect.height / 2 + pointerOffsetY,
  };
  const resolvedFingerDirection = fingerDirection || placement;

  return createPortal(
    <div
      className={cx("layer")}
      aria-live="polite"
      onPointerDown={handleLayerPointerDown}
      onClick={handleLayerClick}
    >
      <div className={cx("spotlight")} style={spotlightStyle} />
      <div
        className={cx("finger", placement, resolvedFingerDirection)}
        style={pointerStyle}
        aria-hidden="true"
      >
        ☝
      </div>
      <div className={cx("tooltip", placement)} style={tooltipStyle}>
        <span className={cx("badge")}>Gợi ý</span>
        <p>{message}</p>
        <small>Chạm bất kỳ đâu để ẩn hướng dẫn.</small>
      </div>
    </div>,
    document.body,
  );
}

export default GuidedCoachmark;
