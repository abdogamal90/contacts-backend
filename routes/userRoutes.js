const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/loginMiddleware');

// Validation middleware
const usernameValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username required')
    .isLength({ max: 50 }).withMessage('Username must not exceed 50 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
const passwordValidation = [
  body('oldPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .isLength({ max: 128 }).withMessage('New password must not exceed 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('newPassword').custom((value, { req }) => {
    if (value === req.body.oldPassword) {
      throw new Error('New password must be different from current password');
    }
    return true;
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];
    next();
  }
];

// Get profile
router.get('/profile', verifyToken, userController.getProfile);
// Update username
router.put('/username', verifyToken, usernameValidation, userController.updateUsername);
// Update password
router.put('/password', verifyToken, passwordValidation, userController.updatePassword);

module.exports = router;
