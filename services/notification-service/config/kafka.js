const { Kafka } = require('kafkajs');
const {
    sendRegistrationSMS,
    sendAppointmentConfirmationSMS,
    sendAppointmentReminderSMS,
} = require('../services/twilioService');
const Notification = require('../models/Notification');

// Format a date value (ISO string or Date) as "2 April 2026"
const formatDate = (value) => {
    if (!value) return value;
    try {
        // Parse as UTC date so "2026-04-02" doesn't roll back a day in negative-offset zones
        const d = new Date(value);
        return d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
        });
    } catch {
        return value;
    }
};

// Format a time value (HH:MM:SS or HH:MM) as "9:00 AM"
const formatTime = (value) => {
    if (!value) return value;
    try {
        const [h, m] = value.toString().split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
        return value;
    }
};

const kafka = new Kafka({
    clientId: 'notification-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

const initializeConsumer = async () => {
    try {
        console.log(`🔗 [Kafka] Connecting to broker: ${process.env.KAFKA_BROKER || 'localhost:9092'}`);
        await consumer.connect();
        console.log('✓ [Kafka] Consumer connected');

        // Subscribe to auth, payment, appointment, and doctor events
        const topics = ['auth-events', 'payment-events', 'appointment-events', 'doctor-events'];
        console.log(`📡 [Kafka] Subscribing to topics:`, topics);

        await consumer.subscribe({
            topics,
            fromBeginning: false,
        });
        console.log('✓ [Kafka] Subscribed to topics');

        // Start consuming messages
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const event = JSON.parse(message.value.toString());
                    console.log(`\n📨 [Kafka] ✓ Received event from ${topic}:`, event);
                    console.log(`   Topic: ${topic}, Partition: ${partition}, Offset: ${message.offset}`);

                    // Handle different event types
                    await handleEvent(event);
                } catch (error) {
                    console.error('❌ [Kafka] Error processing message:', error.message);
                }
            },
        });
        console.log('✓ [Kafka] Consumer running, listening for events...');
    } catch (error) {
        console.error('❌ [Kafka] Failed to initialize Consumer:', error.message);
        process.exit(1);
    }
};

const handleEvent = async (event) => {
    try {
        const { eventType, data } = event;
        console.log(`\n🔄 [Kafka Handler] Processing event type: ${eventType}`);

        switch (eventType) {
            case 'USER_REGISTERED':
                console.log(`   📝 USER_REGISTERED event:`, data);
                if (data.userId) {
                    const notif = await Notification.create({
                        userId: data.userId,
                        type: 'registration',
                        title: 'Welcome to MediConnect',
                        message: 'Your account has been successfully created',
                        data: { email: data.email },
                    });
                    console.log(`   ✓ Created notification:`, notif);
                }
                if (data.phone) {
                    await sendRegistrationSMS(data.phone, data.name);
                } else {
                    console.warn('   ⚠️ USER_REGISTERED event missing phone number — SMS skipped.');
                }
                break;

            case 'USER_LOGIN':
                console.log(`   🔐 USER_LOGIN event:`, data);
                // Login SMS notifications are intentionally skipped to avoid spam
                break;

            case 'USER_PROFILE_UPDATED':
                console.log(`   👤 USER_PROFILE_UPDATED event:`, data);
                // No SMS action needed for profile updates
                break;

            case 'APPOINTMENT_PENDING':
                console.log(`   📋 APPOINTMENT_PENDING event:`, data);
                if (data.patientId) {
                    const notif = await Notification.create({
                        userId: data.patientId,
                        type: 'appointment_pending',
                        title: 'Appointment Request Received',
                        message: `Your appointment request with ${data.doctorName || 'Dr. ...'} on ${formatDate(data.appointmentDate)} at ${formatTime(data.startTime)} is pending approval`,
                        data: {
                            appointmentId: data.appointmentId,
                            doctorName: data.doctorName,
                            appointmentDate: data.appointmentDate,
                        },
                    });
                    console.log(`   ✓ Created pending appointment notification (patient):`, notif);
                }
                // Also notify the doctor about the new booking request
                if (data.doctorId) {
                    const notif = await Notification.create({
                        userId: data.doctorId,
                        type: 'appointment_new_request',
                        title: 'New Appointment Request',
                        message: `${data.patientName || 'A patient'} has requested an appointment on ${formatDate(data.appointmentDate)} at ${formatTime(data.startTime)}`,
                        data: {
                            appointmentId: data.appointmentId,
                            patientName: data.patientName,
                            appointmentDate: data.appointmentDate,
                        },
                    });
                    console.log(`   ✓ Created new request notification (doctor):`, notif);
                }
                break;

            case 'APPOINTMENT_CANCELLED':
                console.log(`   ❌ APPOINTMENT_CANCELLED event:`, data);
                // Notify the doctor that the patient cancelled
                if (data.doctorId) {
                    const notif = await Notification.create({
                        userId: data.doctorId,
                        type: 'appointment_cancelled',
                        title: 'Appointment Cancelled',
                        message: `${data.patientName || 'A patient'} has cancelled their appointment on ${formatDate(data.appointmentDate)} at ${formatTime(data.startTime)}`,
                        data: {
                            appointmentId: data.appointmentId,
                            patientName: data.patientName,
                            appointmentDate: data.appointmentDate,
                        },
                    });
                    console.log(`   ✓ Created cancellation notification (doctor):`, notif);
                }
                // Also confirm to the patient their appointment is cancelled
                if (data.patientId) {
                    const notif = await Notification.create({
                        userId: data.patientId,
                        type: 'appointment_cancelled',
                        title: 'Appointment Cancelled',
                        message: `Your appointment with ${data.doctorName || 'Dr. ...'} on ${formatDate(data.appointmentDate)} at ${formatTime(data.startTime)} has been cancelled`,
                        data: {
                            appointmentId: data.appointmentId,
                            doctorName: data.doctorName,
                            appointmentDate: data.appointmentDate,
                        },
                    });
                    console.log(`   ✓ Created cancellation confirmation notification (patient):`, notif);
                }
                break;

            case 'APPOINTMENT_REJECTED':
                console.log(`   🚫 APPOINTMENT_REJECTED event:`, data);
                if (data.patientId) {
                    const msg = data.reason
                        ? `Your appointment request with ${data.doctorName || 'Dr. ...'} on ${formatDate(data.appointmentDate)} was declined: ${data.reason}`
                        : `Your appointment request with ${data.doctorName || 'Dr. ...'} on ${formatDate(data.appointmentDate)} was declined`;
                    const notif = await Notification.create({
                        userId: data.patientId,
                        type: 'appointment_rejected',
                        title: 'Appointment Request Declined',
                        message: msg,
                        data: {
                            appointmentId: data.appointmentId,
                            doctorName: data.doctorName,
                            appointmentDate: data.appointmentDate,
                        },
                    });
                    console.log(`   ✓ Created rejection notification (patient):`, notif);
                }
                break;

            case 'APPOINTMENT_BOOKED':
                console.log(`   📅 APPOINTMENT_BOOKED event:`, data);
                if (data.patientId) {
                    const notif = await Notification.create({
                        userId: data.patientId,
                        type: 'appointment',
                        title: 'Appointment Confirmed',
                        message: `Your appointment with ${data.doctorName || 'Dr. ...'} is confirmed on ${formatDate(data.appointmentDate)} at ${formatTime(data.startTime)}`,
                        data: {
                            appointmentId: data.appointmentId,
                            doctorName: data.doctorName,
                            appointmentDate: data.appointmentDate,
                        },
                    });
                    console.log(`   ✓ Created appointment notification:`, notif);
                }
                if (data.patientPhone) {
                    await sendAppointmentConfirmationSMS(
                        data.patientPhone,
                        data.patientName || 'Patient',
                        data.doctorName || 'the doctor',
                        data.appointmentDate,
                        data.startTime
                    );
                } else {
                    console.warn('   ⚠️ APPOINTMENT_BOOKED event missing patientPhone — SMS skipped.');
                }
                break;

            case 'APPOINTMENT_REMINDER':
                console.log(`   ⏰ APPOINTMENT_REMINDER event:`, data);
                if (data.patientId) {
                    const notif = await Notification.create({
                        userId: data.patientId,
                        type: 'reminder',
                        title: 'Upcoming Appointment',
                        message: `Reminder: You have an appointment with ${data.doctorName || 'Dr. ...'} on ${formatDate(data.appointmentDate)} at ${formatTime(data.startTime)}`,
                        data: {
                            appointmentId: data.appointmentId,
                            doctorName: data.doctorName,
                            appointmentDate: data.appointmentDate,
                        },
                    });
                    console.log(`   ✓ Created reminder notification:`, notif);
                }
                if (data.patientPhone) {
                    await sendAppointmentReminderSMS(
                        data.patientPhone,
                        data.patientName || 'Patient',
                        data.doctorName || 'the doctor',
                        data.appointmentDate,
                        data.startTime
                    );
                } else {
                    console.warn('   ⚠️ APPOINTMENT_REMINDER event missing patientPhone — SMS skipped.');
                }
                break;

            case 'PAYMENT_COMPLETED':
                console.log(`   💳 PAYMENT_COMPLETED event:`, data);
                if (data.userId) {
                    const notif = await Notification.create({
                        userId: data.userId,
                        type: 'payment',
                        title: 'Payment Successful',
                        message: `Payment of $${data.amount} has been processed successfully`,
                        data: {
                            paymentId: data.paymentId,
                            amount: data.amount,
                        },
                    });
                    console.log(`   ✓ Created payment notification:`, notif);
                }
                break;

            case 'PAYMENT_FAILED':
                console.log(`   ❌ PAYMENT_FAILED event:`, data);
                if (data.userId) {
                    const notif = await Notification.create({
                        userId: data.userId,
                        type: 'payment_failed',
                        title: 'Payment Failed',
                        message: `Payment of $${data.amount} could not be processed. Please try again.`,
                        data: {
                            paymentId: data.paymentId,
                            amount: data.amount,
                            reason: data.reason,
                        },
                    });
                    console.log(`   ✓ Created payment failed notification:`, notif);
                }
                break;

            case 'PRESCRIPTION_ISSUED':
                console.log(`   💊 PRESCRIPTION_ISSUED event:`, data);
                if (data.patientId) {
                    const notif = await Notification.create({
                        userId: data.patientId,
                        type: 'prescription',
                        title: 'New Prescription',
                        message: `A new prescription has been issued by ${data.doctorName || 'Dr. ...'}`,
                        data: {
                            prescriptionId: data.prescriptionId,
                            doctorName: data.doctorName,
                            medicationCount: data.medicationCount,
                        },
                    });
                    console.log(`   ✓ Created prescription notification:`, notif);
                }
                break;

            default:
                console.log(`   ⚠️ Unknown event type: ${eventType}`);
        }
    } catch (error) {
        console.error('❌ [Kafka Handler] Error handling event:', error.message);
    }
};

const disconnectConsumer = async () => {
    await consumer.disconnect();
};

module.exports = {
    initializeConsumer,
    disconnectConsumer,
};
