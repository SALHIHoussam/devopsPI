import jwt from 'jsonwebtoken';
import User from '../models/user.js';

//  Protect Route Middleware
export const protect = async (req, res, next) => {
    let token = req.headers.authorization;

    if (token && token.startsWith("Bearer ")) {
        token = token.split(" ")[1]; // Extract token after "Bearer"
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password'); // Remove password field
            if (!req.user) {
                return res.status(404).json({ message: "User not found" });
            }
            next();
        } catch (error) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
    } else {
        return res.status(401).json({ message: "No token, authorization denied" });
    }
};

// Role-Based Access Control Middleware
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Not authorized for this action" });
        }
        next();
    };
};
export const checkRememberedUser = async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;  // Vérifie le cookie du refresh token

    if (refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            req.user = user;
            next();
        } catch (err) {
            return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
        }
    } else {
        next();
    }
};


export const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admins only." });
    }
};



