// controllers/notificationController.js
import Notification from '../models/notification.js';
import { 
  sendNotification,
  markAsRead,
  getUserNotifications,
  getUnreadCount 
} from '../services/notificationService.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user.id);
    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: error.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id, req.user.id);
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  getNotifications,
  markNotificationAsRead,
  getUnreadNotificationCount
};