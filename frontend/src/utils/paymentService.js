import { authenticatedFetch } from "./authService"; 

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const PAYMENT_API = `${API_BASE}/payments/api`;

export const createPayment = async (slotId, amount, token) =>{
    console.log(token);
    const result =await authenticatedFetch( fetch(`${PAYMENT_API}/insertPayment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
            slot_id: slotId,
            amount: amount
        })
    }));

    return result;

}