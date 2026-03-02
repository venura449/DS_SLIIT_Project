const db = require('../config/postgres');
const axios = require('axios');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003';

/* ── helpers ───────────────────────────────────────────────────── */

function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function toDateStr(date) {
    return date.toISOString().split('T')[0];
}

/* ── GET /api/v1/appointments/doctors ──────────────────────────── */
// Proxy: list approved doctors from doctor-service (public)
exports.listDoctors = async (req, res) => {
    try {
        const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/v1/public/doctors`);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Failed to fetch doctors from doctor-service:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
    }
};

/* ── GET /api/v1/appointments/doctors/:doctorId/slots ───────────── */
// Returns doctor's available slots for a week, annotated with isBooked
exports.getDoctorAvailableSlots = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const weekStart = req.query.weekStart || toDateStr(getMonday(new Date()));

        // Fetch available slots from doctor-service
        const response = await axios.get(
            `${DOCTOR_SERVICE_URL}/api/v1/public/doctors/${doctorId}/slots`,
            { params: { weekStart } }
        );

        const { slots = [], scheduleType } = response.data.data || {};

        // Compute the date range for this week
        const monday = new Date(weekStart + 'T00:00:00');
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);

        // Fetch already-booked (non-cancelled) appointments for this doctor this week
        const bookedResult = await db.query(
            `SELECT appointment_date, start_time FROM appointments
             WHERE doctor_id = $1
               AND appointment_date BETWEEN $2 AND $3
               AND status != 'cancelled'`,
            [doctorId, toDateStr(monday), toDateStr(sunday)]
        );

        // Build a Set of "YYYY-MM-DD|HH:MM" for O(1) lookup
        const bookedSet = new Set(
            bookedResult.rows.map(r => {
                const d = new Date(r.appointment_date).toISOString().split('T')[0];
                const t = r.start_time.substring(0, 5);
                return `${d}|${t}`;
            })
        );

        // Annotate each slot with the specific appointment_date and isBooked flag
        const annotated = slots.map(slot => {
            const dow = slot.day_of_week; // 0=Sun, 1=Mon … 6=Sat
            // Calculate offset from Monday
            let offset = dow - 1;           // Mon=0, Tue=1, …, Sat=5
            if (dow === 0) offset = 6;      // Sun=6

            const slotDate = new Date(monday);
            slotDate.setDate(monday.getDate() + offset);
            const appointmentDate = toDateStr(slotDate);
            const startHHMM = slot.start_time.substring(0, 5);
            const isBooked = bookedSet.has(`${appointmentDate}|${startHHMM}`);

            return { ...slot, appointmentDate, isBooked };
        });

        res.status(200).json({
            success: true,
            data: { scheduleType, weekStart, slots: annotated },
        });
    } catch (error) {
        console.error('Error fetching doctor slots:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch slots' });
    }
};

/* ── POST /api/v1/appointments ─────────────────────────────────── */
// Create a booking; enforces one booking per slot via partial unique index
exports.createBooking = async (req, res) => {
    try {
        const patientId = req.user.userId;
        const { doctorId, slotId, appointmentDate, startTime, endTime, reason, doctorName } = req.body;

        if (!doctorId || !appointmentDate || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'doctorId, appointmentDate, startTime, and endTime are required',
            });
        }

        // Pre-check for conflict (clearer error message than DB exception)
        const existing = await db.query(
            `SELECT id FROM appointments
             WHERE doctor_id = $1
               AND appointment_date = $2
               AND start_time = $3
               AND status != 'cancelled'`,
            [doctorId, appointmentDate, startTime]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'This slot has already been booked. Please choose another time.',
            });
        }

        const result = await db.query(
            `INSERT INTO appointments
                (patient_id, doctor_id, slot_id, appointment_date, start_time, end_time, reason, doctor_name, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed')
             RETURNING *`,
            [patientId, doctorId, slotId || null, appointmentDate, startTime, endTime, reason || null, doctorName || null]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'This slot has already been booked. Please choose another time.',
            });
        }
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ── GET /api/v1/appointments ──────────────────────────────────── */
// Patient's own bookings
exports.getMyBookings = async (req, res) => {
    try {
        const patientId = req.user.userId;
        const { status } = req.query;
        const params = [patientId];
        let filterClause = '';

        if (status) {
            filterClause = ` AND status = $2`;
            params.push(status);
        }

        const result = await db.query(
            `SELECT * FROM appointments
             WHERE patient_id = $1${filterClause}
             ORDER BY appointment_date DESC, start_time DESC`,
            params
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ── PUT /api/v1/appointments/:id/cancel ───────────────────────── */
exports.cancelBooking = async (req, res) => {
    try {
        const patientId = req.user.userId;
        const { id } = req.params;

        const result = await db.query(
            `UPDATE appointments
             SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND patient_id = $2 AND status = 'confirmed'
             RETURNING *`,
            [id, patientId]
        );

        if (!result.rows[0]) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found or already cancelled',
            });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
