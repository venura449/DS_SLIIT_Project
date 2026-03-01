const User = require('../models/User');

/**
 * GET /admin/users
 * List users with search, role filter, status filter, and pagination.
 * Query params: page, limit, search, role, status
 */
const listUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;
        const search = (req.query.search || '').trim();
        const role = (req.query.role || '').trim();
        const status = (req.query.status || '').trim();

        const { users, total } = await User.findAllWithFilters({ search, role, status, limit, offset });

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Admin listUsers error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    }
};

/**
 * GET /admin/users/:id
 * Get a single user by ID.
 */
const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, data: { user } });
    } catch (error) {
        console.error('Admin getUser error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
    }
};

/**
 * PUT /admin/users/:id
 * Update user details (name, phone, role).
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, user_type } = req.body;

        const existing = await User.findById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const VALID_ROLES = ['patient', 'doctor', 'admin'];
        if (user_type && !VALID_ROLES.includes(user_type)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const updated = await User.adminUpdate(id, { name, phone, user_type });
        res.status(200).json({ success: true, message: 'User updated successfully', data: { user: updated } });
    } catch (error) {
        console.error('Admin updateUser error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
    }
};

/**
 * PATCH /admin/users/:id/status
 * Toggle user active/inactive status.
 * Body: { is_active: true/false }
 */
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ success: false, message: 'is_active must be a boolean' });
        }

        const existing = await User.findById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent admin from deactivating themselves
        if (req.user && req.user.id === parseInt(id) && !is_active) {
            return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
        }

        const result = is_active ? await User.activate(id) : await User.deactivate(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
            data: { id, is_active },
        });
    } catch (error) {
        console.error('Admin toggleUserStatus error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user status', error: error.message });
    }
};

module.exports = { listUsers, getUser, updateUser, toggleUserStatus };
