import mongoose from 'mongoose';
import User from './user.js'; // Import the base User model

// Business Schema (Extends User)
const BusinessSchema = new mongoose.Schema({
    phone: { type: String, required: true },
    companyName: { type: String, required: true },  
    matricule: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String },
    logo: { type: String },
    website: { type: String },
    socialMedia: { type: String },
    businessType: { 
        type: String,
        enum: [
            'bakery',
            'pastry-shop',
            'dairy-producer',
            'supermarket',
            'grocery-store',
            'farmers-market',
            'restaurant',
            'hotel',
            'catering-service',
            'convenience-store',
            'food-manufacturer',
            'wholesaler',
            'cafe',
            'school-cafeteria',
            'hospital-cafeteria',
            'corporate-cafeteria',
            'food-truck',
            'butcher-shop',
            'fish-market',
            'other'
        ],
        required: true
    }
});
export const Business = User.discriminator('business', BusinessSchema);

// Individual Schema (Extends User)
const IndividualSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    profilePicture: { type: String }
});
export const Individual = User.discriminator('individual', IndividualSchema);

// Association Schema (Extends User)
const AssociationSchema = new mongoose.Schema({
    organizationName: { type: String, required: true },
    address: { type: String, required: true },
    logo: { type: String },
    matricule: { 
        type: String,
        required: true,
        match: [/^\d{8}M$/, 'Matricule must be 8 digits followed by M']
    }
});
export const Association = User.discriminator('association', AssociationSchema); 











