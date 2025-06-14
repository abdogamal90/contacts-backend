const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const authToken = require('../middleware/loginMiddleware');
router.get('/', contactController.getContacts);
router.post('/', contactController.createContact);
router.put('/:id', authToken.rbac(['admin']), contactController.updateContact);
router.delete('/:id', authToken.rbac(['admin']), contactController.deleteContact);




module.exports = router;
