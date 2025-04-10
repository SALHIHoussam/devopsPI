// controller/reservationController.js
import Reservation from '../models/reservation.js';
import Announcement from '../models/announcement.js';
import User from '../models/user.js';
import { sendNotification } from '../services/notificationService.js';


export const createReservation = async (req, res) => {
  try {
    const { announcementId, quantity, message, pickupTime } = req.body;
    const userId = req.user.id;

    // Validate announcement exists and is available
    const announcement = await Announcement.findById(announcementId);
    if (!announcement || announcement.status !== 'available') {
      return res.status(400).json({ error: 'Announcement not available for reservation' });
    }

    // Validate quantity
    if (announcement.category === 'food' && quantity > announcement.quantity) {
      return res.status(400).json({ error: 'Requested quantity exceeds available amount' });
    }

    // Prevent self-reservation
    if (announcement.createdBy.toString() === userId) {
      return res.status(400).json({ error: 'Cannot reserve your own announcement' });
    }

    const reservation = new Reservation({
      announcement: announcementId,
      reserver: userId,
      announcer: announcement.createdBy,
      quantity,
      message,
      pickupTime,
      status: 'pending'
    });

    await reservation.save();

    // Send notification to announcer
    await sendNotification({
      recipient: announcement.createdBy,
      sender: userId,
      type: 'reservation_request',
      relatedEntity: reservation._id,
      message: `New reservation request for your announcement: ${announcement.title}`
    });

    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateReservationStatus = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const reservation = await Reservation.findById(reservationId)
      .populate('announcement')
      .populate('reserver');

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Check if user is the announcer
    if (reservation.announcer.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this reservation' });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['approved', 'rejected'],
      approved: ['completed', 'cancelled'],
      rejected: [],
      completed: [],
      cancelled: []
    };

    if (!validTransitions[reservation.status].includes(status)) {
      return res.status(400).json({ error: 'Invalid status transition' });
    }

    reservation.status = status;
    await reservation.save();

    // Update announcement quantity if approved and it's a food item
    if (status === 'approved' && reservation.announcement.category === 'food') {
      await Announcement.findByIdAndUpdate(
        reservation.announcement._id,
        { $inc: { quantity: -reservation.quantity } }
      );
    }

    // Send notification to reserver
    await sendNotification({
      recipient: reservation.reserver._id,
      sender: userId,
      type: 'reservation_update',
      relatedEntity: reservation._id,
      message: `Your reservation for ${reservation.announcement.title} has been ${status}`
    });

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, status } = req.query;

    let query = {};
    
    if (type === 'requests') {
      // For reservation requests (incoming)
      query.announcer = userId;
    } else {
      // For user's reservations (outgoing)
      query.reserver = userId;
    }

    if (status) {
      query.status = status;
    }

    const reservations = await Reservation.find(query)
      .populate('announcement')
      .populate('reserver', 'name avatar role')
      .populate('announcer', 'name avatar role')
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = req.user.id;

    const reservation = await Reservation.findById(reservationId)
      .populate('announcement');

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Check if user is the reserver
    if (reservation.reserver.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this reservation' });
    }

    // Only pending or approved reservations can be cancelled
    if (!['pending', 'approved'].includes(reservation.status)) {
      return res.status(400).json({ error: 'Cannot cancel a completed or rejected reservation' });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    // Restore announcement quantity if it was approved
    if (reservation.status === 'approved' && reservation.announcement.category === 'food') {
      await Announcement.findByIdAndUpdate(
        reservation.announcement._id,
        { $inc: { quantity: reservation.quantity } }
      );
    }

    // Send notification to announcer
    await sendNotification({
      recipient: reservation.announcer,
      sender: userId,
      type: 'reservation_cancelled',
      relatedEntity: reservation._id,
      message: `Reservation for ${reservation.announcement.title} has been cancelled`
    });

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};