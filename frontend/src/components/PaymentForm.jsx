import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const PaymentForm = ({ clientSecret, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        const result = await stripe.confirmCardPayment(clientSecret,{
            payment_method:{
                card: elements.getElement(CardElement)
            }
        });

        if(result.paymentIntent.status === "succeeded"){
            onSuccess();
        }
    }
       
    return (
        <form onSubmit={handleSubmit}>
            <CardElement />
            <button type="submit" disabled={!stripe}>
                Pay
            </button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {success && <div style={{ color: 'green' }}>Payment successful!</div>}
        </form>
    );
};

export default PaymentForm;