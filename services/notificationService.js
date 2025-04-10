// services/notificationService.js
import Notification from '../models/notification.js';
import User from '../models/user.js';
import { sendEmail } from './emailService.js';

export const sendNotification = async ({ recipient, sender, type, relatedEntity, message }) => {
  try {
    // Create database notification
    const notification = new Notification({
      recipient,
      sender,
      type,
      relatedEntity,
      message,
      read: false
    });
    
    await notification.save();
    
    // Optionally send email notification
    try {
      const user = await User.findById(recipient).select('email notificationPreferences');
      if (user?.notificationPreferences?.email) {
        await sendEmail({
          to: user.email,
          subject: 'New Notification from SustainFood',
          text: message,
          html: `<p>${message}</p>`
        });
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

export const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { $set: { read: true } },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const getUserNotifications = async (userId, limit = 10) => {
  try {
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name avatar');
    return notifications;
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }
};

export const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: userId,
      read: false 
    });
    return count;
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    throw error;
  }
};