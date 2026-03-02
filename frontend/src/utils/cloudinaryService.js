/**
 * Document Upload Service - Uploads PDFs directly to doctor-service backend
 * Files are stored in Docker volume and deleted when doctor is verified
 */

const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * Upload a PDF to the doctor-service backend
 * @param {File} file - PDF file to upload
 * @param {string} documentType - Type of document (license, government_id, credentials, insurance)
 * @param {string} token - JWT authentication token
 * @returns {Promise<object>}
 */
export const uploadPDFToBackend = async (file, documentType = "license", token) => {
    try {
        if (!file) throw new Error("No file provided");
        if (!file.type.includes("pdf")) throw new Error("Only PDF files are allowed");

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) throw new Error("PDF file size exceeds 10MB limit");

        if (!token) throw new Error("Authentication token is required");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", documentType);

        const response = await fetch(
            `${BACKEND_BASE_URL}/doctors/api/v1/verification/upload`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to upload PDF to backend");
        }

        const data = await response.json();
        const document = data.data.document;

        // Build full URL: gateway proxies /doctors/* to doctor-service
        // doctor-service serves static files at /uploads/doctor-verification/*
        const fullUrl = `${BACKEND_BASE_URL}/doctors${document.documentUrl}`;

        return {
            success: true,
            url: fullUrl,
            id: document.id,
            fileName: document.fileName,
            fileSize: document.fileSize,
            uploadedAt: document.uploadedAt,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || "Unknown error occurred during upload",
        };
    }
};

// Keep this for backward compatibility if needed
export const uploadPDFToCloudinary = uploadPDFToBackend;

export default { uploadPDFToBackend, uploadPDFToCloudinary };