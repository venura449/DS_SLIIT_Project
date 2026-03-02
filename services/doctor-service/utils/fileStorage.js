/**
 * File Storage Utility - Handles local file uploads and deletion
 * Files are stored in /uploads/doctor-verification directory (Docker volume)
 */

const fs = require('fs').promises;
const path = require('path');

// Base directory for uploads (mounted Docker volume)
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/uploads/doctor-verification';

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir() {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (error) {
        console.error('Failed to create upload directory:', error);
        throw error;
    }
}

/**
 * Save uploaded file to disk
 * @param {Buffer} fileBuffer - File content
 * @param {string} fileName - Original file name
 * @param {string} doctorId - Doctor ID for organizing files
 * @returns {Promise<object>} - Saved file info with path
 */
async function saveFile(fileBuffer, fileName, doctorId) {
    try {
        await ensureUploadDir();
        
        // Create doctor-specific subdirectory
        const doctorDir = path.join(UPLOAD_DIR, String(doctorId));
        await fs.mkdir(doctorDir, { recursive: true });
        
        // Generate unique filename to avoid collisions
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const savedFileName = `${timestamp}_${randomStr}_${fileName}`;
        const filePath = path.join(doctorDir, savedFileName);
        
        // Write file to disk
        await fs.writeFile(filePath, fileBuffer);
        
        // Return relative path for storage in database
        const relativePath = `/uploads/doctor-verification/${doctorId}/${savedFileName}`;
        
        return {
            success: true,
            documentUrl: relativePath, // Store this in database
            fileName: fileName,
            savedFileName: savedFileName,
            filePath: filePath,
            uploadedAt: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error saving file:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Delete a file by stored path
 * @param {string} documentUrl - Relative path stored in database (e.g., /uploads/doctor-verification/123/file.pdf)
 * @returns {Promise<boolean>}
 */
async function deleteFile(documentUrl) {
    try {
        if (!documentUrl) return false;
        
        // Convert stored URL back to file path
        const fileName = documentUrl.split('/').pop();
        const doctorId = documentUrl.split('/')[3];
        const filePath = path.join(UPLOAD_DIR, String(doctorId), fileName);
        
        // Delete file
        await fs.unlink(filePath);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error.message);
        // Don't throw - file might already be deleted
        return false;
    }
}

/**
 * Delete all files for a doctor
 * @param {string} doctorId - Doctor ID
 * @returns {Promise<boolean>}
 */
async function deleteDocorFiles(doctorId) {
    try {
        const doctorDir = path.join(UPLOAD_DIR, String(doctorId));
        
        // Check if directory exists
        try {
            await fs.access(doctorDir);
        } catch {
            return true; // Directory doesn't exist, nothing to delete
        }
        
        // Remove entire doctor directory
        await fs.rm(doctorDir, { recursive: true, force: true });
        return true;
    } catch (error) {
        console.error('Error deleting doctor files:', error);
        return false;
    }
}

module.exports = {
    UPLOAD_DIR,
    ensureUploadDir,
    saveFile,
    deleteFile,
    deleteDocorFiles,
};
