import { useState } from "react";
import {
  authenticatedFetch,
  getUserData,
  storeAuthData,
} from "../utils/authService";

const UpdateProfileForm = ({ user, onClose, onSuccess }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    birthdate: user?.birthdate || "",
    address: user?.address || "",
    emergency_contact: user?.emergency_contact || "",
    weight: user?.weight || "",
    gender: user?.gender || "",
    confirmPassword: "",
  });

  const pages = [
    { id: 1, title: "Personal Info", icon: "👤" },
    { id: 2, title: "Health", icon: "⚕️" },
    { id: 3, title: "Contact", icon: "📞" },
    { id: 4, title: "Security", icon: "🔐" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validatePage = (page) => {
    if (page === 1) {
      if (!formData.name.trim()) {
        setError("Full name is required");
        return false;
      }
      if (formData.name.trim().length < 2) {
        setError("Name must be at least 2 characters");
        return false;
      }
    }
    if (page === 3) {
      if (!formData.phone.trim()) {
        setError("Phone number is required");
        return false;
      }
      if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
        setError("Please enter a valid 10-digit phone number");
        return false;
      }
    }
    return true;
  };

  const isPageValid = (page) => {
    if (page === 1) {
      if (!formData.name.trim()) {
        return false;
      }
      if (formData.name.trim().length < 2) {
        return false;
      }
    }
    if (page === 3) {
      if (!formData.phone.trim()) {
        return false;
      }
      if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validatePage(currentPage)) {
      setCurrentPage(Math.min(currentPage + 1, pages.length));
    }
  };

  const handlePrev = () => {
    setCurrentPage(Math.max(currentPage - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.confirmPassword.trim()) {
      setError("Password confirmation is required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      const response = await authenticatedFetch(
        `${API_BASE_URL}/auth/api/v1/update-profile`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            birthdate: formData.birthdate || null,
            address: formData.address.trim() || null,
            emergency_contact: formData.emergency_contact.trim() || null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            gender: formData.gender || null,
            password: formData.confirmPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");

      const userData = getUserData();
      const updatedUserData = {
        ...userData,
        ...data.data.user,
      };
      storeAuthData({
        token: localStorage.getItem("token"),
        refreshToken: localStorage.getItem("refreshToken"),
        role: localStorage.getItem("role"),
        user: updatedUserData,
      });

      setTimeout(() => {
        if (onSuccess) onSuccess(updatedUserData);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upf-overlay" onClick={onClose}>
      <style>{`
        .upf-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
          backdrop-filter: blur(3px);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .upf-modal {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(10, 61, 98, 0.2);
          width: 92%;
          max-width: 880px;
          height: 620px;
          max-height: 92vh;
          overflow: hidden;
          animation: slideUp 0.3s ease-out;
          display: grid;
          grid-template-columns: 280px 1fr;
          position: relative;
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* ── LEFT PANEL ── */
        .upf-left-panel {
          background: linear-gradient(135deg, #0a3d62 0%, #1a6fa0 100%);
          padding: 32px 24px;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .upf-quote {
          margin-top: auto;
          padding-top: 20px;
          text-align: center;
          font-size: 11px;
          line-height: 1.7;
          opacity: 0.6;
          font-style: italic;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          width: 100%;
        }

        .upf-quote-mark {
          font-size: 28px;
          line-height: 1;
          opacity: 0.35;
          display: block;
          margin-bottom: 4px;
          font-style: normal;
        }

        .upf-profile-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: 3px solid rgba(125, 216, 248, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          margin-bottom: 20px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .upf-profile-name {
          font-family: 'Sora', sans-serif;
          font-size: 16px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 4px;
        }

        .upf-profile-email {
          font-size: 12px;
          opacity: 0.75;
          text-align: center;
          margin-bottom: 12px;
          word-break: break-all;
        }

        .upf-role-badge {
          background: rgba(125, 216, 248, 0.18);
          border: 1px solid rgba(125, 216, 248, 0.45);
          color: #7dd8f8;
          padding: 3px 14px;
          border-radius: 14px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .upf-profile-divider {
          width: 60px;
          height: 2px;
          background: rgba(125, 216, 248, 0.4);
          margin-bottom: 24px;
          border-radius: 1px;
        }

        .upf-account-status {
          width: 100%;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 20px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .upf-status-title {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          opacity: 0.65;
          letter-spacing: 0.6px;
        }

        .upf-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(34, 197, 94, 0.15);
          color: #86efac;
          border: 1px solid rgba(34, 197, 94, 0.35);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .upf-profile-info {
          width: 100%;
          font-size: 12px;
          line-height: 1.8;
        }

        .upf-info-row {
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .upf-info-row:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .upf-info-label {
          opacity: 0.7;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 2px;
        }

        .upf-info-value {
          font-weight: 600;
          font-size: 13px;
          color: rgba(255,255,255,0.95);
        }

        .upf-close-btn {
          background: #f0f4f8;
          border: none;
          color: #3a5068;
          font-size: 18px;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-family: inherit;
          flex-shrink: 0;
          line-height: 1;
        }

        .upf-close-btn:hover {
          background: #fee2e2;
          color: #991b1b;
          transform: rotate(90deg);
        }

        /* ── RIGHT PANEL ── */
        .upf-right-panel {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .upf-right-top {
          padding: 16px 24px;
          border-bottom: 1px solid #e4eaf0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          background: #fafcff;
        }

        .upf-steps {
          display: flex;
          gap: 6px;
          align-items: center;
          flex: 1;
          min-width: 0;
        }

        .upf-step-btn {
          height: 34px;
          border-radius: 17px;
          border: 2px solid #e4eaf0;
          background: #fff;
          color: #7a8fa6;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
          font-size: 14px;
          padding: 0 10px;
          white-space: nowrap;
          min-width: 34px;
          gap: 0;
          overflow: hidden;
        }

        .upf-step-btn:hover:not(:disabled) {
          border-color: #7dd8f8;
          color: #0a3d62;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(125, 216, 248, 0.25);
        }

        .upf-step-btn.active {
          background: linear-gradient(135deg, #0a3d62, #1a6fa0);
          color: #fff;
          border-color: #0a3d62;
          padding: 0 14px;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(10, 61, 98, 0.25);
        }

        .upf-step-btn.completed {
          background: #e8f5e9;
          color: #2e7d32;
          border-color: #a5d6a7;
        }

        .upf-step-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: -0.1px;
          max-width: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-width 0.25s ease, opacity 0.2s ease;
          white-space: nowrap;
        }

        .upf-step-btn.active .upf-step-label {
          max-width: 100px;
          opacity: 1;
        }

        .upf-content {
          padding: 24px 32px;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
        }

        .upf-alert {
          padding: 14px 16px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 24px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .upf-alert.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .upf-alert.success {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .upf-page {
          display: none;
          animation: fadeInPage 0.3s ease-out;
        }

        .upf-page.active {
          display: block;
        }

        @keyframes fadeInPage {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .upf-page-title {
          font-family: 'Sora', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #0a3d62;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .upf-page-desc {
          font-size: 13px;
          color: #7a8fa6;
          margin-bottom: 24px;
        }

        .upf-form-group {
          margin-bottom: 20px;
        }

        .upf-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #3a5068;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .upf-input, .upf-select {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e4eaf0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #3a5068;
          transition: all 0.2s;
          background: #fafcff;
          box-sizing: border-box;
        }

        .upf-input:focus, .upf-select:focus {
          outline: none;
          border-color: #7dd8f8;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(125, 216, 248, 0.1);
        }

        .upf-input::placeholder {
          color: #b0bec8;
        }

        .upf-input:disabled, .upf-select:disabled {
          background: #f0f4f8;
          color: #b0bec8;
          cursor: not-allowed;
        }

        .upf-email-notice {
          background: #efe6ff;
          border: 1px solid #ddd6fe;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 12px;
          color: #6b21a8;
          margin-bottom: 16px;
        }

        .upf-footer {
          padding: 24px 32px;
          background: #f8fafb;
          border-top: 1px solid #e4eaf0;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .upf-btn {
          padding: 12px 24px;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .upf-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .upf-btn-secondary {
          background: #e4eaf0;
          color: #3a5068;
        }

        .upf-btn-secondary:hover:not(:disabled) {
          background: #d0d8e0;
          transform: translateY(-1px);
        }

        .upf-btn-primary {
          background: linear-gradient(135deg, #0a3d62, #1a6fa0);
          color: #fff;
          box-shadow: 0 4px 14px rgba(10, 61, 98, 0.2);
        }

        .upf-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(10, 61, 98, 0.3);
        }

        .upf-spinner {
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

        @media (max-width: 900px) {
          .upf-modal {
            grid-template-columns: 1fr;
          }

          .upf-left-panel {
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 24px;
          }

          .upf-profile-avatar {
            width: 80px;
            height: 80px;
            font-size: 40px;
          }
        }

        @media (max-width: 600px) {
          .upf-modal {
            max-width: 95%;
          }

          .upf-content {
            padding: 20px;
          }

          .upf-footer {
            padding: 16px 20px;
          }

          .upf-left-panel {
            padding: 20px;
          }
        }
      `}</style>

      <div className="upf-modal" onClick={(e) => e.stopPropagation()}>
        {/* Left Panel - Profile Info */}
        <div className="upf-left-panel">
          <div className="upf-profile-avatar">
            {user?.userType === "doctor"
              ? "👨‍⚕️"
              : user?.userType === "admin"
                ? "👨‍💼"
                : "👤"}
          </div>

          <div className="upf-profile-name">{user?.name || "User"}</div>
          <div className="upf-profile-email">{user?.email}</div>
          <div className="upf-role-badge">
            {user?.userType === "doctor"
              ? "Doctor"
              : user?.userType === "admin"
                ? "Administrator"
                : "Patient"}
          </div>
          <div className="upf-profile-divider"></div>

          <div className="upf-account-status">
            <div className="upf-status-title">Account Status</div>
            <div className="upf-status-badge">✓ Active</div>
          </div>

          <div className="upf-quote">
            <span className="upf-quote-mark">&#8220;</span>
            Your health is an investment, not an expense. Keep your records up
            to date.
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="upf-right-panel">
          {/* Top - Steps */}
          <div className="upf-right-top">
            <div className="upf-steps">
              {pages.map((page) => (
                <button
                  key={page.id}
                  className={`upf-step-btn ${
                    currentPage === page.id
                      ? "active"
                      : currentPage > page.id
                        ? "completed"
                        : ""
                  }`}
                  onClick={() => {
                    if (currentPage > page.id && isPageValid(currentPage)) {
                      setCurrentPage(page.id);
                    } else if (
                      currentPage < page.id &&
                      isPageValid(currentPage)
                    ) {
                      setCurrentPage(page.id);
                    } else if (currentPage !== page.id) {
                      validatePage(currentPage);
                    }
                  }}
                  disabled={
                    Math.abs(currentPage - page.id) > 1 &&
                    !isPageValid(currentPage)
                  }
                  title={page.title}
                >
                  <span>{page.icon}</span>
                  <span className="upf-step-label">{page.title}</span>
                </button>
              ))}
            </div>
            <button className="upf-close-btn" onClick={onClose} title="Close">
              ×
            </button>
          </div>

          {/* Content */}
          <form className="upf-content" onSubmit={handleSubmit}>
            {error && (
              <div className="upf-alert error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="upf-alert success">
                <span>✓</span>
                <span>{success}</span>
              </div>
            )}

            {/* Page 1: Personal Info */}
            <div className={`upf-page ${currentPage === 1 ? "active" : ""}`}>
              <div className="upf-page-title">
                <span>👤</span> Personal Information
              </div>
              <p className="upf-page-desc">Update your basic profile details</p>

              <div className="upf-form-group">
                <label className="upf-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  className="upf-input"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="upf-form-group">
                <label className="upf-label">Gender</label>
                <select
                  name="gender"
                  className="upf-select"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="upf-form-group">
                <label className="upf-label">Email *</label>
                <input
                  type="text"
                  name="email"
                  className="upf-input"
                  placeholder="Enter your email address"
                  value={user?.email || ""}
                  onChange={handleInputChange}
                  disabled={true}
                />
              </div>
            </div>

            {/* Page 2: Health */}
            <div className={`upf-page ${currentPage === 2 ? "active" : ""}`}>
              <div className="upf-page-title">
                <span>⚕️</span> Health Information
              </div>
              <p className="upf-page-desc">Your health-related information</p>

              <div className="upf-form-group">
                <label className="upf-label">Date of Birth</label>
                {user?.birthdate && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#7a8fa6",
                      marginBottom: "8px",
                      padding: "6px 10px",
                      background: "#f0f4f8",
                      borderRadius: "8px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>🎂</span>
                    <span>
                      Current:{" "}
                      <strong style={{ color: "#3a5068" }}>
                        {user.birthdate.includes("T")
                          ? new Date(user.birthdate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : new Date(
                              user.birthdate + "T12:00:00",
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                      </strong>
                    </span>
                  </div>
                )}
                <input
                  type="date"
                  name="birthdate"
                  className="upf-input"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>

              <div className="upf-form-group">
                <label className="upf-label">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  className="upf-input"
                  placeholder="Enter your weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  disabled={loading}
                  step="0.1"
                  min="0"
                />
              </div>
            </div>

            {/* Page 3: Contact */}
            <div className={`upf-page ${currentPage === 3 ? "active" : ""}`}>
              <div className="upf-page-title">
                <span>📞</span> Contact Information
              </div>
              <p className="upf-page-desc">Update your contact details</p>

              <div className="upf-form-group">
                <label className="upf-label">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  className="upf-input"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="upf-form-group">
                <label className="upf-label">Emergency Contact</label>
                <input
                  type="tel"
                  name="emergency_contact"
                  className="upf-input"
                  placeholder="Emergency contact number"
                  value={formData.emergency_contact}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>

              <div className="upf-form-group">
                <label className="upf-label">Address</label>
                <input
                  type="text"
                  name="address"
                  className="upf-input"
                  placeholder="Enter your full address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Page 4: Security */}
            <div className={`upf-page ${currentPage === 4 ? "active" : ""}`}>
              <div className="upf-page-title">
                <span>🔐</span> Security
              </div>
              <p className="upf-page-desc">
                Confirm your password to save changes
              </p>

              <div className="upf-form-group">
                <label className="upf-label">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="upf-input"
                  placeholder="Enter your password to confirm changes"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="upf-footer">
            <button
              type="button"
              className="upf-btn upf-btn-secondary"
              onClick={handlePrev}
              disabled={currentPage === 1 || loading}
            >
              ← Back
            </button>
            {currentPage < pages.length ? (
              <button
                type="button"
                className="upf-btn upf-btn-primary"
                onClick={handleNext}
                disabled={loading}
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                className="upf-btn upf-btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="upf-spinner"></span>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfileForm;
