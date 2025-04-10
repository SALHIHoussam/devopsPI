import { z } from 'zod';

// Base user schema with advanced validation
const userSchema = z.object({
    name: z.string()
        .trim()
        .min(3, "Name must be at least 3 characters long")
        .max(50, "Name must be less than 50 characters")
        .regex(/^[a-zA-Zà-üÀ-Ü\s]+$/, "Name must contain only letters and spaces"),
    email: z.string()
        .email("Invalid email address")
        .transform(email => email.toLowerCase()), // Normalize email
    password: z.string()
        .trim()
        .min(8, "Password must be at least 8 characters long")
        .max(64, "Password must be less than 64 characters")
        .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, 
               "Password must contain uppercase, lowercase, number, and special character"),
    role: z.enum(["admin", "business", "individual", "association"]),
});

// Business schema with advanced validation
const businessSchema = userSchema.extend({
    phone: z.string()
        .trim()
        .regex(/^\+\d{1,3}\s\d{8,}$/, "Invalid phone number format"), // Accepts international format
    companyName: z.string()
        .trim()
        .min(3, "Company name must be at least 3 characters long")
        .max(100, "Company name must be less than 100 characters"),
    matricule: z.string()
        .trim()
        .regex(/^\d{7}\/[A-HJ-NP-TV-Z]\/[A-Z]\/[A-Z]\/\d{3}$/, 
            "Matricule must follow the format: 7 digits / 1 letter (except I,O,U) / 1 letter / 1 letter / 3 digits"),
    address: z.string()
        .trim()
        .min(10, "Address must be at least 10 characters long")
        .max(200, "Address must be less than 200 characters"),
    description: z.string()
        .trim()
        .max(500, "Description must be less than 500 characters")
        .optional(),
    logo: z.string()
        .trim()
        .url("Invalid logo URL")
        .max(255, "URL is too long")
        .optional(),
    website: z.string()
        .trim()
        .url("Invalid website URL")
        .max(255, "URL is too long")
        .optional(),
    socialMedia: z.string()
        .trim()
        .url("Invalid social media URL")
        .max(255, "URL is too long")
        .optional(),
    businessType: z.enum([
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
        ]),
});

// Individual schema with advanced validation
const individualSchema = userSchema.extend({
    phoneNumber: z.string()
        .trim()
        .regex(/^\+\d{1,3}\s\d{8,}$/, "Invalid phone number format"), // International validation
    address: z.string()
        .trim()
        .min(10, "Address must be at least 10 characters long")
        .max(200, "Address must be less than 200 characters"),
    profilePicture: z.string()
        .trim()
        .url("Invalid profile picture URL")
        .max(255, "URL is too long")
        .optional(),
});

// Association schema with advanced validation
const associationSchema = userSchema.extend({
    organizationName: z.string()
        .trim()
        .min(3, "Organization name must be at least 3 characters long")
        .max(100, "Organization name must be less than 100 characters"),
    address: z.string()
        .trim()
        .min(10, "Address must be at least 10 characters long")
        .max(200, "Address must be less than 200 characters"),
    logo: z.string()
        .trim()
        .url("Invalid logo URL")
        .max(255, "URL is too long")
        .optional(),
    matricule: z.string()
        .trim()
        .regex(/^\d{8}M$/, 'Matricule must be 8 digits followed by M')
});

// Password validation schema
const passwordSchema = z.string()
    .trim()
    .min(8, "Password must be at least 8 characters long")
    .max(64, "Password must be less than 64 characters")
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, 
           "Password must contain uppercase, lowercase, number, and special character");



export { userSchema, businessSchema, individualSchema, associationSchema , passwordSchema};
