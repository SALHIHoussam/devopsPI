import { body, validationResult } from 'express-validator';

export const registerValidation = [
    body('name')
        .trim()
        .isLength({ min: 3, max: 50 })
        .matches(/^[a-zA-Zà-üÀ-Ü\s]+$/)
        .withMessage('Name must contain only letters and spaces'),
    body('email')
        .isEmail()
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8, max: 64 })
        .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
        .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    body('role')
        .isIn(['admin', 'business', 'individual', 'association'])
        .withMessage('Role must be one of "admin", "business", "individual", "association"'),
];

export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
