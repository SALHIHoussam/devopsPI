import Announcement from '../models/announcement.js';
import User from '../models/user.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { validateAnnouncement } from '../validators/announcementValidationSchemas.js';

// Helper function to calculate distance between two points
function calculateDistance(point1, point2) {
  const [lng1, lat1] = point1.map(Number);
  const [lng2, lat2] = point2.map(Number);
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

export const createAnnouncement = async (req, res) => {
  try {
    // First handle file uploads if any
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.path);
          imageUrls.push(result.secure_url);
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          throw new Error('Failed to upload one or more images');
        }
      }
    }

    // Parse coordinates - handle both FormData and JSON formats
    let coordinates;
    try {
      if (req.body.coordinates && typeof req.body.coordinates === 'string') {
        coordinates = JSON.parse(req.body.coordinates);
      } else if (req.body['coordinates[type]']) {
        coordinates = {
          type: req.body['coordinates[type]'] || 'Point',
          coordinates: [
            parseFloat(req.body['coordinates[coordinates][0]']),
            parseFloat(req.body['coordinates[coordinates][1]'])
          ]
        };
      } else if (req.body.coordinates && typeof req.body.coordinates === 'object') {
        coordinates = req.body.coordinates;
      } else {
        throw new Error('Missing or invalid coordinates format');
      }

      // Validate coordinates structure
      if (!coordinates.type || !coordinates.coordinates || !Array.isArray(coordinates.coordinates)) {
        throw new Error('Invalid coordinates structure');
      }

      // Validate coordinate values
      const [lng, lat] = coordinates.coordinates.map(Number);
      if (isNaN(lng) || isNaN(lat)) {
        throw new Error('Coordinate values must be numbers');
      }
      if (lng < -180 || lng > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
      if (lat < -90 || lat > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }

      coordinates.coordinates = [lng, lat];
    } catch (coordError) {
      console.error('Coordinate parsing error:', coordError);
      return res.status(400).json({ 
        error: 'Invalid coordinates',
        details: coordError.message 
      });
    }

    // Prepare announcement data
    const announcementData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      price: req.body.isFree === 'true' ? 0 : parseFloat(req.body.price),
      isFree: req.body.isFree === 'true',
      location: req.body.location,
      coordinates,
      pickupTime: {
        start: req.body['pickupTime[start]'] || req.body.pickupTime?.start,
        end: req.body['pickupTime[end]'] || req.body.pickupTime?.end
      },
      userType: req.body.userType,
      tags: Array.isArray(req.body.tags) ? req.body.tags : 
           (req.body.tags ? [req.body.tags] : []),
      images: imageUrls
    };

    if (req.body.category === 'food') {
      announcementData.foodType = req.body.foodType;
      announcementData.quantity = parseFloat(req.body.quantity);
      announcementData.unit = req.body.unit;
      announcementData.expiryDate = req.body.expiryDate;
    }

    const { error: validationError } = validateAnnouncement(announcementData);
    if (validationError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationError.details.map(d => d.message) 
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const announcement = new Announcement({
      ...announcementData,
      createdBy: userId,
      userType: user.role
    });

    if (user.role === 'business') {
      announcement.businessDetails = {
        name: user.businessName,
        address: user.address,
        contactNumber: user.contactNumber,
        licenseNumber: user.licenseNumber
      };
    } else if (user.role === 'individual') {
      announcement.individualDetails = {
        dietaryPreferences: user.dietaryPreferences,
        contactNumber: user.contactNumber
      };
    }

    await announcement.save();
    
    res.status(201).json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully'
    });

  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const { 
      category, 
      foodType, 
      minPrice, 
      maxPrice, 
      distance, 
      longitude, 
      latitude, 
      search, 
      sortBy,
      userType 
    } = req.query;

    let query = { status: 'available' };
    
    if (category) query.category = category;
    if (foodType) query.foodType = foodType;
    if (userType) query.userType = userType;
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
    }

    let geoQuery = {};
    if (longitude && latitude && distance) {
      geoQuery = {
        coordinates: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number(longitude), Number(latitude)]
            },
            $maxDistance: Number(distance) * 1000
          }
        }
      };
    }

    const finalQuery = { ...query, ...geoQuery };

    let sortOptions = { createdAt: -1 };
    if (sortBy === 'price-asc') sortOptions = { price: 1 };
    if (sortBy === 'price-desc') sortOptions = { price: -1 };

    const announcements = await Announcement.find(finalQuery)
      .sort(sortOptions)
      .populate('createdBy', 'name avatar role')
      .lean();

    if (longitude && latitude) {
      announcements.forEach(announcement => {
        if (announcement.coordinates) {
          announcement.distance = calculateDistance(
            [longitude, latitude],
            announcement.coordinates.coordinates
          );
        }
      });
    }

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAnnouncementById = async (req, res) => {
  try {
    // Validate ID format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid announcement ID format' });
    }

    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name avatar role rating')
      .populate({
        path: 'reservations',
        populate: [
          {
            path: 'reserver',
            select: 'name avatar'
          },
          {
            path: 'announcer',
            select: 'name avatar'
          }
        ]
      });
      
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const userId = req.user.id;
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    if (announcement.createdBy.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this announcement' });
    }
    
    let imageUrls = announcement.images;
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path);
        imageUrls.push(result.secure_url);
      }
    }
    
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { ...req.body, images: imageUrls, updatedAt: Date.now() },
      { new: true }
    );
    
    res.json(updatedAnnouncement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const userId = req.user.id;
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    if (announcement.createdBy.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this announcement' });
    }
    
    await announcement.remove();
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};