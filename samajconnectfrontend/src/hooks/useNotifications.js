import { useContext } from "react";
import { AppContext } from "../context/AppContext";

export function useNotifications() {
  const { 
    notifications, 
    unreadCount, 
    loadingNotifications, 
    notificationDrawerOpen, 
    setNotificationDrawerOpen, 
    refreshNotifications,
    markAllNotificationsRead
  } = useContext(AppContext);

  return {
    notifications,
    unreadCount,
    loading: loadingNotifications,
    isOpen: notificationDrawerOpen,
    setOpen: setNotificationDrawerOpen,
    refresh: refreshNotifications,
    markAllRead: markAllNotificationsRead
  };
}
