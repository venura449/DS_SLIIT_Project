const getNotifications = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: 'Get all notifications', data: [] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const sendNotification = async (req, res) => {
    try {
        res.status(201).json({ success: true, message: 'Notification sent', data: req.body });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: `Notification ${req.params.id} marked as read` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { getNotifications, sendNotification, markAsRead };
