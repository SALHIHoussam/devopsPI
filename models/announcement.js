import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['food', 'event', 'donation', 'workshop', 'community-drive'],
    required: true
  },
  foodType: {
    type: String,
    enum: ['vegetarian', 'vegan', 'meat', 'bakery', 'dairy', 'other'],
    required: function() { return this.category === 'food'; }
  },
  quantity: {
    type: Number,
    required: function() { return this.category === 'food'; }
  },
  unit: {
    type: String,
    enum: ['kg', 'g', 'pieces', 'liters', 'portions'],
    required: function() { return this.category === 'food'; }
  },
  expiryDate: {
    type: Date,
    required: function() { return this.category === 'food'; }
  },
  price: {
    type: Number,
    required: true
  },
  isFree: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    required: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  pickupTime: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  images: [{
    type: String,
    required: true
  }],
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userType: {
    type: String,
    enum: ['business', 'individual', 'association'],
    required: true
  },
  businessDetails: {
    name: String,
    address: String,
    contactNumber: String,
    licenseNumber: String
  },
  individualDetails: {
    dietaryPreferences: [String],
    contactNumber: String
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'completed', 'expired'],
    default: 'available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

announcementSchema.virtual('reservations', {
  ref: 'Reservation',       
  localField: '_id',        
  foreignField: 'announcement', 
  justOne: false
});

announcementSchema.index({ coordinates: '2dsphere' });
announcementSchema.index({ title: 'text', description: 'text', tags: 'text' });

announcementSchema.set('toJSON', { virtuals: true });
announcementSchema.set('toObject', { virtuals: true });


export default mongoose.model('Announcement', announcementSchema);