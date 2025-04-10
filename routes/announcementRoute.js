import express from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
} from '../controller/announcementController.js';
import { protect, authorize, admin } from '../middleware/authMiddleware.js';
import uploadMiddleware from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Create announcement
router.post(
  '/',
  protect,  // Changed from authMiddleware to protect
  uploadMiddleware.array('images', 5),
  createAnnouncement
);

// Get all announcements with filtering
router.get('/', getAnnouncements);

// Get announcement by ID
router.get('/:id', getAnnouncementById);

// Update announcement
router.put(
  '/:id',
  protect,  // Changed from authMiddleware to protect
  uploadMiddleware.array('images', 5),
  updateAnnouncement
);

// Delete announcement
router.delete(
  '/:id',
  protect,  // Changed from authMiddleware to protect
  admin,    // Added admin middleware for delete protection
  deleteAnnouncement
);

export default router;