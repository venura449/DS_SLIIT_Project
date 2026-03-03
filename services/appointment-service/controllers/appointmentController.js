const db = require('../config/postgres');
const axios = require('axios');
const { sendAppointmentEvent } = require('../config/kafka');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003';
const TELEMEDICINE_SERVICE_URL = process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:3005';

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

        const response = await axios.get(
            `${DOCTOR_SERVICE_URL}/api/v1/public/doctors/${doctorId}/slots`,
            { params: { weekStart } }
        );

        const { slots = [], scheduleType } = response.data.data || {};

        const monday = new Date(weekStart + 'T00:00:00');
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);

        const bookedResult = await db.query(
            `SELECT appointment_date, start_time FROM appointments
             WHERE doctor_id = $1
               AND appointment_date BETWEEN $2 AND $3
               AND status != 'cancelled'`,
            [doctorId, toDateStr(monday), toDateStr(sunday)]
        );

        const bookedSet = new Set(
            bookedResult.rows.map(r => {
                const d = new Date(r.appointment_date).toISOString().split('T')[0];
                const t = r.start_time.substring(0, 5);
                return `${d}|${t}`;
            })
        );

        const annotated = slots.map(slot => {
            const dow = slot.day_of_week;
            let offset = dow - 1;
            if (dow === 0) offset = 6;

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
exports.createBooking = async (req, res) => {
    try {
        const patientId = req.user.userId;
        const { doctorId, slotId, appointmentDate, startTime, endTime, reason, doctorName, patientName, isTelemedicine } = req.body;
        let { patientPhone } = req.body;

        if (!doctorId || !appointmentDate || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'doctorId, appointmentDate, startTime, and endTime are required',
            });
        }

        // Resolve patientPhone from auth-service if not provided by the frontend
        if (!patientPhone) {
            try {
                const userRes = await axios.get(
                    `${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/api/v1/internal/users/${patientId}`
                );
                patientPhone = userRes.data?.data?.phone || null;
            } catch (err) {
                console.warn('Could not resolve patientPhone from auth-service:', err.message);
            }
        }

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
                (patient_id, doctor_id, slot_id, appointment_date, start_time, end_time, reason, doctor_name, patient_name, patient_phone, status, is_telemedicine)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11)
             RETURNING *`,
            [patientId, doctorId, slotId || null, appointmentDate, startTime, endTime, reason || null, doctorName || null, patientName || null, patientPhone || null, isTelemedicine === true]
        );

        const appointment = result.rows[0];

        // Publish event so notification-service can send confirmation SMS
        await sendAppointmentEvent('APPOINTMENT_BOOKED', {
            appointmentId: appointment.id,
            patientId: appointment.patient_id,
            doctorId: appointment.doctor_id,
            patientName: appointment.patient_name,
            patientPhone: appointment.patient_phone,
            doctorName: appointment.doctor_name,
            appointmentDate: appointment.appointment_date,
            startTime: appointment.start_time,
            status: appointment.status,
        });

        res.status(201).json({ success: true, data: appointment });
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
             WHERE id = $1 AND patient_id = $2 AND status IN ('pending','confirmed')
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

/* ── GET /api/v1/appointments/doctor ───────────────────────────── */
exports.getDoctorAppointments = async (req, res) => {
    try {
        const doctorId = req.user.userId;
        const { filter } = req.query;
        const today = new Date().toISOString().split('T')[0];

        let whereExtra = '';
        if (filter === 'today') {
            whereExtra = ` AND appointment_date = '${today}'`;
        } else if (filter === 'upcoming') {
            whereExtra = ` AND appointment_date >= '${today}'`;
        }

        const result = await db.query(
            `SELECT * FROM appointments
             WHERE doctor_id = $1 AND status != 'cancelled'${whereExtra}
             ORDER BY appointment_date ASC, start_time ASC`,
            [doctorId]
        );

        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ── PUT /api/v1/appointments/:id/approve ──────────────────────── */
exports.approveAppointment = async (req, res) => {
    try {
        const doctorId = req.user.userId;
        const { id } = req.params;

        const result = await db.query(
            `UPDATE appointments
             SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND doctor_id = $2 AND status = 'pending'
             RETURNING *`,
            [id, doctorId]
        );

        if (!result.rows[0]) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found or not in pending state',
            });
        }

        const approved = result.rows[0];

        // Publish confirmation event so notification-service can send SMS to patient
        await sendAppointmentEvent('APPOINTMENT_BOOKED', {
            appointmentId: approved.id,
            patientId: approved.patient_id,
            doctorId: approved.doctor_id,
            patientName: approved.patient_name,
            patientPhone: approved.patient_phone,
            doctorName: approved.doctor_name,
            appointmentDate: approved.appointment_date,
            startTime: approved.start_time,
            status: approved.status,
        });

        // If this is a telemedicine appointment, create a session in telemedicine service
        if (approved.is_telemedicine) {
            try {
                await axios.post(`${TELEMEDICINE_SERVICE_URL}/api/telemedicine/sessions`, {
                    appointmentId: approved.id,
                    patientId: approved.patient_id,
                    doctorId: approved.doctor_id,
                });
            } catch (err) {
                console.error('Failed to create telemedicine session:', err.message);
                // Non-fatal — approval still succeeds
            }
        }

        res.status(200).json({ success: true, data: approved });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ── POST /api/v1/appointments/:id/messages ────────────────────── */
exports.sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const senderId = req.user.userId;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message cannot be empty' });
        }

        const appt = await db.query(
            'SELECT patient_id, doctor_id FROM appointments WHERE id = $1',
            [id]
        );
        if (!appt.rows[0]) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        const { patient_id, doctor_id } = appt.rows[0];
        if (senderId !== patient_id && senderId !== doctor_id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const senderRole = senderId === doctor_id ? 'doctor' : 'patient';

        const result = await db.query(
            `INSERT INTO appointment_messages (appointment_id, sender_id, sender_role, message)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [id, senderId, senderRole, message.trim()]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ── GET /api/v1/appointments/:id/messages ─────────────────────── */
exports.getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const appt = await db.query(
            'SELECT patient_id, doctor_id FROM appointments WHERE id = $1',
            [id]
        );
        if (!appt.rows[0]) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        const { patient_id, doctor_id } = appt.rows[0];
        if (userId !== patient_id && userId !== doctor_id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const result = await db.query(
            `SELECT * FROM appointment_messages WHERE appointment_id = $1 ORDER BY sent_at ASC`,
            [id]
        );

        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
