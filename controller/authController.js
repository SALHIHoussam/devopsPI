import { Business, Individual, Association } from '../models/UserRoles.js';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { sendEmail, sendEmailConfirmation } from '../utils/emailService.js';
import { createWelcomeEmail, createPasswordResetEmail } from '../utils/emailTemplates.js'; 
import { businessSchema, individualSchema, associationSchema,passwordSchema } from '../validators/validationSchemas.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import axios from 'axios';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

dotenv.config();

// Generate Access Token
const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });
};

let refreshTokens = [];

// Register User
export const register = async (req, res) => {
    try {
        const { name, email, password, role, ...additionalFields } = req.body;

        let validationSchema;
        if (role === 'business') validationSchema = businessSchema;
        else if (role === 'individual') validationSchema = individualSchema;
        else if (role === 'association') validationSchema = associationSchema;
        else return res.status(400).json({ message: "Invalid user role" });

        const validationResult = validationSchema.safeParse({ name, email, password, role, ...additionalFields });
        if (!validationResult.success) {
            return res.status(400).json({ message: "Validation failed", errors: validationResult.error.errors });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create user (isVerified: false)
        let user;
        if (role === 'business') {
            user = new Business({ name, email, password, role, isVerified: false, ...additionalFields });
        } else if (role === 'individual') {
            user = new Individual({ name, email, password, role, isVerified: false, ...additionalFields });
        } else if (role === 'association') {
            user = new Association({ name, email, password, role, isVerified: false, ...additionalFields });
        }

        // Generate email verification token
        const verificationToken = jwt.sign({ userId: user._id, email }, process.env.EMAIL_SECRET, { expiresIn: '1h' });

        user.emailVerificationToken = verificationToken; // Store the JWT
        user.emailVerificationExpire = Date.now() + 3600000; // Expires in 1 hour
        await user.save();

        // Send email confirmation
        await sendEmailConfirmation(user._id, user.email, verificationToken);

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        refreshTokens.push(refreshToken);

        // Send Welcome Email
        const emailSubject = "Welcome to Our Platform!";
        const emailBody = createWelcomeEmail(name, role);
        await sendEmail(user.email, emailSubject, "Welcome to our platform!", emailBody);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            accessToken,
            refreshToken
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Login User
export const login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        const user = await User.findOne({ email });

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        if (!user.isVerified) {
            return res.status(401).json({ message: "You must confirm your email" });
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: "Your account has been blocked. Please contact support." });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        refreshTokens.push(refreshToken);

        // If "Remember Me" is enabled, send a cookie with the refresh token
        if (rememberMe) {
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            accessToken,
            refreshToken
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Verify Email
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        // Verify token
        const decoded = jwt.verify(token, process.env.EMAIL_SECRET);
        const { userId, email } = decoded;

        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Check if token is still valid (expiration time)
        if (user.emailVerificationExpire < Date.now()) {
            return res.status(400).json({ message: "Token has expired" });
        }

        // Verify email and clear token
        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save();

        // Redirect to a frontend route with a success message
        res.redirect(`${process.env.CLIENT_URL}/email-verified?status=success`);
    } catch (error) {
        res.redirect(`${process.env.CLIENT_URL}/email-verified?status=error&message=${error.message}`);
    }
};

// Refresh Access Token
export const refreshAccessToken = (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken || !refreshTokens.includes(refreshToken)) {
        return res.status(403).json({ message: "Refresh token is invalid" });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: "Token is invalid or expired" });
        res.json({ accessToken: generateAccessToken(decoded.id) });
    });
};

// Logout User
export const logout = (req, res) => {
    refreshTokens = refreshTokens.filter(token => token !== req.body.refreshToken);
    res.status(200).json({ message: "Logged out successfully" });
};

// Get User Profile
export const getUserProfile = async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Verify reCAPTCHA
const verifyRecaptcha = async (recaptchaResponse) => {
    const secretKey = process.env.RECAPTCHA_SECRET;
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

    try {
        const response = await axios.post(url);
        return response.data.success;
    } catch (error) {
        console.error('Error verifying reCAPTCHA:', error);
        return false;
    }
};

// Get All Users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Get User by ID
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Update User with Role-Specific Fields
export const updateUser = async (req, res) => {
    try {
        const { name, email, role, ...updates } = req.body;

        // Log incoming data
        console.log('Incoming update data:', { name, email, role, updates });

        // Fetch the user by ID
        let user = await User.findById(req.params.id);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: "User not found" });
        }

        // Update user fields
        user.name = name || user.name;
        user.email = email || user.email;

        console.log('User after basic fields update:', user);

        // Handle role-specific updates
        if (user.role === 'business' && user instanceof Business) {
            Object.assign(user, updates);
        } else if (user.role === 'individual' && user instanceof Individual) {
            Object.assign(user, updates);
        } else if (user.role === 'association' && user instanceof Association) {
            Object.assign(user, updates);
        } else {
            console.log('Invalid role update');
            return res.status(400).json({ message: "Invalid role update" });
        }

        // Log user before saving
        console.log('User before saving:', user);

        const updatedUser = await user.save();
        
        // Log saved user data
        console.log('Updated user data:', updatedUser);

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error during user update:', error);
        res.status(500).json({ message: "Server error", error });
    }
};

// Forgot Password (send reset link to the user)
export const forgotPassword = async (req, res) => {
    try {
        const { email, recaptchaToken } = req.body;

        // Verify reCAPTCHA
        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) {
            return res.status(400).json({ message: 'reCAPTCHA verification failed. Please try again.' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate reset token and save it to user
        const resetToken = user.generateResetPasswordToken();
        await user.save();

        // Create reset URL
        const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        // Send email with reset link
        const emailSubject = "Password Reset Request";
        const emailBody = createPasswordResetEmail(user.name, resetURL); // Use the imported email template
        await sendEmail(user.email, emailSubject, "Password Reset Request", emailBody);

        res.status(200).json({ message: "Reset link sent to your email" });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Reset Password (user resets their password after clicking the reset link)
export const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        // Validate newPassword with Zod
        const validationResult = passwordSchema.safeParse(newPassword);
        if (!validationResult.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: validationResult.error.errors,
            });
        }

        console.log('Received reset password request with body:', req.body);

        // Hash the reset token and find the user
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: Date.now() } });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Set new password
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: "Password has been reset successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get User Profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Update User Profile
export const updateProfile = async (req, res) => {
    try {
      const { name, email, avatar, ...additionalFields } = req.body;
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Update common fields
      if (name) user.name = name;
      if (email) user.email = email;
      if (avatar) user.avatar = avatar;
  
      // Update role-specific fields
      if (user.role === 'business') {
        user.phone = additionalFields.phone || user.phone;
        user.companyName = additionalFields.companyName || user.companyName;
        user.matricule = additionalFields.matricule || user.matricule;
        user.address = additionalFields.address || user.address;
        user.description = additionalFields.description || user.description;
      } else if (user.role === 'individual') {
        user.phoneNumber = additionalFields.phoneNumber || user.phoneNumber;
        user.address = additionalFields.address || user.address;
      } else if (user.role === 'association') {
        user.organizationName = additionalFields.organizationName || user.organizationName;
        user.address = additionalFields.address || user.address;
      }
  
      const updatedUser = await user.save();
      
      // Return the complete updated user object
      res.status(200).json({
        _id: updatedUser._id,
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        ...(user.role === 'business' && {
          phone: updatedUser.phone,
          companyName: updatedUser.companyName,
          matricule: updatedUser.matricule,
          address: updatedUser.address,
          description: updatedUser.description
        }),
        ...(user.role === 'individual' && {
          phoneNumber: updatedUser.phoneNumber,
          address: updatedUser.address
        }),
        ...(user.role === 'association' && {
          organizationName: updatedUser.organizationName,
          address: updatedUser.address
        })
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

// Change Password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!(await user.matchPassword(currentPassword))) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Validate new password
        const validationResult = passwordSchema.safeParse(newPassword);
        if (!validationResult.success) {
            return res.status(400).json({
                message: "Password validation failed",
                errors: validationResult.error.errors,
            });
        }

        user.password = newPassword;
        await user.save();
        
        res.json({ 
            success: true,
            message: "Password changed successfully" 
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

// Block or Unblock a User
export const blockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { isBlocked } = req.body; // Expecting { isBlocked: true/false } in request body

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.isBlocked = isBlocked; // Update block status
        await user.save();

        res.status(200).json({ message: `User has been ${isBlocked ? 'blocked' : 'unblocked'}` });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Delete User
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        await user.deleteOne();
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Create Admin (for development purposes only)
export const createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if admin already exists
        const adminExists = await User.findOne({ email, role: 'admin' });
        if (adminExists) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        // Create admin user
        const admin = new User({
            name,
            email,
            password,
            role: 'admin',
            isVerified: true // Skip email verification for admin
        });

        await admin.save();

        res.status(201).json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
