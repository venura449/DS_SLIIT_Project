const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'appointment-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const producer = kafka.producer();

const initializeProducer = async () => {
    try {
        await producer.connect();
        console.log('Appointment Service Kafka Producer connected');
    } catch (error) {
        console.error('Failed to connect Kafka Producer:', error);
        // Non-fatal: service still works without Kafka; SMS just won't send
    }
};

const sendAppointmentEvent = async (eventType, data) => {
    try {
        await producer.send({
            topic: 'appointment-events',
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
        console.log(`Appointment event sent: ${eventType}`);
    } catch (error) {
        console.error(`Error sending appointment event (${eventType}):`, error.message);
        // Non-fatal: booking still succeeds; SMS just won't be sent
    }
};

const disconnectProducer = async () => {
    try {
        await producer.disconnect();
    } catch (_) {
        // ignore on shutdown
    }
};

module.exports = {
    initializeProducer,
    sendAppointmentEvent,
    disconnectProducer,
};
