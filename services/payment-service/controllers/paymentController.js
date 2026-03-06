const {createPayment, updatePaymentStatus, getPayments, getPaymentsByUserId, getPaymentById, 
    getPaymentByAppointmentId, getPaymentsByStatus, deletePayment} = require('../services/paymentService');
const stripe = require('../config/stripe');

// Payment Initiate
exports.insertPayment = async (req, res) => {
    try {
        const patient_id = req.user.userId;
        const { amount, slot_id } = req.body;
        console.log("Mn paymnet cntl");
        const paymentData = { amount, slot_id, patient_id };

        const result = await createPayment(paymentData);

        res.status(201).json({ success: true, message: 'Payment initiated', data: result });
    } catch (error) {
        console.error("Payment error:", error);
        if(error.message === 'All fields are required') {
            res.status(400).json({ success: false, error: error.message });
        }else {
            res.status(500).json({ success: false, error: error.message || "Payment creation failed"});
        }
    }
};

// Get payments
exports.getAllPayments = async (req, res) => { 
    try {
        const payments = await getPayments();

        res.status(200).json({ success: true, message: 'Get all payments', data: payments });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get payments by user id
exports.getUserPayments = async (req, res) => {
    try {
        const patient_id = req.user.userId;
        const payments = await getPaymentsByUserId(patient_id);

        res.status(200).json({ success: true, message: 'Get user payments', data: payments });
    } catch (error) {
        if(error.message === 'User id required') {
            res.status(400).json({ success: false, error: error.message });
        }else if(error.message === 'No payments found for this user') {
            res.status(404).json({ success: false, error: error.message });
        } 
        else {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

// Get payment by id
exports.getPayment = async (req, res) => {
    try {
        const { id } = req.params;

        const payment = await getPaymentById(id);

        res.status(200).json({ success: true, message: 'Get all payments', data: payment });
    } catch (error) {
        if(error.message === 'Payment not found') {
            res.status(404).json({ success: false, error: error.message });
        } else {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

// Get payment by appointment id
exports.fetchPaymentByAppointmentId = async (req, res) => {
    try {
        const { appointment_id } = req.query;

        const payment = await getPaymentByAppointmentId(appointment_id);

        res.status(200).json({ success: true, message: 'Get payment by appointment id', data: payment });
    } catch (error) {
        if(error.message === 'Payment not found') {
            res.status(404).json({ success: false, error: error.message });
        } else {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

// Get payments by status
exports.fetchPaymentsByStatus = async (req, res) => {
    try {
        const { status } = req.query;

        const payments = await getPaymentsByStatus(status);
        res.status(200).json({ success: true, message: 'Get payments by status', data: payments });
    } catch (error) {
        if(error.message === 'Status is required') {
            res.status(400).json({ success: false, error: error.message });
        } else {   
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

// Delete payment by id
exports.removePayment = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const result = await deletePayment(id, user);

        res.status(200).json({ success: true, message: 'Payment deleted successfully', data: result });
    } catch (error) {
        if(error.message === 'Payment not found') {
            res.status(404).json({ success: false, error: error.message });
        } else {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};


// Stripe webhook handler
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
        if(error.message === 'Payment not found') {
            console.error('Payment not found for webhook event:', error);
            return res.status(404).json({ success: false, error: 'Payment not found' });
        }
        console.error('Error processing webhook event:', error);
        res.status(500).json({ success: false, error: 'Webhook processing error' });
    }
}