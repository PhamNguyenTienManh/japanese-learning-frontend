import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCheck, faTrash } from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames/bind";
import { useNavigate } from "react-router-dom";

import Button from "~/components/Button";
import notificationService from "~/services/notificationService";
import { useAuth } from "~/context/AuthContext";
import styles from "./notificationDropdown.module.scss";

const cx = classNames.bind(styles);

function NotificationDropdown({ isOpen, onToggle, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { userId } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (userId) {
      loadNotifications();
    }
  }, [userId]);

  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(userId);

      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount(userId);
      if (response.success) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      // Nếu API getUnreadCount chưa có, tính từ notifications
      const unread = notifications.filter(n => !n.isRead).length;
      setUnreadCount(unread);
      console.error("Lỗi khi tải số thông báo chưa đọc:", error);
    }
  };

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();

    // Cập nhật state ngay lập tức
    setNotifications(prevNotifications =>
      prevNotifications.map(notif =>
        notif._id === notificationId
          ? { ...notif, isRead: true }
          : notif
      )
    );

    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc:", error);
      loadNotifications();
    }
  };



  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();

    setNotifications(prevNotifications =>
      prevNotifications.filter(notif => notif._id !== notificationId)
    );

    try {
      await notificationService.deleteNotification(notificationId);
    } catch (error) {
      console.error("Lỗi khi xóa thông báo:", error);
      loadNotifications();
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif._id === notification._id
            ? { ...notif, isRead: true }
            : notif
        )
      );

      notificationService.markAsRead(notification._id).catch(error => {
        console.error("Lỗi khi đánh dấu đã đọc:", error);
      });
    }

    if (notification.targetId) {
      navigate(`/community/${notification.targetId}`);
    }

    onClose();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); 

    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;

    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className={cx("notification-wrapper")} ref={dropdownRef}>
      <Button className={"notification"} onClick={onToggle}>
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 && (
          <span className={cx("badge")}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </Button>

      {isOpen && (
        <div className={cx("dropdown")}>
          <div className={cx("dropdown-header")}>
            <h3>Thông báo</h3>
          </div>

          <div className={cx("dropdown-body")}>
            {loading ? (
              <div className={cx("loading")}>Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className={cx("empty")}>
                <FontAwesomeIcon icon={faBell} size="3x" />
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              <div className={cx("notification-list")}>
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={cx("notification-item", {
                      unread: !notification.isRead,
                    })}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={cx("notification-content")}>
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className={cx("time")}>
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>

                    <div className={cx("notification-actions")}>
                      {!notification.isRead && (
                        <button
                          className={cx("action-btn")}
                          onClick={(e) => handleMarkAsRead(notification._id, e)}
                          title="Đánh dấu đã đọc"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                      )}
                      <button
                        className={cx("action-btn", "delete")}
                        onClick={(e) => handleDeleteNotification(notification._id, e)}
                        title="Xóa thông báo"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;