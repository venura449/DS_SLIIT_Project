import { authenticatedFetch } from "./authService";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const PAYMENT_API = `${API_BASE}/payments/api`;

export const createPayment = async (slotId, amount) => {
  try {
    console.log("Creating payment with:", { slotId, amount });
    const res = await authenticatedFetch(`${PAYMENT_API}/insertPayment`, {
      method: "POST",
      body: JSON.stringify({ slot_id: slotId, amount }),
    });

    const data = await res.json();
    console.log("Payment API response:", { status: res.status, data });

    if (!res.ok) {
      const errorMsg = data.error || data.details || "Payment creation failed";
      console.error("Payment error:", errorMsg);
      throw new Error(errorMsg);
    }

    return { success: true, data: data.data };
  } catch (e) {
    console.error("Payment exception:", e.message);
    return { success: false, error: e.message };
  }
};

/**
 * Fetch doctor revenue grouped by period.
 * @param {string[]} slotIds - slot IDs from the doctor's appointments
 * @param {'daily'|'weekly'|'monthly'} period
 */
export const getDoctorRevenue = async (slotIds, period = "monthly") => {
  try {
    if (!slotIds || slotIds.length === 0)
      return { success: true, data: [] };

    const params = new URLSearchParams({
      slotIds: slotIds.join(","),
      period,
    });
    const res = await authenticatedFetch(
      `${PAYMENT_API}/doctor/revenue?${params}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch revenue");
    return { success: true, data: data.data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
};