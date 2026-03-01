/**
 * Cloudinary Service - Handles PDF and file uploads to Cloudinary
 * Configuration: Uses VITE environment variables
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload a file to Cloudinary
 * @param {File} file - The file to upload (PDF, JPG, PNG, etc.)
 * @param {string} folder - Optional folder path in Cloudinary (e.g., 'doctor-verification')
 * @param {string} resourceType - Type of resource: 'auto', 'image', 'video', 'raw' (default: 'auto')
 * @returns {Promise<object>} - Upload response with secure_url and other metadata
 */
export const uploadToCloudinary = async (
    file,
    folder = "mediconnect",
    resourceType = "auto"
) => {
    try {
        // Validate file
        if (!file) {
            throw new Error("No file provided");
        }

        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error("File size exceeds 50MB limit");
        }

        // Create FormData
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("folder", folder);
        formData.append("resource_type", resourceType);

        // Upload to Cloudinary — endpoint path must match resource type
        const endpoint = resourceType === "raw" ? "raw" : resourceType === "image" ? "image" : "auto";
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${endpoint}/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.error?.message || "Failed to upload file to Cloudinary"
            );
        }

        const data = await response.json();
        return {
            success: true,
            url: data.secure_url,
            publicId: data.public_id,
            fileName: file.name,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            metadata: {
                width: data.width,
                height: data.height,
                format: data.format,
                duration: data.duration,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || "Unknown error occurred during upload",
        };
    }
};

/**
 * Upload PDF specifically with validation
 * @param {File} file - PDF file to upload
 * @param {string} folder - Folder path in Cloudinary
 * @returns {Promise<object>} - Upload response
 */
export const uploadPDFToCloudinary = async (file, folder = "doctor-verification") => {
    try {
        // Validate PDF
        if (!file.type.includes("pdf")) {
            throw new Error("Only PDF files are allowed");
        }

        // Validate size (max 25MB for PDFs)
        const maxSize = 25 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error("PDF file size exceeds 25MB limit");
        }

        return await uploadToCloudinary(file, folder, "raw");
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Upload image with validation
 * @param {File} file - Image file to upload
 * @param {string} folder - Folder path in Cloudinary
 * @returns {Promise<object>} - Upload response
 */
export const uploadImageToCloudinary = async (file, folder = "mediconnect/profiles") => {
    try {
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            throw new Error("Only JPEG, PNG, GIF, and WebP images are allowed");
        }

        // Validate size (max 10MB for images)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error("Image file size exceeds 10MB limit");
        }

        return await uploadToCloudinary(file, folder, "image");
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @returns {Promise<object>} - Deletion response
 */
export const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            throw new Error("Public ID is required");
        }

        // Note: Deletion from client-side requires additional security setup
        // It's recommended to delete from backend only using API secret
        // This function is a placeholder for reference
        console.warn(
            "File deletion should be handled from backend for security reasons"
        );

        return {
            success: false,
            error: "Deletion not available from client. Use backend API.",
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Generate a thumbnail URL for a Cloudinary resource
 * @param {string} url - Original Cloudinary URL
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 * @returns {string} - Thumbnail URL
 */
export const getThumbnailUrl = (url, width = 200, height = 200) => {
    if (!url) return "";
    // Replace /upload/ with /upload/w_<width>,h_<height>,c_fill/
    return url.replace(
        "/upload/",
        `/upload/w_${width},h_${height},c_fill,q_auto/`
    );
};

export default {
    uploadToCloudinary,
    uploadPDFToCloudinary,
    uploadImageToCloudinary,
    deleteFromCloudinary,
    getThumbnailUrl,
};
