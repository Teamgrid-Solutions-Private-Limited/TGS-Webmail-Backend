const express = require('express');
const router = express.Router();
const upload = require('../middlewares/fileUpload.middleware');
const { body } = require('express-validator');
const { submitContactForm } = require('../controllers/contact.controller');
const {exportContacts } = require('../controllers/contactExport.controller');

router.post(
  '/',
  upload.array('attachments', 5),
  [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('workEmail').isEmail().withMessage('Valid email is required'),
    body('message').notEmpty().withMessage('Message is required')
  ],
  submitContactForm
);
router.get('/export', exportContacts);

// Instant upload endpoint
router.post('/upload', upload.single('file'), require('../controllers/contact.controller').instantUpload);

module.exports = router;
