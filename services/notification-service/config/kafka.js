const { Kafka } = require('kafkajs');
const {
    sendRegistrationSMS,
    sendAppointmentConfirmationSMS,
    sendAppointmentReminderSMS,
} = require('../services/twilioService');

const kafka = new Kafka({
    clientId: 'notification-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

const initializeConsumer = async () => {
    try {
        await consumer.connect();
        console.log('Notification Service Kafka Consumer connected');

        // Subscribe to auth, payment, and appointment events
        await consumer.subscribe({
            topics: ['auth-events', 'payment-events', 'appointment-events'],
            fromBeginning: false,
        });

        // Start consuming messages
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const event = JSON.parse(message.value.toString());
                    console.log(`Received event from ${topic}:`, event);

                    // Handle different event types
                    await handleEvent(event);
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            },
        });
    } catch (error) {
        console.error('Failed to initialize Kafka Consumer:', error);
        process.exit(1);
    }
};

const handleEvent = async (event) => {
    try {
        const { eventType, data } = event;

        switch (eventType) {
            case 'USER_REGISTERED':
                console.log('Handling user registration event:', data);
                if (data.phone) {
                    await sendRegistrationSMS(data.phone, data.name);
                } else {
                    console.warn('USER_REGISTERED event missing phone number — SMS skipped.');
                }
                break;

            case 'USER_LOGIN':
                console.log('Handling user login event:', data);
                // Login SMS notifications are intentionally skipped to avoid spam
                break;

            case 'USER_PROFILE_UPDATED':
                console.log('Handling user profile updated event:', data);
                // No SMS action needed for profile updates
                break;

            case 'APPOINTMENT_BOOKED':
                console.log('Handling appointment booked event:', data);
                if (data.patientPhone) {
                    await sendAppointmentConfirmationSMS(
                        data.patientPhone,
                        data.patientName || 'Patient',
                        data.doctorName || 'the doctor',
                        data.appointmentDate,
                        data.startTime
                    );
                } else {
                    console.warn('APPOINTMENT_BOOKED event missing patientPhone — SMS skipped.');
                }
                break;

            case 'APPOINTMENT_REMINDER':
                console.log('Handling appointment reminder event:', data);
                if (data.patientPhone) {
                    await sendAppointmentReminderSMS(
                        data.patientPhone,
                        data.patientName || 'Patient',
                        data.doctorName || 'the doctor',
                        data.appointmentDate,
                        data.startTime
                    );
                } else {
                    console.warn('APPOINTMENT_REMINDER event missing patientPhone — SMS skipped.');
                }
                break;

            case 'PAYMENT_COMPLETED':
                console.log('Handling payment completed event:', data);
                break;

            case 'PAYMENT_FAILED':
                console.log('Handling payment failed event:', data);
                break;

            default:
                console.log('Unknown event type:', eventType);
        }
    } catch (error) {
        console.error('Error handling event:', error);
    }
};

const disconnectConsumer = async () => {
    await consumer.disconnect();
};

module.exports = {
    initializeConsumer,
    disconnectConsumer,
};
