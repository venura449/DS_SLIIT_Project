// In-memory notification store (for now)
// In production, this should use MongoDB or another persistent database

let notificationId = 1;
const notificationsStore = new Map();

const Notification = {
    // Create a new notification
    create: async (notificationData) => {
        const id = notificationId++;
        const notification = {
            id,
            userId: notificationData.userId,
            type: notificationData.type, // 'appointment', 'prescription', 'message', 'payment', etc.
            title: notificationData.title,
            message: notificationData.message,
            read: false,
            data: notificationData.data || {},
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        notificationsStore.set(id, notification);
        return notification;
    },

    // Get all notifications for a user
    findByUserId: async (userId) => {
        return Array.from(notificationsStore.values())
            .filter((n) => n.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    // Get unread notifications count for a user
    getUnreadCount: async (userId) => {
        return Array.from(notificationsStore.values()).filter(
            (n) => n.userId === userId && !n.read
        ).length;
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
        const notification = notificationsStore.get(notificationId);
        if (notification) {
            notification.read = true;
            notification.updatedAt = new Date();
        }
        return notification;
    },

    // Mark all notifications as read
    markAllAsRead: async (userId) => {
        const notifications = Array.from(notificationsStore.values()).filter(
            (n) => n.userId === userId
        );
        notifications.forEach((n) => {
            n.read = true;
            n.updatedAt = new Date();
        });
        return notifications;
    },

    // Delete a notification
    delete: async (notificationId) => {
        return notificationsStore.delete(notificationId);
    },

    // Get notification by ID
    findById: async (notificationId) => {
        return notificationsStore.get(notificationId);
    },
};

module.exports = Notification;
