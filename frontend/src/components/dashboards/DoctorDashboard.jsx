import { useState } from "react";
import { logoutUser } from "../../utils/authService";
import UpdateProfileForm from "../UpdateProfileForm";

const navItems = [
  { id: "overview", icon: "⊞", label: "Overview" },
  { id: "schedule", icon: "📅", label: "Schedule" },
  { id: "patients", icon: "👥", label: "Patients" },
  { id: "consultations", icon: "💬", label: "Consultations" },
  { id: "prescriptions", icon: "💊", label: "Prescriptions" },
  { id: "verification", icon: "✅", label: "Verification" },
];

const pageTitles = {
  overview: "Overview",
  schedule: "Schedule",
  patients: "Patients",
  consultations: "Consultations",
  prescriptions: "Prescriptions",
  verification: "Verification Status",
};

const DoctorDashboard = ({ user: initialUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState(initialUser);

  const handleLogout = () => {
    logoutUser();
    if (onLogout) onLogout();
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
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
                <div className="dd-alert">
                  <span className="dd-alert-icon">⚙️</span>
                  Your account is <strong>pending verification</strong>. Submit
                  your documents to activate all features.
                  <button
                    className="dd-btn dd-btn-primary"
                    style={{
                      marginLeft: "auto",
                      padding: "5px 12px",
                      fontSize: "12px",
                    }}
                    onClick={() => setActiveTab("verification")}
                  >
                    Complete Now
                  </button>
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "18px",
                  }}
                >
                  <div className="dd-page-head" style={{ marginBottom: 0 }}>
                    <h2>Schedule</h2>
                    <p>Manage your working hours and availability.</p>
                  </div>
                  <button className="dd-btn dd-btn-primary">+ Add Slot</button>
                </div>
                <div className="dd-section">
                  <div className="dd-empty">
                    <div className="dd-empty-icon">ðŸ“…</div>
                    <p>No schedule set. Add your available time slots.</p>
                  </div>
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
                <div className="dd-section">
                  <div className="dd-section-title">
                    ðŸ“‹ Required Documents
                  </div>
                  <ul className="dd-checklist">
                    <li>
                      <span className="dd-check-dot" /> Medical License (PDF /
                      JPG)
                    </li>
                    <li>
                      <span className="dd-check-dot" /> Government-issued ID
                    </li>
                    <li>
                      <span className="dd-check-dot" /> Professional Credentials
                    </li>
                    <li>
                      <span className="dd-check-dot" /> Insurance Certificate
                    </li>
                  </ul>
                  <button className="dd-btn dd-btn-primary">
                    Upload Documents
                  </button>
                </div>
                <div className="dd-section">
                  <div className="dd-section-title">ðŸ“Œ Current Status</div>
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
                      â³ Pending Review
                    </span>
                    <span style={{ fontSize: "13px", color: "#7a8fa6" }}>
                      Submitted documents are under review by our team.
                    </span>
                  </div>
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
