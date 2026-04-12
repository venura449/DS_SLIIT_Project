const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'auth-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const producer = kafka.producer();

const initializeProducer = async () => {
    try {
        await producer.connect();
        console.log('Auth Service Kafka Producer connected');
    } catch (error) {
        console.warn('WARNING: Failed to connect Kafka Producer - event publishing will be disabled:', error.message);
        // Don't exit, allow service to continue without Kafka
    }
};

const sendAuthEvent = async (eventType, data) => {
    try {
        await producer.send({
            topic: 'auth-events',
            messages: [
                {
                    key: eventType,
                    value: JSON.stringify({
                        eventType,
                        timestamp: new Date(),
                        data,
                    }),
                },
            ],
        });
        console.log(`Auth event sent: ${eventType}`);
    } catch (error) {
        console.error('Error sending auth event:', error);
    }
};

const disconnectProducer = async () => {
    await producer.disconnect();
};

module.exports = {
    initializeProducer,
    sendAuthEvent,
    disconnectProducer,
};
