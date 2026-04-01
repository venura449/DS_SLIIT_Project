const { Kafka } = require('kafkajs');
const {
    sendRegistrationSMS,
    sendAppointmentConfirmationSMS,
    sendAppointmentReminderSMS,
} = require('../services/twilioService');
const Notification = require('../models/Notification');

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

        // Subscribe to auth, payment, and appointment events
        const topics = ['auth-events', 'payment-events', 'appointment-events'];
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

            case 'APPOINTMENT_BOOKED':
                console.log(`   📅 APPOINTMENT_BOOKED event:`, data);
                if (data.patientId) {
                    const notif = await Notification.create({
                        userId: data.patientId,
                        type: 'appointment',
                        title: 'Appointment Confirmed',
                        message: `Your appointment with ${data.doctorName || 'Dr. ...'} is confirmed on ${data.appointmentDate}`,
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
                        message: `Reminder: You have an appointment with ${data.doctorName || 'Dr. ...'} at ${data.startTime}`,
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
