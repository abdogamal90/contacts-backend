const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const authToken = require('../middleware/loginMiddleware');
const { body, validationResult } = require('express-validator');

// Validation middleware for create/update
const contactValidation = [
  body('name').isString().notEmpty().withMessage('Name is required'),
  // replace the existing numeric‐only check with a mobile‐phone validator
  body('phone').notEmpty().withMessage('Phone is required').isMobilePhone('any', { strictMode: false }).withMessage('Invalid phone number'),
  body('address').isString().notEmpty().withMessage('Address is required'),
  body('notes').optional().isString(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

router.get('/', contactController.getContacts).post('/', contactValidation, contactController.createContact);
router.put('/:id', contactValidation, contactController.updateContact).delete('/:id', contactController.deleteContact);

module.exports = router;
