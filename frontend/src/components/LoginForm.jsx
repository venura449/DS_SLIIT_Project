import { useState } from "react";
import { loginUser } from "../utils/authService";

const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginUser(email, password);

      // Validate response data
      if (!data || !data.token || !data.role) {
        throw new Error("Invalid login response. Please try again.");
      }

      // Persist authentication state
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("user", JSON.stringify(data.user || {}));

      // Call onLogin callback for navigation
      if (onLogin) {
        onLogin(data);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.message || "An unexpected error occurred. Please try again.",
      );
      setIsLoading(false);
    }
  };
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #f0f4f8;
          overflow: hidden;
        }

        /* ── Left Panel ── */
        .login-panel-left {
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

        .login-panel-left::before {
          content: '';
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          top: -140px;
          right: -180px;
        }
        .login-panel-left::after {
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
        .login-panel-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 16px;
          padding: 40px 36px;
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
          margin-bottom: 24px;
          line-height: 1.6;
        }

        /* Role Tabs */
        .role-tabs {
          display: flex;
          background: #f0f4f8;
          border-radius: 10px;
          padding: 3px;
          margin-bottom: 20px;
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
          margin-bottom: 16px;
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

        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 14px;
          margin-top: -2px;
        }
        .forgot-link {
          font-size: 12px;
          color: #1a6fa0;
          text-decoration: none;
          font-weight: 500;
        }
        .forgot-link:hover { text-decoration: underline; }

        /* Error */
        .error-box {
          background: #fff0f0;
          border: 1.5px solid #f5c0c0;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 12px;
          color: #c0392b;
          margin-bottom: 14px;
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
          margin: 16px 0;
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

        .register-row {
          text-align: center;
          font-size: 13px;
          color: #7a8fa6;
          line-height: 1.5;
        }
        .register-row a {
          color: #1a6fa0;
          text-decoration: none;
          font-weight: 600;
        }
        .register-row a:hover { text-decoration: underline; }

        /* Responsive */
        @media (max-width: 768px) {
          .login-panel-left { display: none; }
          .login-panel-right { padding: 16px; background: linear-gradient(155deg,#0a3d62,#1a6fa0); }
          .login-card { padding: 24px 20px; max-width: 100%; }
          .left-heading { font-size: 28px; }
        }
      `}</style>

      <div className="login-root">
        {/* Left decorative panel */}
        <div className="login-panel-left">
          <div className="brand">
            <div className="brand-icon">🏥</div>
            <div className="brand-name">
              Medi<span>Connect</span>
            </div>
          </div>

          <h1 className="left-heading">
            Healthcare
            <br />
            at your
            <br />
            <em>fingertips.</em>
          </h1>
          <p className="left-sub">
            Book appointments, attend video consultations, and receive
            AI-powered health guidance — all in one secure platform.
          </p>

          <ul className="features">
            <li>
              <span className="feat-dot" /> Instant doctor appointments
            </li>
            <li>
              <span className="feat-dot" /> Secure HD video consultations
            </li>
            <li>
              <span className="feat-dot" /> Digital prescriptions & reports
            </li>
            <li>
              <span className="feat-dot" /> AI symptom checker
            </li>
          </ul>
        </div>

        {/* Right login panel */}
        <div className="login-panel-right">
          <div className="login-card">
            <h2 className="card-title">Welcome back</h2>
            <p className="card-sub">Sign in to your account to continue</p>

            <form onSubmit={handleSubmit} noValidate>
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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
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

              {/* Forgot password */}
              <div className="form-actions">
                <a href="/forgot-password" className="forgot-link">
                  Forgot password?
                </a>
              </div>

              {/* Error message */}
              {error && (
                <div className="error-box" role="alert">
                  ⚠️ {error}
                </div>
              )}

              {/* Submit */}
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner" /> Signing in…
                  </>
                ) : (
                  <>Sign in</>
                )}
              </button>
            </form>

            <div className="divider">or</div>

            <div className="register-row">
              Don't have an account? <a href="/register">Create one free</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginForm;
