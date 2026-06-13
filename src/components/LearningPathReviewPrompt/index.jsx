import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import PopupModal from "~/components/Popup";
import config from "~/config";
import { useAuth } from "~/context/AuthContext";
import { reviewLearningPath } from "~/services/learningPathService";

const promptedKey = (userId) => `learningPathReviewPrompted:${userId}`;

function LearningPathReviewPrompt() {
  const { isLoggedIn, userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const activeUserRef = useRef(null);
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      activeUserRef.current = null;
      checkingRef.current = false;
      setVisible(false);
      return;
    }

    if (activeUserRef.current === userId || checkingRef.current) return;

    const storageKey = promptedKey(userId);
    if (sessionStorage.getItem(storageKey) === "true") return;

    activeUserRef.current = userId;
    checkingRef.current = true;

    reviewLearningPath()
      .then(() => {
        sessionStorage.setItem(storageKey, "true");
        setVisible(true);
      })
      .catch((err) => {
        activeUserRef.current = null;
        console.error("Failed to auto review learning path:", err);
      })
      .finally(() => {
        checkingRef.current = false;
      });
  }, [isLoggedIn, userId]);

  const handleConfirm = () => {
    setVisible(false);
    if (location.pathname !== config.routes.learningPathProgress) {
      navigate(config.routes.learningPathProgress);
    }
  };

  const handleCancel = () => {
    setVisible(false);
  };

  return (
    <PopupModal
      visible={visible}
      title="Đánh giá lộ trình đã sẵn sàng"
      message="Bạn có muốn xem đánh giá lộ trình học của mình không?"
      confirmText="OK"
      cancelText="Không"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}

export default LearningPathReviewPrompt;
