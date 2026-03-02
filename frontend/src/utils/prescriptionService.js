import { authenticatedFetch } from './authService';

const API_BASE = () => import.meta.env.VITE_API_BASE_URL;

// ── Prescription CRUD ──────────────────────────────────────────────────────

export const createPrescription = async (payload) => {
    try {
        const res = await authenticatedFetch(`${API_BASE()}/appointments/api/v1/prescriptions`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        return data;
    } catch {
        return { success: false, message: 'Network error' };
    }
};

export const updatePrescription = async (id, payload) => {
    try {
        const res = await authenticatedFetch(`${API_BASE()}/appointments/api/v1/prescriptions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        return await res.json();
    } catch {
        return { success: false, message: 'Network error' };
    }
};

export const getDoctorPrescriptions = async () => {
    try {
        const res = await authenticatedFetch(`${API_BASE()}/appointments/api/v1/prescriptions/doctor`);
        return await res.json();
    } catch {
        return { success: false, data: [] };
    }
};

export const getPatientPrescriptions = async () => {
    try {
        const res = await authenticatedFetch(`${API_BASE()}/appointments/api/v1/prescriptions/patient`);
        return await res.json();
    } catch {
        return { success: false, data: [] };
    }
};

export const getPrescriptionByAppointment = async (appointmentId) => {
    try {
        const res = await authenticatedFetch(
            `${API_BASE()}/appointments/api/v1/prescriptions/appointment/${appointmentId}`
        );
        return await res.json();
    } catch {
        return { success: false, data: null };
    }
};

// ── RxNorm API helpers ──────────────────────────────────────────────────────

const RXNORM_BASE = 'https://rxnav.nlm.nih.gov/REST';

/**
 * Search drugs by name using RxNorm approximateTerm endpoint.
 * Endpoint: GET /approximateTerm.json?term=...&maxEntries=10
 * Returns an array of { rxcui, name, score } objects sorted by score desc.
 */
export const searchDrugs = async (term) => {
    if (!term || term.trim().length < 2) return [];
    try {
        const url = `${RXNORM_BASE}/approximateTerm.json?term=${encodeURIComponent(term.trim())}&maxEntries=10`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        const candidates = data?.approximateGroup?.candidate ?? [];

        // Deduplicate by normalised name, keep highest numeric score per name
        const seen = new Map();
        for (const c of candidates) {
            // Some candidates have no name field — skip those
            if (!c.name) continue;
            // Clean up embedded newlines / extra whitespace from the API
            const cleanName = c.name.replace(/\s+/g, ' ').trim();
            const key = cleanName.toLowerCase();
            const score = parseFloat(c.score) || 0;
            if (!seen.has(key) || seen.get(key).score < score) {
                seen.set(key, { rxcui: c.rxcui, name: cleanName, score });
            }
        }

        // Sort by score descending and return top 8
        return Array.from(seen.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
    } catch {
        return [];
    }
};

// ── Frequency options (standard medical abbreviations) ─────────────────────

export const FREQUENCY_OPTIONS = [
    { value: 'OD', label: 'OD – Once Daily' },
    { value: 'BD', label: 'BD – Twice Daily' },
    { value: 'TDS', label: 'TDS – Three Times Daily' },
    { value: 'QDS', label: 'QDS – Four Times Daily' },
    { value: 'Q4H', label: 'Q4H – Every 4 Hours' },
    { value: 'Q6H', label: 'Q6H – Every 6 Hours' },
    { value: 'Q8H', label: 'Q8H – Every 8 Hours' },
    { value: 'Q12H', label: 'Q12H – Every 12 Hours' },
    { value: 'AC', label: 'AC – Before Meals' },
    { value: 'PC', label: 'PC – After Meals' },
    { value: 'HS', label: 'HS – At Bedtime' },
    { value: 'AM', label: 'AM – Morning' },
    { value: 'PM', label: 'PM – Evening' },
    { value: 'PRN', label: 'PRN – As Needed' },
    { value: 'SOS', label: 'SOS – If Needed' },
    { value: 'STAT', label: 'STAT – Immediately' },
    { value: 'Weekly', label: 'Weekly' },
    { value: 'Fortnightly', label: 'Fortnightly' },
    { value: 'Monthly', label: 'Monthly' },
];

export const DURATION_SUGGESTIONS = [
    '1 day', '2 days', '3 days', '5 days', '7 days', '10 days', '14 days',
    '1 month', '2 months', '3 months', '6 months', '1 year', 'Ongoing / Long-term',
];
