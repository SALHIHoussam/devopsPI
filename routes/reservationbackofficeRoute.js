// routes/reservationbackofficeRoute.js
import express from 'express';
import { 
  getAllReservations,
  getReservationById,
  deleteReservation
} from '../controller/reservationbackofficeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes for reservation management
router.route('/')
  .get(protect, admin, getAllReservations);

router.route('/:id')
  .get(protect, admin, getReservationById)
  .delete(protect, admin, deleteReservation);

export default router;