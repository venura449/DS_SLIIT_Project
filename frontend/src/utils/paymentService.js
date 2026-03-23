import { authenticatedFetch } from "./authService"; 

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const PAYMENT_API = `${API_BASE}/payments/api`;

export const createPayment = async (slotId, amount) => {
 try{ 
    const res = await authenticatedFetch(`${PAYMENT_API}/insertPayment`, {
        method: "POST",
        body: JSON.stringify({ slot_id: slotId, amount }),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Payment creation failed");
    }
    
    return { success: true, data: data.data };
  }catch(e){
    return { success: false, error: e.message };
  }
};