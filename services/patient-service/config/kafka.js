const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'patient-service', // Unique ID for this service
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'patient-group' });

const initializeKafka = async () => {
    try {
        await producer.connect();
        await consumer.connect();
        console.log('Patient Service Kafka connected');
    } catch (error) {
        console.error('Kafka connection failed:', error);
    }
};

// Generic function to send events (e.g., APPOINTMENT_BOOKED)
const emitPatientEvent = async (topic, eventType, data) => {
    try {
        await producer.send({
            topic,
            messages: [{
                key: eventType,
                value: JSON.stringify({ eventType, timestamp: new Date(), data })
            }],
        });
    } catch (error) {
        console.error(`Error sending event to ${topic}:`, error);
    }
};

module.exports = { initializeKafka, emitPatientEvent, consumer };