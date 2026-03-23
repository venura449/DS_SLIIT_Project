import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";

const PaymentForm = ({ clientSecret, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [success,setSuccess] = useState(false);
    const [error, setError] = useState(null);

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
            setSuccess(true);
            onSuccess();
        }else{
            setError(result.error.message);
            onCancel();
        }
    }

    const cardStyle = {
        style: {
            base: {
                fontSize: "16px",
                color: "#1e293b", 
                padding: "12px 14px",
                fontFamily: 'Arial, sans-serif',
                "::placeholder": {
                    color: "#94a3b8",
                },
            },
            invalid: {
                color: "#ef4444",
            },
        },
    };
       
    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
            <CardElement options={cardStyle} />
            <div  style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                <button 
                    type="button" 
                    onClick={()=> onCancel()} 
                    style={{
                        flex: 1,
                        backgroundColor: "#f1f5f9", // Cancel button light gray
                        color: "#1e293b",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        padding: "10px",
                        cursor: "pointer"
                    }}
                >
                    Cancel
                </button>
                <button type="submit" 
                    disabled={!stripe}
                    style={{
                            flex: 1,
                            backgroundColor: "#1e40af", // Confirm button dark blue
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "10px",
                            cursor: "pointer"
                        }}
                >
                    Pay
                </button>
            </div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {success && <div style={{ color: 'green' }}>Payment successful!</div>}
        </form>
    );
};

export default PaymentForm;