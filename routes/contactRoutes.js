const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const authToken = require('../middleware/loginMiddleware');
const { body, validationResult } = require('express-validator');

// Validation middleware for create/update
const contactValidation = [
  body('name').isString().notEmpty().withMessage('Name is required'),
  body('phone').isString().notEmpty().withMessage('Phone is required'),
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

router.get('/', contactController.getContacts);
router.post('/', contactValidation, contactController.createContact);
router.put('/:id', authToken.rbac(['admin']), contactValidation, contactController.updateContact);
router.delete('/:id', authToken.rbac(['admin']), contactController.deleteContact);

module.exports = router;
