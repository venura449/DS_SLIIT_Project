const {createPayment, updatePaymentStatus} = require('../services/paymentService');
const stripe = require('../config/stripe');

exports.insertPayment = async (req, res) => {
    try {
        const { amount, appointment_id, patient_id } = req.body;

        const paymentData = { amount, appointment_id, patient_id };

        const result = await createPayment(paymentData);

        res.status(201).json({ success: true, message: 'Payment initiated', data: result });
    } catch (error) {
        if(error.message === 'All feilds are required') {
            res.status(400).json({ success: false, error: error.message });
        }else {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

exports.handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try{
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const paymentId = paymentIntent.metadata.payment_id;
            const transactionId = paymentIntent.id;
            await updatePaymentStatus(paymentId, 'SUCCESS', transactionId);
        }
        else if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object;
            const paymentId = paymentIntent.metadata.payment_id;
            const transactionId = paymentIntent.id;
            await updatePaymentStatus(paymentId, 'FAILED', transactionId);
        }
        else if (event.type === 'charge.refunded') {
            const charge = event.data.object;
            const paymentId = charge.metadata.payment_id;
            const transactionId = charge.id;
            await updatePaymentStatus(paymentId, 'REFUNDED', transactionId);
        }
        else {
            console.log(`Unhandled event type ${event.type}`);
        }
        res.json({ received: true });
    }catch (error) {
        console.error('Error processing webhook event:', error);
        res.status(500).json({ success: false, error: 'Webhook processing error' });
    }
}


// const getPayments = async (req, res) => {
//     try {
//         res.status(200).json({ success: true, message: 'Get all payments', data: [] });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// };

// const getPaymentById = async (req, res) => {
//     try {
//         res.status(200).json({ success: true, message: `Get payment ${req.params.id}`, data: null });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// };

// const createPayment = async (req, res) => {
//     try {
//         res.status(201).json({ success: true, message: 'Payment initiated', data: req.body });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// };

// const handleWebhook = async (req, res) => {
//     try {
//         res.status(200).json({ success: true, message: 'Webhook received' });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// };

// module.exports = { getPayments, getPaymentById, createPayment, handleWebhook };
