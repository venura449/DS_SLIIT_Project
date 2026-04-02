import { useState, useEffect, useRef } from "react";
import {
  uploadMedicalRecord,
  getMyMedicalRecords,
  deleteMedicalRecord,
  getFileUrl,
} from "../utils/medicalRecordService";
import ChatBubbleButton from "./ChatBubbleButton";

const CATEGORIES = [
  {
    value: "lab_report",
    label: "Lab Report",
    icon: "🧪",
    color: "#eff6ff",
    text: "#1d4ed8",
    border: "#93c5fd",
  },
  {
    value: "imaging",
    label: "Imaging / Scan",
    icon: "🩻",
    color: "#faf5ff",
    text: "#7c3aed",
    border: "#c4b5fd",
  },
  {
    value: "prescription",
    label: "Prescription",
    icon: "💊",
    color: "#f0fdf4",
    text: "#15803d",
    border: "#86efac",
  },
  {
    value: "discharge_summary",
    label: "Discharge Summary",
    icon: "🏥",
    color: "#fff7ed",
    text: "#c2410c",
    border: "#fdba74",
  },
  {
    value: "other",
    label: "Other",
    icon: "📄",
    color: "#f8fafc",
    text: "#475569",
    border: "#cbd5e1",
  },
];

const getCat = (value) =>
  CATEGORIES.find((c) => c.value === value) || CATEGORIES[4];

const formatBytes = (b) => {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Upload form state
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("lab_report");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  // Delete confirm
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  // Search & filter
  const [mrSearch, setMrSearch] = useState("");
  const [mrCategoryFilter, setMrCategoryFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    getMyMedicalRecords().then((res) => {
      if (cancelled) return;
      if (res.success) setRecords(res.data);
      else setError(res.error || "Failed to load records");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) acceptFile(f);
  };

  const acceptFile = (f) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(f.type)) {
      setUploadError("Only PDF, JPEG, and PNG files are allowed");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setUploadError("File must be under 20 MB");
      return;
    }
    setFile(f);
    setUploadError("");
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleUpload = async () => {
    if (!file) return setUploadError("Please select a file");
    if (!title.trim()) return setUploadError("Please enter a title");
    setUploading(true);
    setUploadError("");
    const res = await uploadMedicalRecord(
      file,
      title.trim(),
      category,
      description.trim(),
    );
    setUploading(false);
    if (res.success) {
      setRecords((prev) => [res.data, ...prev]);
      setShowForm(false);
      setFile(null);
      setTitle("");
      setCategory("lab_report");
      setDescription("");
    } else {
      setUploadError(res.error || "Upload failed");
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    const res = await deleteMedicalRecord(id);
    setDeletingId(null);
    setConfirmId(null);
    if (res.success) setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const resetForm = () => {
    setShowForm(false);
    setFile(null);
    setTitle("");
    setCategory("lab_report");
    setDescription("");
    setUploadError("");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
        .mr-root { font-family: 'DM Sans', sans-serif; }

        /* ── Upload modal overlay ── */
        .mr-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(10,30,50,.45);
          backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .mr-modal {
          background: #fff; border-radius: 16px;
          width: 100%; max-width: 520px;
          box-shadow: 0 20px 60px rgba(0,0,0,.18);
          overflow: hidden;
          animation: mrSlideIn .22s ease;
        }
        @keyframes mrSlideIn { from { opacity:0; transform:translateY(18px);} to { opacity:1; transform:none; } }
        .mr-modal-head {
          padding: 18px 22px 14px;
          border-bottom: 1px solid #f0f4f8;
          display: flex; align-items: center; justify-content: space-between;
        }
        .mr-modal-title {
          font-family: 'Sora', sans-serif;
          font-size: 16px; font-weight: 700; color: #0a3d62;
        }
        .mr-modal-close {
          width: 30px; height: 30px; border-radius: 8px;
          border: none; background: #f0f4f8; cursor: pointer;
          font-size: 14px; color: #7a8fa6;
          display: flex; align-items: center; justify-content: center;
          transition: all .15s;
        }
        .mr-modal-close:hover { background: #fee2e2; color: #dc2626; }
        .mr-modal-body { padding: 20px 22px; }

        /* ── Dropzone ── */
        .mr-dropzone {
          border: 2px dashed #c7d8e8;
          border-radius: 12px;
          padding: 28px 20px;
          text-align: center;
          cursor: pointer;
          transition: all .2s;
          background: #fafcfe;
          margin-bottom: 18px;
        }
        .mr-dropzone:hover, .mr-dropzone.drag { border-color: #1a6fa0; background: #eff7ff; }
        .mr-dropzone-icon { font-size: 36px; margin-bottom: 8px; opacity: .75; }
        .mr-dropzone-text { font-size: 14px; font-weight: 600; color: #3a5068; }
        .mr-dropzone-hint { font-size: 12px; color: #7a8fa6; margin-top: 4px; }
        .mr-file-selected {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          background: #f0f9ff; border: 1.5px solid #7dd8f8;
          border-radius: 10px; margin-bottom: 18px;
        }
        .mr-file-name { font-size: 13px; font-weight: 600; color: #0a3d62; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mr-file-clear { border: none; background: none; cursor: pointer; font-size: 15px; color: #64748b; }
        .mr-file-clear:hover { color: #dc2626; }

        /* ── Form fields ── */
        .mr-label { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #3a5068; margin-bottom: 5px; display: block; }
        .mr-field { margin-bottom: 14px; }
        .mr-input, .mr-textarea, .mr-select {
          width: 100%; box-sizing: border-box;
          padding: 9px 12px; border: 1.5px solid #d9e5f0;
          border-radius: 8px; font-family: 'DM Sans', sans-serif;
          font-size: 13.5px; color: #1a3a52;
          background: #fff; outline: none;
          transition: border-color .15s;
        }
        .mr-input:focus, .mr-textarea:focus, .mr-select:focus { border-color: #1a6fa0; }
        .mr-textarea { resize: vertical; min-height: 68px; }
        .mr-cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
        .mr-cat-pill {
          padding: 8px 10px; border-radius: 8px;
          border: 2px solid transparent;
          background: #f8fafc; cursor: pointer;
          text-align: center; transition: all .15s;
          font-size: 12px; font-weight: 600; color: #3a5068;
        }
        .mr-cat-pill:hover { border-color: #c7d8e8; }
        .mr-cat-pill.selected { border-color: currentColor; }
        .mr-upload-btn {
          width: 100%; padding: 11px;
          background: linear-gradient(135deg, #0a3d62, #1a6fa0);
          color: #fff; border: none; border-radius: 9px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all .18s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .mr-upload-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
        .mr-upload-btn:disabled { opacity: .55; cursor: not-allowed; }
        .mr-spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin .6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .mr-err { margin-top: 10px; padding: 9px 12px; background: #fee2e2; color: #991b1b; border-radius: 7px; font-size: 13px; }

        /* ── Records list ── */
        .mr-header-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
        }
        .mr-section-title {
          font-family: 'Sora', sans-serif;
          font-size: 18px; font-weight: 700; color: #0a3d62;
        }
        .mr-section-sub { font-size: 13px; color: #7a8fa6; margin-top: 2px; }
        .mr-add-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px; border-radius: 8px; border: none;
          background: linear-gradient(135deg, #0a3d62, #1a6fa0);
          color: #fff; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; box-shadow: 0 2px 10px rgba(10,61,98,.2);
          transition: all .18s;
        }
        .mr-add-btn:hover { opacity: .88; transform: translateY(-1px); }

        /* ── Record grid ── */
        .mr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
        .mr-card {
          background: #fff; border: 1.5px solid #e8eef5;
          border-radius: 14px; overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,.04);
          transition: all .2s; display: flex; flex-direction: column;
        }
        .mr-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,.09); transform: translateY(-2px); }
        .mr-card-banner {
          height: 6px;
        }
        .mr-card-body { padding: 16px 18px 14px; flex: 1; }
        .mr-card-cat {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 20px; border: 1px solid;
          font-size: 11px; font-weight: 700; margin-bottom: 10px;
        }
        .mr-card-title {
          font-family: 'Sora', sans-serif;
          font-size: 14.5px; font-weight: 700; color: #0a3d62;
          margin-bottom: 5px; line-height: 1.3;
        }
        .mr-card-desc { font-size: 12.5px; color: #7a8fa6; margin-bottom: 10px; line-height: 1.4; }
        .mr-card-meta {
          display: flex; flex-wrap: wrap; gap: 12px;
          font-size: 11.5px; color: #94a3b8; margin-bottom: 12px;
        }
        .mr-card-meta span { display: flex; align-items: center; gap: 4px; }
        .mr-card-footer {
          padding: 10px 18px 14px;
          display: flex; gap: 8px; align-items: center;
          border-top: 1px solid #f1f5f9;
        }
        .mr-view-btn {
          flex: 1; padding: 7px 0; border-radius: 7px;
          background: #eff6ff; color: #1d4ed8;
          border: 1px solid #bfdbfe;
          font-size: 12.5px; font-weight: 700;
          cursor: pointer; text-align: center; text-decoration: none;
          display: flex; align-items: center; justify-content: center; gap: 5px;
          transition: all .15s;
        }
        .mr-view-btn:hover { background: #dbeafe; border-color: #93c5fd; }
        .mr-del-btn {
          padding: 7px 12px; border-radius: 7px;
          border: 1px solid #fecaca; background: #fff5f5; color: #dc2626;
          font-size: 12.5px; font-weight: 700; cursor: pointer;
          transition: all .15s;
        }
        .mr-del-btn:hover:not(:disabled) { background: #fee2e2; }
        .mr-del-btn:disabled { opacity: .5; cursor: not-allowed; }

        /* Confirm delete */
        .mr-confirm-panel {
          padding: 10px 18px 14px;
          background: #fff8f8; border-top: 1px solid #fde8e8;
          font-size: 13px; color: #7f1d1d;
        }
        .mr-confirm-panel strong { display: block; margin-bottom: 8px; }
        .mr-confirm-btns { display: flex; gap: 8px; }
        .mr-confirm-yes { padding: 6px 14px; border-radius: 7px; border: none; background: #dc2626; color: #fff; font-size: 12.5px; font-weight: 700; cursor: pointer; }
        .mr-confirm-no  { padding: 6px 14px; border-radius: 7px; border: 1.5px solid #e4eaf0; background: #fff; color: #3a5068; font-size: 12.5px; font-weight: 700; cursor: pointer; }

        /* Empty & loading */
        .mr-empty {
          background: #fff; border: 1.5px dashed #d9e5f0;
          border-radius: 14px; padding: 56px 20px;
          text-align: center;
        }
        .mr-empty-icon { font-size: 48px; opacity: .35; margin-bottom: 12px; }
        .mr-empty-title { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700; color: #0a3d62; margin-bottom: 6px; }
        .mr-empty-hint { font-size: 13px; color: #7a8fa6; max-width: 300px; margin: 0 auto 18px; }
        .mr-loading { text-align: center; padding: 48px; color: #7a8fa6; font-size: 14px; }
        .mr-global-err { padding: 12px 16px; background: #fee2e2; color: #991b1b; border-radius: 9px; margin-bottom: 18px; font-size: 13px; }

        /* ── Search / filter toolbar ── */
        .mr-toolbar {
          display: flex; gap: 8px; flex-wrap: wrap;
          margin-bottom: 18px;
        }
        .mr-search-wrap {
          position: relative; flex: 1; min-width: 200px;
        }
        .mr-search-icon {
          position: absolute; left: 10px; top: 50%;
          transform: translateY(-50%);
          font-size: 13px; pointer-events: none; line-height: 1;
        }
        .mr-search-input {
          width: 100%; padding: 8px 32px 8px 30px;
          border: 1.5px solid #d9e5f0; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          color: #1a3552; background: #f7fafc; outline: none;
          box-sizing: border-box; transition: border-color .18s, box-shadow .18s;
        }
        .mr-search-input:focus {
          border-color: #1a6fa0;
          box-shadow: 0 0 0 3px rgba(26,111,160,.1);
          background: #fff;
        }
        .mr-search-clear {
          position: absolute; right: 8px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          font-size: 12px; color: #7a8fa6; padding: 2px 4px; line-height: 1;
        }
        .mr-search-clear:hover { color: #dc2626; }
        .mr-filter-select {
          padding: 8px 10px;
          border: 1.5px solid #d9e5f0; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 13px;
          color: #1a3552; background: #f7fafc;
          outline: none; cursor: pointer;
          transition: border-color .18s;
        }
        .mr-filter-select:focus { border-color: #1a6fa0; }
        .mr-toolbar-clear {
          padding: 8px 12px; border: 1.5px solid #e4eaf0;
          border-radius: 8px; background: #f0f4f8;
          font-family: 'DM Sans', sans-serif; font-size: 12px;
          font-weight: 600; color: #1a6fa0; cursor: pointer;
        }
        .mr-no-results {
          background: #fff; border: 1.5px dashed #d9e5f0;
          border-radius: 14px; padding: 48px 20px; text-align: center;
        }
        .mr-no-results-icon { font-size: 40px; opacity: .35; margin-bottom: 10px; }
        .mr-no-results-text { font-size: 13px; color: #7a8fa6; }
      `}</style>

      <div className="mr-root">
        {/* Header row */}
        <div className="mr-header-row">
          <div>
            <div className="mr-section-title">Medical Records</div>
            <div className="mr-section-sub">
              Upload and manage your health documents securely.
            </div>
          </div>
          <button className="mr-add-btn" onClick={() => setShowForm(true)}>
            <span>+</span> Upload Record
          </button>
        </div>

        {error && <div className="mr-global-err">⚠️ {error}</div>}

        {loading ? (
          <div className="mr-loading">
            <div style={{ fontSize: 32, marginBottom: 10 }}>🩺</div>
            Loading your records…
          </div>
        ) : records.length === 0 ? (
          <div className="mr-empty">
            <div className="mr-empty-icon">📂</div>
            <div className="mr-empty-title">No records uploaded yet</div>
            <div className="mr-empty-hint">
              Keep all your health documents in one secure place. Upload lab
              results, imaging reports, prescriptions, and more.
            </div>
            <button className="mr-add-btn" onClick={() => setShowForm(true)}>
              + Upload Your First Record
            </button>
          </div>
        ) : (
          (() => {
            const q = mrSearch.toLowerCase().trim();
            const filtered = records.filter((rec) => {
              if (
                mrCategoryFilter !== "all" &&
                rec.category !== mrCategoryFilter
              )
                return false;
              if (q) {
                const titleMatch = (rec.title || "").toLowerCase().includes(q);
                const descMatch = (rec.description || "")
                  .toLowerCase()
                  .includes(q);
                if (!titleMatch && !descMatch) return false;
              }
              return true;
            });
            return (
              <>
                {/* Search & filter toolbar */}
                <div className="mr-toolbar">
                  <div className="mr-search-wrap">
                    <span className="mr-search-icon">🔍</span>
                    <input
                      type="text"
                      className="mr-search-input"
                      placeholder="Search by title or description…"
                      value={mrSearch}
                      onChange={(e) => setMrSearch(e.target.value)}
                    />
                    {mrSearch && (
                      <button
                        className="mr-search-clear"
                        onClick={() => setMrSearch("")}
                        aria-label="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <select
                    className="mr-filter-select"
                    value={mrCategoryFilter}
                    onChange={(e) => setMrCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                  {(mrSearch || mrCategoryFilter !== "all") && (
                    <button
                      className="mr-toolbar-clear"
                      onClick={() => {
                        setMrSearch("");
                        setMrCategoryFilter("all");
                      }}
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>

                {filtered.length === 0 ? (
                  <div className="mr-no-results">
                    <div className="mr-no-results-icon">🔍</div>
                    <div className="mr-no-results-text">
                      No records match your search or filter.
                    </div>
                  </div>
                ) : (
                  <div className="mr-grid">
                    {filtered.map((rec) => {
                      const cat = getCat(rec.category);
                      const isDeleting = deletingId === rec.id;
                      const isConfirming = confirmId === rec.id;

                      return (
                        <div className="mr-card" key={rec.id}>
                          <div
                            className="mr-card-banner"
                            style={{ background: cat.border }}
                          />
                          <div className="mr-card-body">
                            <div
                              className="mr-card-cat"
                              style={{
                                background: cat.color,
                                color: cat.text,
                                borderColor: cat.border,
                              }}
                            >
                              <span>{cat.icon}</span>
                              {cat.label}
                            </div>
                            <div className="mr-card-title" title={rec.title}>
                              {rec.title}
                            </div>
                            {rec.description && (
                              <div className="mr-card-desc">
                                {rec.description}
                              </div>
                            )}
                            <div className="mr-card-meta">
                              <span>📅 {formatDate(rec.uploaded_at)}</span>
                              <span>💾 {formatBytes(rec.file_size)}</span>
                              <span
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: 140,
                                }}
                                title={rec.file_name}
                              >
                                📄 {rec.file_name}
                              </span>
                            </div>
                          </div>

                          {!isConfirming && (
                            <div className="mr-card-footer">
                              <a
                                className="mr-view-btn"
                                href={getFileUrl(rec.file_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                👁 View / Download
                              </a>
                              <button
                                className="mr-del-btn"
                                disabled={isDeleting}
                                onClick={() => setConfirmId(rec.id)}
                              >
                                {isDeleting ? "…" : "🗑"}
                              </button>
                            </div>
                          )}

                          {isConfirming && (
                            <div className="mr-confirm-panel">
                              <strong>Delete this record?</strong>
                              <div className="mr-confirm-btns">
                                <button
                                  className="mr-confirm-yes"
                                  disabled={isDeleting}
                                  onClick={() => handleDelete(rec.id)}
                                >
                                  {isDeleting ? "Deleting…" : "Yes, delete"}
                                </button>
                                <button
                                  className="mr-confirm-no"
                                  onClick={() => setConfirmId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()
        )}
      </div>

      {/* ── Upload Modal ── */}
      {showForm && (
        <div
          className="mr-overlay"
          onClick={(e) => e.target === e.currentTarget && resetForm()}
        >
          <div className="mr-modal">
            <div className="mr-modal-head">
              <span className="mr-modal-title">📤 Upload Medical Record</span>
              <button className="mr-modal-close" onClick={resetForm}>
                ✕
              </button>
            </div>
            <div className="mr-modal-body">
              {/* Dropzone */}
              {!file ? (
                <div
                  className={`mr-dropzone${dragOver ? " drag" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <div className="mr-dropzone-icon">📁</div>
                  <div className="mr-dropzone-text">
                    {dragOver
                      ? "Drop it here!"
                      : "Click or drag & drop your file"}
                  </div>
                  <div className="mr-dropzone-hint">
                    PDF, JPEG, PNG • max 20 MB
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: "none" }}
                    onChange={(e) =>
                      e.target.files[0] && acceptFile(e.target.files[0])
                    }
                  />
                </div>
              ) : (
                <div className="mr-file-selected">
                  <span style={{ fontSize: 22 }}>
                    {file.type.includes("pdf") ? "📄" : "🖼"}
                  </span>
                  <span className="mr-file-name">{file.name}</span>
                  <span
                    style={{ fontSize: 12, color: "#7a8fa6", flexShrink: 0 }}
                  >
                    {formatBytes(file.size)}
                  </span>
                  <button
                    className="mr-file-clear"
                    onClick={() => {
                      setFile(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Title */}
              <div className="mr-field">
                <label className="mr-label">Title *</label>
                <input
                  className="mr-input"
                  placeholder="e.g. Blood Test Results Jan 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="mr-field">
                <label className="mr-label">Category</label>
                <div className="mr-cat-grid">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      className={`mr-cat-pill${category === cat.value ? " selected" : ""}`}
                      style={
                        category === cat.value
                          ? {
                              background: cat.color,
                              color: cat.text,
                              borderColor: cat.border,
                            }
                          : {}
                      }
                      onClick={() => setCategory(cat.value)}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mr-field">
                <label className="mr-label">Notes (optional)</label>
                <textarea
                  className="mr-textarea"
                  placeholder="Add any notes about this document…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {uploadError && <div className="mr-err">⚠️ {uploadError}</div>}

              <button
                className="mr-upload-btn"
                style={{ marginTop: 14 }}
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span className="mr-spinner" />
                    Uploading…
                  </>
                ) : (
                  <>📤 Upload Record</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatBubbleButton />
    </>
  );
}
