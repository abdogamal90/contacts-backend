const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/loginMiddleware');

// Validation middleware
const usernameValidation = [
  body('username').isString().notEmpty().withMessage('Username required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

const passwordValidation = [
  body('oldPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
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
