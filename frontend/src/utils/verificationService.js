/**
 * Doctor Verification Service - Backend API Integration
 * Handles communication with backend for document verification
 */

import { authenticatedFetch, getUserData } from "./authService";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const DOCTOR_API = `${API_BASE}/doctors/api/v1/verification`;

/**
 * Submit a single verification document to the backend
 * @param {string} documentType - Type of document (license, government_id, credentials, insurance)
 * @param {Object} uploadedFile - Cloudinary upload response
 * @returns {Promise<Object>} - Backend response
 */
export const submitVerificationDocument = async (documentType, uploadedFile) => {
    try {
        if (!uploadedFile.success) {
            throw new Error("Invalid upload response");
        }

        const user = getUserData();
        if (!user || !user.id) {
            throw new Error("User not authenticated");
        }

        const response = await authenticatedFetch(
            `${DOCTOR_API}/upload`,
            {
                method: "POST",
                body: JSON.stringify({
                    doctorId: user.id,
                    documentType,
                    documentUrl: uploadedFile.url,
                    publicId: uploadedFile.publicId,
                    fileName: uploadedFile.fileName,
                    fileSize: uploadedFile.fileSize,
                    uploadedAt: uploadedFile.uploadedAt,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || `Failed to save ${documentType} to database`
            );
        }

        return {
            success: true,
            data: data.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || "Failed to submit document",
        };
    }
};

/**
 * Get all submitted verification documents for current user
 * @returns {Promise<Object>} - List of verification documents
 */
export const getVerificationDocuments = async () => {
    try {
        const user = getUserData();
        if (!user || !user.id) {
            throw new Error("User not authenticated");
        }

        const response = await authenticatedFetch(
            `${DOCTOR_API}/documents/${user.id}`,
            {
                method: "GET",
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch documents");
        }

        return {
            success: true,
            documents: data.data || [],
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            documents: [],
        };
    }
};

/**
 * Get verification status for current user
 * @returns {Promise<Object>} - Verification status
 */
export const getVerificationStatus = async () => {
    try {
        const user = getUserData();
        if (!user || !user.id) {
            throw new Error("User not authenticated");
        }

        const response = await authenticatedFetch(
            `${DOCTOR_API}/status/${user.id}`,
            {
                method: "GET",
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch verification status");
        }

        return {
            success: true,
            status: data.data || {
                status: "pending",
                documentsSubmitted: 0,
                totalRequired: 4,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            status: null,
        };
    }
};

/**
 * Delete a verification document
 * @param {string} documentId - ID of the document to delete
 * @returns {Promise<Object>} - Deletion response
 */
export const deleteVerificationDocument = async (documentId) => {
    try {
        const response = await authenticatedFetch(
            `${DOCTOR_API}/documents/${documentId}`,
            {
                method: "DELETE",
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to delete document");
        }

        return {
            success: true,
            data: data.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Submit all verification documents for review
 * @returns {Promise<Object>} - Submission response
 */
export const submitForVerification = async () => {
    try {
        const user = getUserData();
        if (!user || !user.id) {
            throw new Error("User not authenticated");
        }

        const response = await authenticatedFetch(
            `${DOCTOR_API}/submit`,
            {
                method: "POST",
                body: JSON.stringify({
                    doctorId: user.id,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to submit for verification");
        }

        return {
            success: true,
            data: data.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
};

export default {
    submitVerificationDocument,
    getVerificationDocuments,
    getVerificationStatus,
    deleteVerificationDocument,
    submitForVerification,
};
