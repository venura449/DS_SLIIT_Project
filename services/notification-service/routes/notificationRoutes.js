const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const Notification = require('../models/Notification');

router.get('/', notificationController.getNotifications);
router.post('/', notificationController.sendNotification);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

// Test endpoint - create sample notifications for debugging
router.post('/test/create-sample', async (req, res) => {
    try {
        const userId = req.query.userId || '1';
        const sample = await Notification.create({
            userId,
            type: 'appointment',
            title: 'Test Appointment',
            message: 'This is a test notification from Kafka',
            data: { appointmentId: '123' },
        });
        console.log('✓ Created test notification:', sample);
        res.status(201).json({ success: true, data: sample });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
