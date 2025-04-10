// routes/reservationRoute.js
import express from 'express';
import {
  createReservation,
  updateReservationStatus,
  getUserReservations,
  cancelReservation
} from '../controller/reservationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createReservation);
router.get('/', protect, getUserReservations); // Now supports ?type=requests
router.put('/:reservationId/status', protect, updateReservationStatus);
router.put('/:reservationId/cancel', protect, cancelReservation);

export default router;