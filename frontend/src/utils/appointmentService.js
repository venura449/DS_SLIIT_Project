import { authenticatedFetch } from './authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const APPT_API = `${API_BASE}/appointments/api/v1/appointments`;

/* ── Doctor browse (public — no token needed) ──────────────────── */

export const listDoctors = async () => {
    try {
        const res = await fetch(`${APPT_API}/doctors`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch doctors');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export const getDoctorSlots = async (doctorId, weekStart) => {
    try {
        const url = weekStart
            ? `${APPT_API}/doctors/${doctorId}/slots?weekStart=${weekStart}`
            : `${APPT_API}/doctors/${doctorId}/slots`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch slots');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

/* ── Booking management (authenticated) ───────────────────────── */

export const createBooking = async ({ doctorId, slotId, appointmentDate, startTime, endTime, reason, doctorName, patientName }) => {
    try {
        const res = await authenticatedFetch(APPT_API, {
            method: 'POST',
            body: JSON.stringify({ doctorId, slotId, appointmentDate, startTime, endTime, reason, doctorName, patientName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to create booking');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export const getMyBookings = async (status) => {
    try {
        const url = status ? `${APPT_API}?status=${status}` : APPT_API;
        const res = await authenticatedFetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch bookings');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export const cancelBooking = async (id) => {
    try {
        const res = await authenticatedFetch(`${APPT_API}/${id}/cancel`, { method: 'PUT' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to cancel booking');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

/* ── Doctor-facing (authenticated) ────────────────────────────── */

export const getDoctorAppointments = async (filter) => {
    try {
        const url = filter ? `${APPT_API}/doctor?filter=${filter}` : `${APPT_API}/doctor`;
        const res = await authenticatedFetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch appointments');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export const approveAppointment = async (id) => {
    try {
        const res = await authenticatedFetch(`${APPT_API}/${id}/approve`, { method: 'PUT' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to approve appointment');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export const getMessages = async (appointmentId) => {
    try {
        const res = await authenticatedFetch(`${APPT_API}/${appointmentId}/messages`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch messages');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export const sendMessage = async (appointmentId, message) => {
    try {
        const res = await authenticatedFetch(`${APPT_API}/${appointmentId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ message }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to send message');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};
