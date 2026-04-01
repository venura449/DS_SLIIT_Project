// Notification Service - Frontend utility for interacting with notification API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const getNotifications = async (userId) => {
    try {
        console.log(`📬 [Notifications] Fetching for user: ${userId}`);
        const response = await fetch(`${API_BASE_URL}/notifications/api/notifications?userId=${userId}`);
        const data = await response.json();

        if (!response.ok) {
            console.warn(`⚠️ [Notifications] Response not OK:`, data);
            return { success: false, error: data.error || response.statusText, data: [] };
        }

        console.log(`✓ [Notifications] Fetched ${data.data?.length || 0} notifications`);
        return { success: true, data: data.data || [], unreadCount: data.unreadCount || 0 };
    } catch (error) {
        console.error('❌ [Notifications] Error fetching:', error);
        return { success: false, error: error.message, data: [] };
    }
};

export const markNotificationAsRead = async (notificationId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/api/notifications/${notificationId}/read`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();

        if (!response.ok) {
            console.warn(`⚠️ [Notifications] Failed to mark as read:`, data);
            return { success: false, error: data.error || response.statusText };
        }

        console.log(`✓ [Notifications] Marked ${notificationId} as read`);
        return { success: true, data };
    } catch (error) {
        console.error('❌ [Notifications] Error marking as read:', error);
        return { success: false, error: error.message };
    }
};

export const markAllNotificationsAsRead = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/api/notifications/mark-all-read?userId=${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();

        if (!response.ok) {
            console.warn(`⚠️ [Notifications] Failed to mark all as read:`, data);
            return { success: false, error: data.error || response.statusText };
        }

        console.log(`✓ [Notifications] Marked all as read for user: ${userId}`);
        return { success: true, data };
    } catch (error) {
        console.error('❌ [Notifications] Error marking all as read:', error);
        return { success: false, error: error.message };
    }
};

export const sendNotification = async (notificationData) => {
    try {
        console.log(`📝 [Notifications] Sending notification:`, notificationData);
        const response = await fetch(`${API_BASE_URL}/notifications/api/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationData),
        });
        const data = await response.json();

        if (!response.ok) {
            console.warn(`⚠️ [Notifications] Failed to send:`, data);
            return { success: false, error: data.error || response.statusText };
        }

        console.log(`✓ [Notifications] Sent successfully`);
        return { success: true, data };
    } catch (error) {
        console.error('❌ [Notifications] Error sending:', error);
        return { success: false, error: error.message };
    }
};

// Polling hook for real-time notifications (will be used in React component)
export const startNotificationPolling = (userId, callback, interval = 30000) => {
    const pollNotifications = async () => {
        const result = await getNotifications(userId);
        if (result.success && callback) {
            callback(result.data, result.unreadCount);
        }
    };

    // Initial fetch
    console.log(`🔄 [Notifications] Starting polling every ${interval}ms`);
    pollNotifications();

    // Set up interval
    const intervalId = setInterval(pollNotifications, interval);

    // Return cleanup function
    return () => {
        console.log(`⏹️ [Notifications] Stopping polling`);
        clearInterval(intervalId);
    };
};
