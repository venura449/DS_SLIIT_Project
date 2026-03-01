const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'notification-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

const initializeConsumer = async () => {
    try {
        await consumer.connect();
        console.log('Notification Service Kafka Consumer connected');

        // Subscribe to both auth and payment events
        await consumer.subscribe({ topics: ['auth-events', 'payment-events'], fromBeginning: false });

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
        const { eventType, data, timestamp } = event;

        switch (eventType) {
            case 'USER_REGISTERED':
                console.log('Handling user registration event:', data);
                // Send welcome email notification
                // await sendWelcomeEmail(data.email, data.name);
                break;

            case 'USER_LOGIN':
                console.log('Handling user login event:', data);
                // Send login notification
                // await sendLoginNotification(data.email);
                break;

            case 'PAYMENT_COMPLETED':
                console.log('Handling payment completed event:', data);
                // Send payment confirmation notification
                // await sendPaymentConfirmation(data.email, data.transactionId);
                break;

            case 'PAYMENT_FAILED':
                console.log('Handling payment failed event:', data);
                // Send payment failure notification
                // await sendPaymentFailureNotification(data.email, data.reason);
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
