const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'doctor-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const producer = kafka.producer();

const initializeProducer = async () => {
    try {
        await producer.connect();
        console.log('Doctor Service Kafka Producer connected');
    } catch (error) {
        console.error('Failed to connect Kafka Producer:', error.message);
        // Non-fatal: service still works without Kafka
    }
};

const sendDoctorEvent = async (eventType, data) => {
    try {
        await producer.send({
            topic: 'doctor-events',
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
        console.log(`Doctor event sent: ${eventType}`);
    } catch (error) {
        console.error(`Error sending doctor event (${eventType}):`, error.message);
    }
};

const disconnectProducer = async () => {
    try {
        await producer.disconnect();
    } catch (_) {
        // ignore on shutdown
    }
};

module.exports = { initializeProducer, sendDoctorEvent, disconnectProducer };
