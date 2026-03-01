import { useState } from "react";
import { registerUser } from "../utils/authService";
const RegisterForm = ({ onRegister }) => {
  const [role, setRole] = useState("patient");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDoctorWarning, setShowDoctorWarning] = useState(false);
  const [doctorWarningAcknowledged, setDoctorWarningAcknowledged] =
    useState(false);

  const roles = [
    { id: "patient", label: "Patient", icon: "🧑‍⚕️" },
    { id: "doctor", label: "Doctor", icon: "👨‍⚕️" },
  ];

  const validateForm = () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setError("");
    if (selectedRole === "doctor" && !doctorWarningAcknowledged) {
      setShowDoctorWarning(true);
    }
  };

  const handleAcknowledgeWarning = () => {
    setDoctorWarningAcknowledged(true);
    setShowDoctorWarning(false);
  };

  const handleCloseWarning = () => {
    setShowDoctorWarning(false);
    setRole("patient");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const data = await registerUser({
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        password: password,
        userType: role,
      });

      if (!data) {
        throw new Error("Registration failed. Please try again.");
      }

      setSuccess("Account created successfully! Redirecting to login...");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Redirect to login after 2 seconds
      if (onRegister) {
        setTimeout(() => onRegister(data), 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .register-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #f0f4f8;
          overflow: hidden;
        }

        /* ── Left Panel ── */
        .register-panel-left {
          flex: 0 0 55%;
          background: linear-gradient(155deg, #0a3d62 0%, #1a6fa0 55%, #27a0c8 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 60px 80px;
          position: relative;
          overflow: hidden;
        }

        .register-panel-left::before {
          content: '';
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          top: -140px;
          right: -180px;
        }
        .register-panel-left::after {
          content: '';
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          bottom: -80px;
          left: -80px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
          position: relative;
          z-index: 1;
        }
        .brand-icon {
          width: 48px;
          height: 48px;
          background: rgba(255,255,255,0.18);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          backdrop-filter: blur(6px);
        }
        .brand-name {
          font-family: 'Sora', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.3px;
        }
        .brand-name span { color: #7dd8f8; }

        .left-heading {
          font-family: 'Sora', sans-serif;
          font-size: 40px;
          font-weight: 700;
          color: #fff;
          line-height: 1.3;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }
        .left-heading em {
          font-style: normal;
          color: #7dd8f8;
        }

        .left-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.82);
          line-height: 1.7;
          max-width: 380px;
          position: relative;
          z-index: 1;
          margin-bottom: 36px;
        }

        .features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          z-index: 1;
        }
        .features li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14.5px;
          color: rgba(255,255,255,0.88);
          font-weight: 400;
          line-height: 1.5;
        }
        .feat-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #7dd8f8;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* ── Right Panel ── */
        .register-panel-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow-y: auto;
        }

        .register-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 16px;
          padding: 36px 32px;
          box-shadow: 0 8px 32px rgba(10,61,98,0.12), 0 2px 8px rgba(10,61,98,0.06);
        }

        .card-title {
          font-family: 'Sora', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #0a3d62;
          margin-bottom: 6px;
          letter-spacing: -0.3px;
        }
        .card-sub {
          font-size: 14px;
          color: #7a8fa6;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        /* Role Tabs */
        .role-tabs {
          display: flex;
          background: #f0f4f8;
          border-radius: 10px;
          padding: 3px;
          margin-bottom: 18px;
          gap: 2px;
        }
        .role-tab {
          flex: 1;
          padding: 8px 4px;
          border: none;
          border-radius: 8px;
          background: transparent;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #7a8fa6;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .role-tab.active {
          background: #fff;
          color: #0a3d62;
          box-shadow: 0 1px 4px rgba(10,61,98,0.1);
        }
        .role-tab:hover:not(.active) { color: #1a6fa0; }

        /* Form */
        .form-group {
          margin-bottom: 14px;
        }
        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #3a5068;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .input-wrap {
          position: relative;
        }
        .form-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #dde5ee;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #0a3d62;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: #fafdff;
        }
        .form-input::placeholder { color: #b0bec8; }
        .form-input:focus {
          border-color: #1a6fa0;
          box-shadow: 0 0 0 3px rgba(26,111,160,0.1);
          background: #fff;
        }
        .pw-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          color: #7a8fa6;
          padding: 4px;
          line-height: 1;
        }
        .pw-toggle:hover { color: #1a6fa0; }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        /* Messages */
        .error-box {
          background: #fff0f0;
          border: 1.5px solid #f5c0c0;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 12px;
          color: #c0392b;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          line-height: 1.4;
        }

        .success-box {
          background: #f0fff4;
          border: 1.5px solid #c0f5d0;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 12px;
          color: #16a34a;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          line-height: 1.4;
        }

        /* Submit */
        .submit-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #0a3d62 0%, #1a6fa0 100%);
          color: #fff;
          border: none;
          border-radius: 9px;
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.3px;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(10,61,98,0.24);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 4px;
        }
        .submit-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 5px 18px rgba(10,61,98,0.28);
        }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          text-align: center;
          font-size: 12px;
          color: #b0bec8;
          margin: 14px 0;
          position: relative;
        }
        .divider::before, .divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: #e4eaf0;
        }
        .divider::before { left: 0; }
        .divider::after { right: 0; }

        .login-row {
          text-align: center;
          font-size: 13px;
          color: #7a8fa6;
          line-height: 1.5;
        }
        .login-row a {
          color: #1a6fa0;
          text-decoration: none;
          font-weight: 600;
        }
        .login-row a:hover { text-decoration: underline; }

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }

        .modal-content {
          background: #fff;
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-title {
          font-family: 'Sora', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #0a3d62;
          margin: 0;
        }

        .modal-close-btn {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #7a8fa6;
          padding: 0;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .modal-close-btn:hover {
          color: #0a3d62;
          background: #f0f4f8;
          border-radius: 8px;
        }

        .modal-body {
          color: #3a5068;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .modal-body p {
          margin: 0 0 12px 0;
          font-size: 14px;
        }

        .modal-body p:first-child {
          font-weight: 600;
          color: #c0392b;
          margin-bottom: 16px;
        }

        .modal-body ul {
          margin: 12px 0;
          padding-left: 20px;
          list-style: disc;
        }

        .modal-body li {
          margin-bottom: 8px;
          font-size: 14px;
        }

        .modal-body strong {
          color: #0a3d62;
        }

        .modal-footer {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .modal-btn {
          padding: 11px 20px;
          border-radius: 8px;
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .modal-btn-secondary {
          background: #f0f4f8;
          color: #3a5068;
        }

        .modal-btn-secondary:hover {
          background: #dde5ee;
        }

        .modal-btn-primary {
          background: linear-gradient(135deg, #0a3d62 0%, #1a6fa0 100%);
          color: #fff;
          box-shadow: 0 4px 12px rgba(10, 61, 98, 0.2);
        }

        .modal-btn-primary:hover {
          opacity: 0.92;
          box-shadow: 0 6px 16px rgba(10, 61, 98, 0.25);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .register-panel-left { display: none; }
          .register-panel-right { padding: 16px; background: linear-gradient(155deg,#0a3d62,#1a6fa0); }
          .register-card { padding: 20px 16px; max-width: 100%; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="register-root">
        {/* Left decorative panel */}
        <div className="register-panel-left">
          <div className="brand">
            <div className="brand-icon">🏥</div>
            <div className="brand-name">
              Medi<span>Connect</span>
            </div>
          </div>

          <h1 className="left-heading">
            Join our
            <br />
            healthcare
            <br />
            <em>community.</em>
          </h1>
          <p className="left-sub">
            Connect with trusted doctors, manage your health records, and
            receive personalized care recommendations.
          </p>

          <ul className="features">
            <li>
              <span className="feat-dot" /> 24/7 access to healthcare
              specialists
            </li>
            <li>
              <span className="feat-dot" /> Encrypted patient data protection
            </li>
            <li>
              <span className="feat-dot" /> Appointment reminders & follow-ups
            </li>
            <li>
              <span className="feat-dot" /> Instant medical record sharing
            </li>
          </ul>
        </div>

        {/* Right registration panel */}
        <div className="register-panel-right">
          <div className="register-card">
            <h2 className="card-title">Create account</h2>
            <p className="card-sub">Join MediConnect to get started</p>

            {/* Role selector */}
            <div
              className="role-tabs"
              role="tablist"
              aria-label="Select account type"
            >
              {roles.map((r) => (
                <button
                  key={r.id}
                  role="tab"
                  aria-selected={role === r.id}
                  className={`role-tab${role === r.id ? " active" : ""}`}
                  onClick={() => handleRoleChange(r.id)}
                  type="button"
                >
                  <span>{r.icon}</span> {r.label}
                </button>
              ))}
            </div>

            {/* Doctor Registration Warning */}

            <form onSubmit={handleSubmit} noValidate>
              {/* Name fields */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="firstName">
                    First name
                  </label>
                  <div className="input-wrap">
                    <input
                      id="firstName"
                      type="text"
                      className="form-input"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lastName">
                    Last name
                  </label>
                  <div className="input-wrap">
                    <input
                      id="lastName"
                      type="text"
                      className="form-input"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email address
                </label>
                <div className="input-wrap">
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <div className="input-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: "44px" }}
                    required
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <div className="input-wrap">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingRight: "44px" }}
                    required
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="error-box" role="alert">
                  ⚠️ {error}
                </div>
              )}

              {/* Success message */}
              {success && (
                <div className="success-box" role="status">
                  ✓ {success}
                </div>
              )}

              {/* Submit */}
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner" /> Creating account…
                  </>
                ) : (
                  <>Create {role === "doctor" ? "Doctor" : "Patient"} Account</>
                )}
              </button>
            </form>

            <div className="divider">or</div>

            <div className="login-row">
              Already have an account? <a href="/login">Sign in here</a>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Warning Modal */}
      {showDoctorWarning && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">⚠️ Important Notice</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseWarning}
                aria-label="Close warning"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p>Registering as a doctor is a serious commitment.</p>
              <p>You will be required to:</p>
              <ul>
                <li>Submit verified medical credentials and licenses</li>
                <li>Undergo identity and qualification verification</li>
                <li>Comply with all medical and legal regulations</li>
                <li>Maintain professional liability insurance</li>
              </ul>
              <p>
                <strong>Legal Warning:</strong> Misrepresenting your medical
                credentials or practicing without proper qualifications is
                illegal and can result in criminal charges, hefty fines, and
                civil liability.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn modal-btn-secondary"
                onClick={handleCloseWarning}
              >
                Close
              </button>
              <button
                type="button"
                className="modal-btn modal-btn-primary"
                onClick={handleAcknowledgeWarning}
              >
                I Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RegisterForm;
