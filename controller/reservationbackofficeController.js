// controller/reservationbackofficeController.js
import Reservation from '../models/reservation.js';

// Get all reservations with pagination
const getAllReservations = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    const startIndex = (page - 1) * limit;
    const total = await Reservation.countDocuments();

    const reservations = await Reservation.find()
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(startIndex)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: reservations.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: reservations
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get single reservation by ID
const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ 
        success: false,
        error: 'Reservation not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Delete reservation by ID
const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);

    if (!reservation) {
      return res.status(404).json({ 
        success: false,
        error: 'Reservation not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: {},
      message: 'Reservation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Export all controller functions
export {
  getAllReservations,
  getReservationById,
  deleteReservation
};