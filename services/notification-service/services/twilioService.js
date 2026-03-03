const axios = require('axios');

const SMSAPI_BASE = 'https://dashboard.smsapi.lk/api/v3';

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Colombo' });
};

const formatTime = (timeStr) => {
    if (!timeStr) return timeStr;
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};


const normalisePhone = (phone) => {
    if (!phone) return null;
    const digits = phone.replace(/[\s\-+]/g, '');

    if (/^0\d{9}$/.test(digits)) return `94${digits.slice(1)}`; // 07XXXXXXXX
    if (/^94\d{9}$/.test(digits)) return digits;                 // 94XXXXXXXXX
    if (/^\d{9}$/.test(digits)) return `94${digits}`;            // 7XXXXXXXX (no leading 0)

    return null; // unrecognised
};

/**
 * Send an SMS via SMSAPI.LK.
 * @param {string} to   - Recipient phone (any Sri Lankan format)
 * @param {string} body - Message text
 */
const sendSMS = async (to, body) => {
    if (true) {
        console.log(`[SMS DISABLED] To: ${to} | Message: ${body}`);
        return null;
    }

    const apiToken = process.env.SMSAPI_TOKEN;
    const senderId = process.env.SMSAPI_SENDER_ID;

    if (!apiToken || !senderId) {
        console.warn('SMSAPI_TOKEN or SMSAPI_SENDER_ID is not set. Skipping SMS.');
        return null;
    }

    const recipient = normalisePhone(to);
    if (!recipient) {
        console.warn(`Skipping SMS — unrecognised phone number format: "${to}"`);
        return null;
    }

    try {
        const response = await axios.post(
            `${SMSAPI_BASE}/sms/send`,
            { recipient, sender_id: senderId, message: body, type: 'plain' },
            {
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            }
        );

        if (response.data?.status === 'success') {
            console.log(`SMS sent to ${recipient} via SMSAPI.LK`);
        } else {
            console.warn(`SMSAPI.LK returned non-success:`, response.data);
        }
        return response.data;
    } catch (error) {
        const detail = error.response?.data || error.message;
        console.error(`Failed to send SMS to ${recipient}:`, detail);
        throw error;
    }
};

// ------------------------------------------------------------------
// Pre-built message templates
// ------------------------------------------------------------------

const sendRegistrationSMS = async (phone, name) => {
    const body =
        `Welcome to Smart Healthcare, ${name}! ` +
        `Your registration was successful. You can now book appointments with our doctors. ` +
        `Thank you for joining us!`;
    return sendSMS(phone, body);
};

const sendAppointmentConfirmationSMS = async (phone, patientName, doctorName, appointmentDate, startTime) => {
    const body =
        `Hello ${patientName}, your appointment with Dr. ${doctorName} ` +
        `has been booked for ${formatDate(appointmentDate)} at ${formatTime(startTime)}. ` +
        `We will remind you 24 hours before. Smart Healthcare.`;
    return sendSMS(phone, body);
};

const sendAppointmentReminderSMS = async (phone, patientName, doctorName, appointmentDate, startTime) => {
    const body =
        `Reminder: Hello ${patientName}, your appointment with Dr. ${doctorName} ` +
        `is tomorrow — ${formatDate(appointmentDate)} at ${formatTime(startTime)}. ` +
        `Please be on time. Contact us if you need to reschedule. Smart Healthcare.`;
    return sendSMS(phone, body);
};

module.exports = {
    sendSMS,
    sendRegistrationSMS,
    sendAppointmentConfirmationSMS,
    sendAppointmentReminderSMS,
};
