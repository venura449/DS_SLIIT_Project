import { useState, useEffect } from "react";
import {
  logoutUser,
  getAuthToken,
  authenticatedFetch,
} from "../../utils/authService";
import {
  submitForVerification,
  getVerificationDocuments,
  getVerificationStatus,
} from "../../utils/verificationService";
import UpdateProfileForm from "../UpdateProfileForm";
import PDFUploader from "../PDFUploader";
import ScheduleManager from "../ScheduleManager";

const navItems = [
  { id: "overview", icon: "⊞", label: "Overview" },
  { id: "schedule", icon: "📅", label: "Schedule" },
  { id: "patients", icon: "👥", label: "Patients" },
  { id: "consultations", icon: "💬", label: "Consultations" },
  { id: "prescriptions", icon: "💊", label: "Prescriptions" },
  { id: "verification", icon: "✅", label: "Verification" },
  { id: "profile", icon: "👤", label: "Profile" },
];

const pageTitles = {
  overview: "Overview",
  schedule: "Schedule",
  patients: "Patients",
  consultations: "Consultations",
  prescriptions: "Prescriptions",
  verification: "Verification Status",
  profile: "Doctor Profile",
};

const DoctorDashboard = ({ user: initialUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState(initialUser);
  const [uploadedDocuments, setUploadedDocuments] = useState({});
  const [uploadError, setUploadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [submittedDocs, setSubmittedDocs] = useState([]);
  const [loadingVerification, setLoadingVerification] = useState(false);

  // Doctor public profile
  const [docProfile, setDocProfile] = useState({
    name: "",
    specialization: "",
    consultationFee: "",
    bio: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Load doctor public profile when the profile tab is opened
  useEffect(() => {
    if (activeTab !== "profile") return;
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess("");
    const API_BASE = import.meta.env.VITE_API_BASE_URL;
    authenticatedFetch(`${API_BASE}/doctors/api/v1/public/profile`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          const p = data.data;
          setDocProfile({
            name: p.name || "",
            specialization: p.specialization || "",
            consultationFee:
              p.consultation_fee != null ? String(p.consultation_fee) : "",
            bio: p.bio || "",
          });
        }
      })
      .catch(() => setProfileError("Failed to load profile."))
      .finally(() => setProfileLoading(false));
  }, [activeTab]);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL;
      const res = await authenticatedFetch(
        `${API_BASE}/doctors/api/v1/public/profile`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: docProfile.name,
            specialization: docProfile.specialization,
            consultationFee: docProfile.consultationFee
              ? parseFloat(docProfile.consultationFee)
              : null,
            bio: docProfile.bio,
          }),
        },
      );
      const data = await res.json();
      if (data.success) setProfileSuccess("Profile saved successfully!");
      else setProfileError(data.message || "Failed to save profile.");
    } catch {
      setProfileError("Failed to save profile.");
    }
    setProfileSaving(false);
  };

  useEffect(() => {
    const loadVerification = async () => {
      setLoadingVerification(true);
      const [statusResult, docsResult] = await Promise.all([
        getVerificationStatus(),
        getVerificationDocuments(),
      ]);
      if (statusResult.success) setVerificationStatus(statusResult.status);
      if (docsResult.success) setSubmittedDocs(docsResult.documents);
      setLoadingVerification(false);
    };
    loadVerification();
  }, []);

  const handleLogout = () => {
    logoutUser();
    if (onLogout) onLogout();
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleDocumentUpload = (documentType, uploadResponse) => {
    if (uploadResponse.success) {
      setUploadedDocuments((prev) => ({
        ...prev,
        [documentType]: uploadResponse,
      }));
      setUploadError("");
    }
  };

  const handleUploadError = (documentType, error) => {
    setUploadError(`Error uploading ${documentType}: ${error}`);
  };

  const handleSubmitForVerification = async () => {
    const documentCount = Object.keys(uploadedDocuments).length;
    if (documentCount === 0) {
      setUploadError("Please upload at least one document before submitting");
      return;
    }

    setSubmitting(true);
    setUploadError("");

    try {
      const result = await submitForVerification();
      if (!result.success) {
        setUploadError(result.error || "Failed to submit for verification");
        return;
      }

      // Refresh status and docs from backend
      const [statusResult, docsResult] = await Promise.all([
        getVerificationStatus(),
        getVerificationDocuments(),
      ]);
      if (statusResult.success) setVerificationStatus(statusResult.status);
      if (docsResult.success) setSubmittedDocs(docsResult.documents);
      setUploadedDocuments({});
      setUploadError("");
    } catch (err) {
      setUploadError(err.message || "Failed to submit for verification");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');

        .dd-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #f4f7fb;
        }

        /* â”€â”€ Sidebar â”€â”€ */
        .dd-sidebar {
          width: 220px;
          min-height: 100vh;
          background: #0a3d62;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0;
          z-index: 100;
        }
        .dd-brand {
          padding: 18px 16px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .dd-brand-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dd-brand-icon {
          width: 34px; height: 34px;
          background: rgba(125,216,248,0.18);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
        }
        .dd-brand-name {
          font-family: 'Sora', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          line-height: 1;
        }
        .dd-brand-name span { color: #7dd8f8; }
        .dd-brand-sub {
          font-size: 10px;
          color: rgba(255,255,255,0.45);
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .dd-nav {
          flex: 1;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .dd-nav-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 11px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          transition: all 0.15s;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-family: 'DM Sans', sans-serif;
        }
        .dd-nav-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .dd-nav-btn.active { background: rgba(125,216,248,0.15); color: #7dd8f8; }
        .dd-nav-btn .ni { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }

        .dd-footer {
          padding: 12px 14px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .dd-footer-user {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 10px;
        }
        .dd-avatar {
          width: 32px; height: 32px;
          background: rgba(125,216,248,0.2);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .dd-footer-name {
          font-size: 12.5px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .dd-footer-email {
          font-size: 10.5px;
          color: rgba(255,255,255,0.4);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .dd-footer-meta { flex: 1; min-width: 0; }
        .dd-signout {
          width: 100%;
          padding: 7px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
          border-radius: 6px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .dd-signout:hover {
          background: rgba(255,70,70,0.15);
          border-color: rgba(255,70,70,0.25);
          color: #ff9999;
        }

        /* â”€â”€ Main â”€â”€ */
        .dd-main {
          margin-left: 220px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .dd-topbar {
          background: #fff;
          border-bottom: 1px solid #e4eaf0;
          padding: 0 24px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0; z-index: 50;
        }
        .dd-topbar-title {
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #0a3d62;
        }
        .dd-topbar-right {
          font-size: 12.5px;
          color: #7a8fa6;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dd-profile-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(10, 61, 98, 0.1), rgba(125, 216, 248, 0.1));
          border: 1.5px solid #e4eaf0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-size: 16px;
        }
        .dd-profile-btn:hover {
          background: linear-gradient(135deg, rgba(10, 61, 98, 0.15), rgba(125, 216, 248, 0.15));
          border-color: #7dd8f8;
          transform: scale(1.05);
        }
        .dd-content { padding: 22px 24px; }

        /* â”€â”€ Alert banner â”€â”€ */
        .dd-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 11px 14px;
          margin-bottom: 18px;
          font-size: 13px;
          color: #92400e;
        }
        .dd-alert-icon { font-size: 15px; flex-shrink: 0; }

        /* â”€â”€ Stat cards â”€â”€ */
        .dd-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }
        .dd-stat {
          background: #fff;
          border: 1px solid #e4eaf0;
          border-radius: 10px;
          padding: 16px 18px;
        }
        .dd-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .dd-stat-label {
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #7a8fa6;
        }
        .dd-stat-icon { font-size: 20px; opacity: 0.65; }
        .dd-stat-value {
          font-family: 'Sora', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #0a3d62;
          line-height: 1;
          margin-bottom: 3px;
        }
        .dd-stat-sub { font-size: 11px; color: #b0bec8; }

        /* â”€â”€ Sections â”€â”€ */
        .dd-section {
          background: #fff;
          border: 1px solid #e4eaf0;
          border-radius: 10px;
          padding: 20px 22px;
          margin-bottom: 14px;
        }
        .dd-section-title {
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #0a3d62;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .dd-empty {
          text-align: center;
          padding: 28px 16px;
          color: #b0bec8;
        }
        .dd-empty-icon { font-size: 32px; margin-bottom: 8px; opacity: 0.45; }
        .dd-empty p { font-size: 13px; }

        /* â”€â”€ Buttons â”€â”€ */
        .dd-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 8px 16px;
          border-radius: 7px;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
        }
        .dd-btn-primary {
          background: linear-gradient(135deg, #0a3d62, #1a6fa0);
          color: #fff;
          box-shadow: 0 2px 6px rgba(10,61,98,0.18);
        }
        .dd-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }

        /* â”€â”€ Page header â”€â”€ */
        .dd-page-head { margin-bottom: 18px; }
        .dd-page-head h2 {
          font-family: 'Sora', sans-serif;
          font-size: 19px;
          font-weight: 700;
          color: #0a3d62;
          margin-bottom: 2px;
        }
        .dd-page-head p { font-size: 13px; color: #7a8fa6; }

        /* â”€â”€ Verification checklist â”€â”€ */
        .dd-checklist { list-style: none; padding: 0; margin: 12px 0 16px; }
        .dd-checklist li {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid #f0f4f8;
          font-size: 13px;
          color: #3a5068;
        }
        .dd-checklist li:last-child { border-bottom: none; }
        .dd-check-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #e4eaf0;
          flex-shrink: 0;
        }
      `}</style>

      <div className="dd-root">
        {/* Sidebar */}
        <aside className="dd-sidebar">
          <div className="dd-brand">
            <div className="dd-brand-row">
              <div className="dd-brand-icon">🏥</div>
              <div>
                <div className="dd-brand-name">
                  Medi<span>Connect</span>
                </div>
                <div className="dd-brand-sub">Doctor Portal</div>
              </div>
            </div>
          </div>

          <nav className="dd-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`dd-nav-btn${activeTab === item.id ? " active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="ni">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="dd-footer">
            <div className="dd-footer-user">
              <div className="dd-avatar">👨‍⚕️</div>
              <div className="dd-footer-meta">
                <div className="dd-footer-name">
                  Dr. {user?.name || "Doctor"}
                </div>
                <div className="dd-footer-email">{user?.email || ""}</div>
              </div>
            </div>
            <button className="dd-signout" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </aside>

        {/* Main area */}
        <div className="dd-main">
          <header className="dd-topbar">
            <span className="dd-topbar-title">{pageTitles[activeTab]}</span>
            <div className="dd-topbar-right">
              <button
                className="dd-profile-btn"
                onClick={() => setShowProfile(true)}
                title="Edit profile"
              >
                👨‍⚕️
              </button>
              <span>Dr. {user?.name || "Doctor"}</span>
            </div>
          </header>

          <div className="dd-content">
            {activeTab === "overview" && (
              <>
                <div className="dd-page-head">
                  <h2>Welcome, Dr. {user?.name || "Doctor"} ðŸ‘‹</h2>
                  <p>Here's a summary of your activity today.</p>
                </div>
                <div className="dd-stats">
                  <div className="dd-stat">
                    <div className="dd-stat-top">
                      <div className="dd-stat-label">Today's Appointments</div>
                      <div className="dd-stat-icon">ðŸ“…</div>
                    </div>
                    <div className="dd-stat-value">0</div>
                    <div className="dd-stat-sub">None scheduled</div>
                  </div>
                  <div className="dd-stat">
                    <div className="dd-stat-top">
                      <div className="dd-stat-label">Total Patients</div>
                      <div className="dd-stat-icon">ðŸ‘¥</div>
                    </div>
                    <div className="dd-stat-value">0</div>
                    <div className="dd-stat-sub">No patients yet</div>
                  </div>
                  <div className="dd-stat">
                    <div className="dd-stat-top">
                      <div className="dd-stat-label">Consultations</div>
                      <div className="dd-stat-icon">ðŸ’¬</div>
                    </div>
                    <div className="dd-stat-value">0</div>
                    <div className="dd-stat-sub">No active sessions</div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "schedule" && (
              <>
                <div className="dd-page-head">
                  <h2>Schedule</h2>
                  <p>Manage your working hours and availability.</p>
                </div>
                <div className="dd-section">
                  <ScheduleManager />
                </div>
              </>
            )}

            {activeTab === "patients" && (
              <>
                <div className="dd-page-head">
                  <h2>Patients</h2>
                  <p>View and manage your registered patients.</p>
                </div>
                <div className="dd-section">
                  <div className="dd-empty">
                    <div className="dd-empty-icon">ðŸ‘¥</div>
                    <p>No patients yet.</p>
                  </div>
                </div>
              </>
            )}

            {activeTab === "consultations" && (
              <>
                <div className="dd-page-head">
                  <h2>Video Consultations</h2>
                  <p>Active and upcoming video sessions with patients.</p>
                </div>
                <div className="dd-section">
                  <div className="dd-empty">
                    <div className="dd-empty-icon">ðŸ’¬</div>
                    <p>No active consultations at this time.</p>
                  </div>
                </div>
              </>
            )}

            {activeTab === "prescriptions" && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "18px",
                  }}
                >
                  <div className="dd-page-head" style={{ marginBottom: 0 }}>
                    <h2>Prescriptions</h2>
                    <p>Issue and manage patient prescriptions.</p>
                  </div>
                  <button className="dd-btn dd-btn-primary">
                    + New Prescription
                  </button>
                </div>
                <div className="dd-section">
                  <div className="dd-empty">
                    <div className="dd-empty-icon">ðŸ’Š</div>
                    <p>No prescriptions issued yet.</p>
                  </div>
                </div>
              </>
            )}

            {activeTab === "verification" && (
              <>
                <div className="dd-page-head">
                  <h2>Verification Status</h2>
                  <p>
                    Submit your credentials to activate your doctor account.
                  </p>
                </div>
                {(!verificationStatus ||
                  verificationStatus.status === "pending" ||
                  verificationStatus.status === "no_documents" ||
                  verificationStatus.status === "rejected") && (
                  <div className="dd-section">
                    <div className="dd-section-title">
                      📋 Required Documents
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#7a8fa6",
                        marginBottom: "18px",
                        lineHeight: "1.5",
                      }}
                    >
                      Please upload all required documents in PDF format. Each
                      file should not exceed 25MB. Your documents will be
                      securely stored and reviewed by our verification team.
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "20px",
                      }}
                    >
                      <div>
                        <PDFUploader
                          label="Medical License"
                          documentType="license"
                          token={getAuthToken()}
                          onSuccess={(response) =>
                            handleDocumentUpload("license", response)
                          }
                          onError={(error) =>
                            handleUploadError("Medical License", error)
                          }
                        />
                      </div>

                      <div>
                        <PDFUploader
                          label="Government-issued ID"
                          documentType="government_id"
                          token={getAuthToken()}
                          onSuccess={(response) =>
                            handleDocumentUpload("government_id", response)
                          }
                          onError={(error) =>
                            handleUploadError("Government ID", error)
                          }
                        />
                      </div>

                      <div>
                        <PDFUploader
                          label="Professional Credentials"
                          documentType="credentials"
                          token={getAuthToken()}
                          onSuccess={(response) =>
                            handleDocumentUpload("credentials", response)
                          }
                          onError={(error) =>
                            handleUploadError("Credentials", error)
                          }
                        />
                      </div>

                      <div>
                        <PDFUploader
                          label="Insurance Certificate"
                          documentType="insurance"
                          token={getAuthToken()}
                          onSuccess={(response) =>
                            handleDocumentUpload("insurance", response)
                          }
                          onError={(error) =>
                            handleUploadError("Insurance Certificate", error)
                          }
                        />
                      </div>
                    </div>

                    {uploadError && (
                      <div
                        style={{
                          marginTop: "16px",
                          padding: "10px 14px",
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          borderRadius: "8px",
                          fontSize: "13px",
                          color: "#dc2626",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span>⚠️</span>
                        {uploadError}
                      </div>
                    )}

                    <div style={{ marginTop: "20px" }}>
                      <button
                        className="dd-btn dd-btn-primary"
                        onClick={handleSubmitForVerification}
                        disabled={
                          submitting ||
                          Object.keys(uploadedDocuments).length === 0
                        }
                      >
                        {submitting ? (
                          <>
                            <span
                              style={{
                                display: "inline-block",
                                width: "14px",
                                height: "14px",
                                border: "2px solid rgba(255, 255, 255, 0.3)",
                                borderTopColor: "#fff",
                                borderRadius: "50%",
                                animation: "spin 0.6s linear infinite",
                                marginRight: "6px",
                              }}
                            ></span>
                            Submitting...
                          </>
                        ) : Object.keys(uploadedDocuments).length > 0 ? (
                          "✓ Documents Uploaded - Submit for Review"
                        ) : (
                          "Upload Documents First"
                        )}
                      </button>
                    </div>
                  </div>
                )}
                <div className="dd-section">
                  <div className="dd-section-title">✅ Current Status</div>
                  {loadingVerification ? (
                    <div style={{ fontSize: "13px", color: "#7a8fa6" }}>
                      Loading status…
                    </div>
                  ) : verificationStatus ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        {verificationStatus.status === "approved" && (
                          <span
                            style={{
                              background: "#f0fdf4",
                              border: "1px solid #86efac",
                              color: "#15803d",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            ✓ Approved
                          </span>
                        )}
                        {verificationStatus.status ===
                          "submitted_for_review" && (
                          <span
                            style={{
                              background: "#eff6ff",
                              border: "1px solid #93c5fd",
                              color: "#1d4ed8",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            🔍 Under Review
                          </span>
                        )}
                        {verificationStatus.status === "rejected" && (
                          <span
                            style={{
                              background: "#fff1f1",
                              border: "1px solid #fca5a5",
                              color: "#dc2626",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            ✕ Rejected
                          </span>
                        )}
                        {(verificationStatus.status === "pending" ||
                          verificationStatus.status === "no_documents") && (
                          <span
                            style={{
                              background: "#fffbeb",
                              border: "1px solid #fcd34d",
                              color: "#92400e",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            ⏳ Pending Submission
                          </span>
                        )}
                        <span style={{ fontSize: "13px", color: "#7a8fa6" }}>
                          {verificationStatus.documentsSubmitted} of{" "}
                          {verificationStatus.totalRequired} documents submitted
                        </span>
                      </div>
                      {verificationStatus.status === "rejected" &&
                        verificationStatus.rejectionReason && (
                          <div
                            style={{
                              marginTop: "10px",
                              padding: "10px 14px",
                              background: "#fff1f1",
                              border: "1px solid #fca5a5",
                              borderRadius: "8px",
                              fontSize: "13px",
                              color: "#dc2626",
                            }}
                          >
                            <strong>Rejection reason:</strong>{" "}
                            {verificationStatus.rejectionReason}
                          </div>
                        )}
                    </>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span
                        style={{
                          background: "#fffbeb",
                          border: "1px solid #fcd34d",
                          color: "#92400e",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        ⏳ Pending Submission
                      </span>
                      <span style={{ fontSize: "13px", color: "#7a8fa6" }}>
                        Upload and submit your documents to begin verification.
                      </span>
                    </div>
                  )}

                  {submittedDocs.length > 0 && (
                    <div style={{ marginTop: "16px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#3a5068",
                          textTransform: "uppercase",
                          letterSpacing: "0.4px",
                          marginBottom: "10px",
                        }}
                      >
                        Submitted Documents
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(200px, 1fr))",
                          gap: "10px",
                        }}
                      >
                        {submittedDocs.map((doc) => (
                          <div
                            key={doc.id}
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e4eaf0",
                              borderRadius: "8px",
                              padding: "10px 12px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.4px",
                                color: "#0a3d62",
                                marginBottom: "4px",
                              }}
                            >
                              {doc.documentType === "license" &&
                                "Medical License"}
                              {doc.documentType === "government_id" &&
                                "Government ID"}
                              {doc.documentType === "credentials" &&
                                "Professional Credentials"}
                              {doc.documentType === "insurance" &&
                                "Insurance Certificate"}
                              {![
                                "license",
                                "government_id",
                                "credentials",
                                "insurance",
                              ].includes(doc.documentType) && doc.documentType}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#3a5068",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {doc.fileName}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#b0bec8",
                                marginTop: "2px",
                              }}
                            >
                              {new Date(
                                doc.savedAt || doc.uploadedAt,
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <a
                              href={`${import.meta.env.VITE_API_BASE_URL}/doctors${doc.documentUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                marginTop: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 9px",
                                borderRadius: "5px",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                textDecoration: "none",
                                border: "1px solid #93c5fd",
                              }}
                            >
                              📄 View PDF
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(uploadedDocuments).length > 0 && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "12px 14px",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: "#166534",
                      }}
                    >
                      <strong>{Object.keys(uploadedDocuments).length}</strong>{" "}
                      new document
                      {Object.keys(uploadedDocuments).length !== 1
                        ? "s"
                        : ""}{" "}
                      ready to submit
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "profile" && (
              <>
                <div className="dd-page-head">
                  <h2>Doctor Profile</h2>
                  <p>
                    This information is shown to patients when they browse and
                    book appointments.
                  </p>
                </div>
                <div className="dd-section" style={{ maxWidth: 560 }}>
                  {profileLoading ? (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#7a8fa6",
                        padding: "12px 0",
                      }}
                    >
                      Loading profile…
                    </div>
                  ) : (
                    <>
                      {profileSuccess && (
                        <div
                          style={{
                            marginBottom: 16,
                            padding: "10px 14px",
                            background: "#f0fdf4",
                            border: "1px solid #86efac",
                            borderRadius: 8,
                            fontSize: 13,
                            color: "#15803d",
                          }}
                        >
                          ✓ {profileSuccess}
                        </div>
                      )}
                      {profileError && (
                        <div
                          style={{
                            marginBottom: 16,
                            padding: "10px 14px",
                            background: "#fff1f1",
                            border: "1px solid #fca5a5",
                            borderRadius: 8,
                            fontSize: 13,
                            color: "#dc2626",
                          }}
                        >
                          ⚠ {profileError}
                        </div>
                      )}

                      {/* Name */}
                      <div style={{ marginBottom: 16 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#3a5068",
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                            marginBottom: 6,
                          }}
                        >
                          Full Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. John Smith"
                          value={docProfile.name}
                          onChange={(e) =>
                            setDocProfile((p) => ({
                              ...p,
                              name: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            border: "1.5px solid #e4eaf0",
                            borderRadius: 8,
                            fontSize: 14,
                            fontFamily: "'DM Sans', sans-serif",
                            color: "#1a3a52",
                            background: "#fff",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      {/* Specialization */}
                      <div style={{ marginBottom: 16 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#3a5068",
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                            marginBottom: 6,
                          }}
                        >
                          Specialization
                        </label>
                        <select
                          value={docProfile.specialization}
                          onChange={(e) =>
                            setDocProfile((p) => ({
                              ...p,
                              specialization: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            border: "1.5px solid #e4eaf0",
                            borderRadius: 8,
                            fontSize: 14,
                            fontFamily: "'DM Sans', sans-serif",
                            color: docProfile.specialization ? "#1a3a52" : "#7a8fa6",
                            background: "#fff",
                            boxSizing: "border-box",
                            appearance: "auto",
                          }}
                        >
                          <option value="">— Select specialization —</option>
                          <option value="General Practice">General Practice</option>
                          <option value="Internal Medicine">Internal Medicine</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Dermatology">Dermatology</option>
                          <option value="Endocrinology">Endocrinology</option>
                          <option value="Gastroenterology">Gastroenterology</option>
                          <option value="Geriatrics">Geriatrics</option>
                          <option value="Hematology">Hematology</option>
                          <option value="Infectious Disease">Infectious Disease</option>
                          <option value="Nephrology">Nephrology</option>
                          <option value="Neurology">Neurology</option>
                          <option value="Oncology">Oncology</option>
                          <option value="Ophthalmology">Ophthalmology</option>
                          <option value="Orthopedics">Orthopedics</option>
                          <option value="Otolaryngology (ENT)">Otolaryngology (ENT)</option>
                          <option value="Pediatrics">Pediatrics</option>
                          <option value="Psychiatry">Psychiatry</option>
                          <option value="Pulmonology">Pulmonology</option>
                          <option value="Radiology">Radiology</option>
                          <option value="Rheumatology">Rheumatology</option>
                          <option value="Surgery (General)">Surgery (General)</option>
                          <option value="Surgery (Cardiothoracic)">Surgery (Cardiothoracic)</option>
                          <option value="Surgery (Neurosurgery)">Surgery (Neurosurgery)</option>
                          <option value="Surgery (Plastic)">Surgery (Plastic)</option>
                          <option value="Surgery (Vascular)">Surgery (Vascular)</option>
                          <option value="Urology">Urology</option>
                          <option value="Obstetrics & Gynecology">Obstetrics &amp; Gynecology</option>
                          <option value="Anesthesiology">Anesthesiology</option>
                          <option value="Emergency Medicine">Emergency Medicine</option>
                          <option value="Family Medicine">Family Medicine</option>
                          <option value="Pathology">Pathology</option>
                          <option value="Physical Medicine & Rehabilitation">Physical Medicine &amp; Rehabilitation</option>
                          <option value="Sports Medicine">Sports Medicine</option>
                        </select>
                      </div>

                      {/* Consultation fee */}
                      <div style={{ marginBottom: 16 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#3a5068",
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                            marginBottom: 6,
                          }}
                        >
                          Consultation Fee (Rs.)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 50.00"
                          value={docProfile.consultationFee}
                          onChange={(e) =>
                            setDocProfile((p) => ({
                              ...p,
                              consultationFee: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            border: "1.5px solid #e4eaf0",
                            borderRadius: 8,
                            fontSize: 14,
                            fontFamily: "'DM Sans', sans-serif",
                            color: "#1a3a52",
                            background: "#fff",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      {/* Bio */}
                      <div style={{ marginBottom: 20 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#3a5068",
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                            marginBottom: 6,
                          }}
                        >
                          Short Bio
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Tell patients about your experience and approach…"
                          value={docProfile.bio}
                          onChange={(e) =>
                            setDocProfile((p) => ({
                              ...p,
                              bio: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            border: "1.5px solid #e4eaf0",
                            borderRadius: 8,
                            fontSize: 14,
                            fontFamily: "'DM Sans', sans-serif",
                            color: "#1a3a52",
                            background: "#fff",
                            resize: "vertical",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      <button
                        className="dd-btn dd-btn-primary"
                        onClick={handleSaveProfile}
                        disabled={profileSaving}
                      >
                        {profileSaving ? "Saving…" : "Save Profile"}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showProfile && (
        <UpdateProfileForm
          user={user}
          onClose={() => setShowProfile(false)}
          onSuccess={handleProfileUpdate}
        />
      )}
    </>
  );
};

export default DoctorDashboard;
