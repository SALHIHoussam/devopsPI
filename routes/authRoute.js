import express from 'express';
import { register, login, refreshAccessToken, logout, getUserProfile, forgotPassword, resetPassword, getProfile, updateProfile, changePassword, verifyEmail, getAllUsers, getUserById, updateUser, deleteUser, blockUser, createAdmin } from '../controller/authController.js';
import { upload, uploadAvatar } from '../controller/uploadController.js';

import { protect } from '../middleware/authMiddleware.js';
import { checkRememberedUser } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/authMiddleware.js';


//Rate Limiting
import rateLimit from 'express-rate-limit';
const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 3, // 3 requêtes par minute
    message: {
        status: 429,
        error: "Too many login attempts",
        message: "You have exceeded the limit of allowed attempts. Please try again in one minute.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const router = express.Router();

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', logout);
router.get('/profile', checkRememberedUser,protect, getUserProfile);
router.post('/create-admin', createAdmin);

router.get('/getProfile', protect, getProfile);
router.put('/updateProfile', protect, updateProfile);
router.post('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword); // POST to trigger forgot password
router.post('/reset-password', resetPassword); // POST to reset password
router.get('/verify-email', verifyEmail);
router.get('/getAllUsers', getAllUsers);
router.get('getUserById/:id', getUserById);
router.put('/updateUser/:id', updateUser);
router.delete('/deleteUser/:id', deleteUser);  
router.put('/block/:id', protect, admin, blockUser);


router.patch(
    '/upload-avatar',
    protect,
    upload.single('avatar'),
    uploadAvatar
  );

export default router;