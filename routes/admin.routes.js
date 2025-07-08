const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');

// Login
router.post('/login', adminController.loginAdmin);

// View all contacts (admin/owner only)
router.get('/contacts', auth, checkRole('admin', 'owner'), adminController.getAllContactQueries);

// Assign user role (owner only)
router.patch('/users/:id/role', auth, checkRole('owner'), adminController.assignRole);

module.exports = router;
