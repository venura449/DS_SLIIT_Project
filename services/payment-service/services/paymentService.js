const Payment = require('../models/payment');
const stripe = require('../config/stripe');

exports.createPayment = async (paymentData) => {
    if (!paymentData.amount || !paymentData.appointment_id || !paymentData.patient_id) {
        throw new Error('All feilds are required');
    }

    const payment = await Payment.create(paymentData);

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(payment.amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
            payment_id: payment.id,
            appointment_id: payment.appointment_id,
            patient_id: payment.patient_id,
        },
    });

    return {
        payment,
        clientSecret: paymentIntent.client_secret,
    };
};

exports.updatePaymentStatus = async (paymentId, status, transactionId) => {
    const updatedPayment = await Payment.updateStatus(paymentId, status, transactionId);
    return updatedPayment;
}
