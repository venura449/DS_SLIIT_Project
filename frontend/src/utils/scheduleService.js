import { authenticatedFetch } from './authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const SCHEDULE_API = `${API_BASE}/doctors/api/v1/schedule`;

export const getSchedule = async (weekStart) => {
    try {
        const url = weekStart ? `${SCHEDULE_API}?weekStart=${weekStart}` : SCHEDULE_API;
        const res = await authenticatedFetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load schedule');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export const setScheduleType = async (scheduleType) => {
    try {
        const res = await authenticatedFetch(`${SCHEDULE_API}/type`, {
            method: 'POST',
            body: JSON.stringify({ scheduleType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update schedule type');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export const addSlot = async ({ dayOfWeek, startTime, endTime, weekStart }) => {
    try {
        const res = await authenticatedFetch(`${SCHEDULE_API}/slots`, {
            method: 'POST',
            body: JSON.stringify({ dayOfWeek, startTime, endTime, weekStart }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to add slot');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export const toggleSlotAvailability = async (slotId, isAvailable) => {
    try {
        const res = await authenticatedFetch(`${SCHEDULE_API}/slots/${slotId}/availability`, {
            method: 'PUT',
            body: JSON.stringify({ isAvailable }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update slot');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export const deleteSlot = async (slotId) => {
    try {
        const res = await authenticatedFetch(`${SCHEDULE_API}/slots/${slotId}`, {
            method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to delete slot');
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export const resetWeek = async (weekStart) => {
    try {
        const res = await authenticatedFetch(`${SCHEDULE_API}/reset-week`, {
            method: 'POST',
            body: JSON.stringify({ weekStart }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to reset week');
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export default { getSchedule, setScheduleType, addSlot, toggleSlotAvailability, deleteSlot, resetWeek };
