// routes/notificationRoute.js
import express from 'express';
import { 
  getNotifications,
  markNotificationAsRead,
  getUnreadNotificationCount 
} from '../controller/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markNotificationAsRead);
router.get('/unread-count', protect, getUnreadNotificationCount);

export default router;