import { authenticatedFetch } from './authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const TELE_API = `${API_BASE}/telemedicine/api/telemedicine`;

export const getSessionByAppointment = async (appointmentId) => {
    try {
        const res = await authenticatedFetch(`${TELE_API}/sessions/appointment/${appointmentId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch session');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export const getSessions = async () => {
    try {
        const res = await authenticatedFetch(`${TELE_API}/sessions`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch sessions');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export const endSession = async (sessionId) => {
    try {
        const res = await authenticatedFetch(`${TELE_API}/sessions/${sessionId}/end`, {
            method: 'PUT',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to end session');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};
