const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');
const { listUsers, getUser, updateUser, toggleUserStatus } = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(authMiddleware, adminMiddleware);

/**
 * @route  GET /admin/users
 * @desc   List all users (search, filter, pagination)
 * @access Admin
 */
router.get('/users', listUsers);

/**
 * @route  GET /admin/users/:id
 * @desc   Get a single user by ID
 * @access Admin
 */
router.get('/users/:id', getUser);

/**
 * @route  PUT /admin/users/:id
 * @desc   Update user details (name, phone, role)
 * @access Admin
 */
router.put('/users/:id', updateUser);

/**
 * @route  PATCH /admin/users/:id/status
 * @desc   Activate or deactivate a user
 * @access Admin
 */
router.patch('/users/:id/status', toggleUserStatus);

module.exports = router;
