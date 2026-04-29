const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { verifyToken } = require('../middleware/loginMiddleware');
const { body, validationResult, query } = require('express-validator');

// Validation middleware for create/update
const contactValidation = [
  body('name').isString().notEmpty().withMessage('Name is required'),
  // replace the existing numeric‐only check with a mobile‐phone validator
  body('phone').notEmpty().withMessage('Phone is required').isMobilePhone('any', { strictMode: false }).withMessage('Invalid phone number'),
  body('address').isString().notEmpty().withMessage('Address is required'),
  body('notes').optional().isString(),
  body('tags').optional().isArray().withMessage('tags must be an array'),
  body('category').optional().isIn(['personal','work','family','business','other']).withMessage('Invalid category'),
  body('isFavorite').optional().isBoolean().withMessage('isFavorite must be boolean'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation for tag update
const tagUpdateValidation = [
  body('add').optional().isArray().withMessage('add must be an array of tags'),
  body('remove').optional().isArray().withMessage('remove must be an array of tags'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Query validation for filtering/sorting
const filterQueryValidation = [
  query('tagLogic').optional().isIn(['AND','OR']).withMessage('tagLogic must be AND or OR'),
  query('sortBy').optional().isIn(['name','createdAt','updatedAt']).withMessage('Invalid sortBy field'),
  query('sortOrder').optional().isIn(['asc','desc']).withMessage('sortOrder must be asc or desc'),
  query('category').optional().isIn(['personal','work','family','business','other']).withMessage('Invalid category'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Routes
// Enhanced GET /contacts supports search, tags, category, isFavorite, sorting, pagination
router.get('/', verifyToken, filterQueryValidation, contactController.getContacts);

// Favorites
router.get('/favorites', verifyToken, contactController.getFavorites);
router.patch('/:id/favorite', verifyToken, contactController.toggleFavorite);

// Tags
router.get('/tags', verifyToken, contactController.getTags);
router.patch('/:id/tags', verifyToken, tagUpdateValidation, contactController.updateTags);

// Categories
router.get('/categories/:category', verifyToken, contactController.getByCategory);

// Advanced filter alias (optional)
router.get('/filter', verifyToken, filterQueryValidation, contactController.getContacts);

// Standard CRUD (create/update/delete) with new validation
router.post('/', verifyToken, contactValidation, contactController.createContact);
router.put('/:id', verifyToken, contactValidation, contactController.updateContact);
router.delete('/:id', verifyToken, contactController.deleteContact);

module.exports = router;
