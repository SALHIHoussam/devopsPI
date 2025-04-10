import express from 'express';
import {
  getAllAnnouncements,
  deleteAnnouncement,
  updateAnnouncement
} from '../controller/announcementControllerBackOffice.js';

const router = express.Router();

// Define the routes
router.get('/', getAllAnnouncements); // Get all announcements
router.delete('/:id', deleteAnnouncement); // Delete an announcement by ID
router.put('/:id', updateAnnouncement); // Update an announcement by ID

export default router;
