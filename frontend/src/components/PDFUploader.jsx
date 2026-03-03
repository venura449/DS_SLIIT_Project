import { useState, useRef } from "react";
import { uploadPDFToBackend } from "../utils/cloudinaryService";

const PDFUploader = ({
  onSuccess,
  onError,
  label = "Upload PDF",
  maxSize = 10,
  documentType = "license",
  multiple = false,
  token, // JWT token required for backend upload
}) => {
  const [loading, setLoading] = useState(false);
  const [savingToBackend, setSavingToBackend] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    // Validate token
    if (!token) {
      const errorMsg = "Authentication token is required to upload documents";
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    // Validate files
    const invalidFiles = files.filter((file) => !file.type.includes("pdf"));
    if (invalidFiles.length > 0) {
      const errorMsg = "Only PDF files are allowed";
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    // Check file sizes
    const maxSizeBytes = maxSize * 1024 * 1024;
    const oversizedFiles = files.filter((file) => file.size > maxSizeBytes);
    if (oversizedFiles.length > 0) {
      const errorMsg = `File size exceeds ${maxSize}MB limit`;
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    setLoading(true);
    setSavingToBackend(false);
    setError("");

    try {
      const uploadPromises = files.map((file) =>
        uploadPDFToBackend(file, documentType, token),
      );
      const results = await Promise.all(uploadPromises);

      const failedUploads = results.filter((r) => !r.success);
      if (failedUploads.length > 0) {
        const errorMsg = failedUploads.map((r) => r.error).join(", ");
        setError(errorMsg);
        if (onError) onError(errorMsg);
        return;
      }

      // Success
      setUploadedFiles([...uploadedFiles, ...results]);
      if (onSuccess) {
        onSuccess(multiple ? results : results[0]);
      }
    } catch (err) {
      const errorMsg = err.message || "Upload failed";
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
      setSavingToBackend(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="pdf-uploader-container">
      <style>{`
        .pdf-uploader-container {
          width: 100%;
        }

        .pdf-uploader-input-wrapper {
          position: relative;
          display: inline-block;
          width: 100%;
        }

        .pdf-uploader-input {
          display: none;
        }

        .pdf-uploader-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #0a3d62, #1a6fa0);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(10, 61, 98, 0.18);
        }

        .pdf-uploader-btn:hover:not(:disabled) {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .pdf-uploader-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pdf-uploader-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .pdf-uploader-error {
          margin-top: 10px;
          padding: 12px 14px;
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .pdf-uploader-success {
          margin-top: 10px;
          padding: 12px 14px;
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .pdf-uploader-files {
          margin-top: 14px;
        }

        .pdf-uploader-file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: #f8fafc;
          border: 1px solid #e4eaf0;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 8px;
          overflow: hidden;
        }

        .pdf-uploader-file-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .pdf-uploader-file-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .pdf-uploader-file-details {
          flex: 1;
          min-width: 0;
        }

        .pdf-uploader-file-name {
          font-weight: 600;
          color: #3a5068;
          word-break: break-all;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pdf-uploader-file-size {
          font-size: 11px;
          color: #7a8fa6;
          margin-top: 2px;
        }

        .pdf-uploader-file-link {
          font-size: 11px;
          color: #0a3d62;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.2s;
          white-space: nowrap;
        }

        .pdf-uploader-file-link:hover {
          color: #1a6fa0;
          text-decoration: underline;
        }

        .pdf-uploader-remove-btn {
          padding: 4px 8px;
          background: #fca5a5;
          color: #dc2626;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          margin-left: 8px;
        }

        .pdf-uploader-remove-btn:hover {
          background: #f87171;
          color: #991b1b;
        }

        .pdf-uploader-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #3a5068;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .pdf-uploader-hint {
          font-size: 12px;
          color: #7a8fa6;
          margin-top: 6px;
        }
      `}</style>

      <label className="pdf-uploader-label">{label}</label>

      <div className="pdf-uploader-input-wrapper">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple={multiple}
          onChange={handleFileSelect}
          className="pdf-uploader-input"
          disabled={loading}
        />
        <button
          type="button"
          className="pdf-uploader-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || savingToBackend}
        >
          {(loading || savingToBackend) && (
            <span className="pdf-uploader-spinner" />
          )}
          <span>📎</span>
          {loading
            ? "Uploading..."
            : savingToBackend
              ? "Saving..."
              : "Choose PDF"}
        </button>
      </div>

      <div className="pdf-uploader-hint">
        Max file size: {maxSize}MB • PDF format only
      </div>

      {error && (
        <div className="pdf-uploader-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="pdf-uploader-files">
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#3a5068",
              marginBottom: "8px",
            }}
          >
            ✓ Uploaded Files ({uploadedFiles.length})
          </div>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="pdf-uploader-file-item">
              <div className="pdf-uploader-file-info">
                <div className="pdf-uploader-file-icon">📄</div>
                <div className="pdf-uploader-file-details">
                  <div className="pdf-uploader-file-name" title={file.fileName}>
                    {file.fileName}
                  </div>
                  <div className="pdf-uploader-file-size">
                    {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="pdf-uploader-file-link"
              >
                View
              </a>
              <button
                type="button"
                className="pdf-uploader-remove-btn"
                onClick={() => removeFile(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PDFUploader;
