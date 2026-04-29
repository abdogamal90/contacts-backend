const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/AuthController');

// register
router.post(
	'/register',
	[body('username').isString().notEmpty(), body('password').isLength({ min: 6 })],
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		next();
	},
	authController.register
);

// login
router.post(
	'/login',
	[body('username').isString().notEmpty(), body('password').isString().notEmpty()],
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		next();
	},
	authController.login
);

module.exports = router;
