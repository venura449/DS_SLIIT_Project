import { getAuthToken, authenticatedFetch } from './authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const MR_API = `${API_BASE}/patients/api/v1/medical-records`;

/**
 * Build the full URL to view/download a file stored on patient-service.
 * file_url is e.g. /uploads/medical-records/userId/timestamp-file.pdf
 */
export const getFileUrl = (fileUrl) => `${API_BASE}/patients${fileUrl}`;

/** Patient: upload a new medical record */
export const uploadMedicalRecord = async (file, title, category, description = '') => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    if (description) formData.append('description', description);

    try {
        const res = await fetch(MR_API, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

/** Patient: list own medical records */
export const getMyMedicalRecords = async () => {
    try {
        const res = await authenticatedFetch(MR_API);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch records');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

/** Patient: delete a record */
export const deleteMedicalRecord = async (id) => {
    try {
        const res = await authenticatedFetch(`${MR_API}/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Delete failed');
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

/** Doctor: view records of a specific patient */
export const getPatientMedicalRecords = async (patientId) => {
    try {
        const res = await authenticatedFetch(`${MR_API}/patient/${patientId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch records');
        return { success: true, data: data.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
};
