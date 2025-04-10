import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';


const options = { discriminatorKey: 'role', collection: 'users' };

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['admin', 'business', 'individual', 'association'], 
        required: true 
    },

    isVerified: { type: Boolean, default: false }, // Email confirmation status
    emailVerificationToken: String, // Token for verifying email
    emailVerificationExpire: Date,  // Expiry for email verification token

    avatar: { type: String },
    createdAt: { type: Date, default: Date.now },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isBlocked: { type: Boolean, default: false },

    notificationPreferences: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: false }
      }
}, options);

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});


// Compare password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


UserSchema.methods.generateEmailVerificationToken = function () {
    const verificationToken = crypto.randomBytes(20).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    this.emailVerificationExpire = Date.now() + 3600000; // Token valid for 1 hour
    return verificationToken;
};


UserSchema.methods.generateResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 3600000; // 1 hour expiry
    return resetToken;
};

const User = mongoose.model('User', UserSchema);
export default User;
