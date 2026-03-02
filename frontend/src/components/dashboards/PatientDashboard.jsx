import { useState } from "react";
import { logoutUser } from "../../utils/authService";
import UpdateProfileForm from "../UpdateProfileForm";
import BookAppointment from "../BookAppointment";
import MedicalRecords from "../MedicalRecords";

const navItems = [
  { id: "overview", icon: "⊞", label: "Overview" },
  { id: "appointments", icon: "📅", label: "Appointments" },
  { id: "medical", icon: "📋", label: "Medical Records" },
  { id: "consultations", icon: "💬", label: "Consultations" },
  { id: "prescriptions", icon: "💊", label: "Prescriptions" },
];

const pageTitles = {
  overview: "Overview",
  appointments: "Appointments",
  medical: "Medical Records",
  consultations: "Consultations",
  prescriptions: "Prescriptions",
};

const PatientDashboard = ({ user: initialUser, onLogout }) => {
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

        .pd-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #f4f7fb;
        }

        /* ── Sidebar ── */
        .pd-sidebar {
          width: 220px;
          min-height: 100vh;
          background: #0a3d62;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0;
          z-index: 100;
        }
        .pd-brand {
          padding: 18px 16px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .pd-brand-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pd-brand-icon {
          width: 34px; height: 34px;
          background: rgba(125,216,248,0.18);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
        }
        .pd-brand-name {
          font-family: 'Sora', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          line-height: 1;
        }
        .pd-brand-name span { color: #7dd8f8; }
        .pd-brand-sub {
          font-size: 10px;
          color: rgba(255,255,255,0.45);
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .pd-nav {
          flex: 1;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pd-nav-btn {
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
        .pd-nav-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .pd-nav-btn.active { background: rgba(125,216,248,0.15); color: #7dd8f8; }
        .pd-nav-btn .ni { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }

        .pd-footer {
          padding: 12px 14px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .pd-footer-user {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 10px;
        }
        .pd-avatar {
          width: 32px; height: 32px;
          background: rgba(125,216,248,0.2);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .pd-footer-name {
          font-size: 12.5px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pd-footer-email {
          font-size: 10.5px;
          color: rgba(255,255,255,0.4);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pd-footer-meta { flex: 1; min-width: 0; }
        .pd-signout {
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
        .pd-signout:hover {
          background: rgba(255,70,70,0.15);
          border-color: rgba(255,70,70,0.25);
          color: #ff9999;
        }

        /* ── Main ── */
        .pd-main {
          margin-left: 220px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .pd-topbar {
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
        .pd-topbar-title {
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #0a3d62;
        }
        .pd-topbar-right {
          font-size: 12.5px;
          color: #7a8fa6;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pd-profile-btn {
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
        .pd-profile-btn:hover {
          background: linear-gradient(135deg, rgba(10, 61, 98, 0.15), rgba(125, 216, 248, 0.15));
          border-color: #7dd8f8;
          transform: scale(1.05);
        }
        .pd-content { padding: 22px 24px; }

        /* ── Stat cards ── */
        .pd-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }
        .pd-stat {
          background: #fff;
          border: 1px solid #e4eaf0;
          border-radius: 10px;
          padding: 16px 18px;
        }
        .pd-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .pd-stat-label {
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #7a8fa6;
        }
        .pd-stat-icon { font-size: 20px; opacity: 0.65; }
        .pd-stat-value {
          font-family: 'Sora', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #0a3d62;
          line-height: 1;
          margin-bottom: 3px;
        }
        .pd-stat-sub { font-size: 11px; color: #b0bec8; }

        /* ── Sections ── */
        .pd-section {
          background: #fff;
          border: 1px solid #e4eaf0;
          border-radius: 10px;
          padding: 20px 22px;
          margin-bottom: 14px;
        }
        .pd-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .pd-section-title {
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #0a3d62;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .pd-empty {
          text-align: center;
          padding: 28px 16px;
          color: #b0bec8;
        }
        .pd-empty-icon { font-size: 32px; margin-bottom: 8px; opacity: 0.45; }
        .pd-empty p { font-size: 13px; }

        /* ── Buttons ── */
        .pd-btn {
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
        .pd-btn-primary {
          background: linear-gradient(135deg, #0a3d62, #1a6fa0);
          color: #fff;
          box-shadow: 0 2px 6px rgba(10,61,98,0.18);
        }
        .pd-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .pd-btn-ghost {
          background: #f0f4f8;
          color: #1a6fa0;
        }
        .pd-btn-ghost:hover { background: #e0ecf6; }

        /* ── Page header ── */
        .pd-page-head { margin-bottom: 18px; }
        .pd-page-head h2 {
          font-family: 'Sora', sans-serif;
          font-size: 19px;
          font-weight: 700;
          color: #0a3d62;
          margin-bottom: 2px;
        }
        .pd-page-head p { font-size: 13px; color: #7a8fa6; }

        /* ── Quick actions row ── */
        .pd-actions { display: flex; gap: 10px; flex-wrap: wrap; }
      `}</style>

      <div className="pd-root">
        {/* Sidebar */}
        <aside className="pd-sidebar">
          <div className="pd-brand">
            <div className="pd-brand-row">
              <div className="pd-brand-icon">🏥</div>
              <div>
                <div className="pd-brand-name">
                  Medi<span>Connect</span>
                </div>
                <div className="pd-brand-sub">Patient Portal</div>
              </div>
            </div>
          </div>

          <nav className="pd-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`pd-nav-btn${activeTab === item.id ? " active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="ni">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pd-footer">
            <div className="pd-footer-user">
              <div className="pd-avatar">👤</div>
              <div className="pd-footer-meta">
                <div className="pd-footer-name">{user?.name || "Patient"}</div>
                <div className="pd-footer-email">{user?.email || ""}</div>
              </div>
            </div>
            <button className="pd-signout" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </aside>

        {/* Main area */}
        <div className="pd-main">
          <header className="pd-topbar">
            <span className="pd-topbar-title">{pageTitles[activeTab]}</span>
            <div className="pd-topbar-right">
              <button
                className="pd-profile-btn"
                onClick={() => setShowProfile(true)}
                title="Edit profile"
              >
                👤
              </button>
              <span>{user?.name || "Patient"}</span>
            </div>
          </header>

          <div className="pd-content">
            {activeTab === "overview" && (
              <>
                <div className="pd-page-head">
                  <h2>Good day, {user?.name || "Patient"} 👋</h2>
                  <p>Here's a summary of your health activity.</p>
                </div>
                <div className="pd-stats">
                  <div className="pd-stat">
                    <div className="pd-stat-top">
                      <div className="pd-stat-label">Appointments</div>
                      <div className="pd-stat-icon">📅</div>
                    </div>
                    <div className="pd-stat-value">0</div>
                    <div className="pd-stat-sub">No upcoming</div>
                  </div>
                  <div className="pd-stat">
                    <div className="pd-stat-top">
                      <div className="pd-stat-label">Consultations</div>
                      <div className="pd-stat-icon">💬</div>
                    </div>
                    <div className="pd-stat-value">0</div>
                    <div className="pd-stat-sub">No active sessions</div>
                  </div>
                  <div className="pd-stat">
                    <div className="pd-stat-top">
                      <div className="pd-stat-label">Prescriptions</div>
                      <div className="pd-stat-icon">💊</div>
                    </div>
                    <div className="pd-stat-value">0</div>
                    <div className="pd-stat-sub">No recent</div>
                  </div>
                </div>
                <div className="pd-section">
                  <div
                    className="pd-section-title"
                    style={{ marginBottom: "12px" }}
                  >
                    ⚡ Quick Actions
                  </div>
                  <div className="pd-actions">
                    <button
                      className="pd-btn pd-btn-primary"
                      onClick={() => setActiveTab("appointments")}
                    >
                      Book Appointment
                    </button>
                    <button
                      className="pd-btn pd-btn-primary"
                      onClick={() => setActiveTab("consultations")}
                    >
                      Start Consultation
                    </button>
                    <button
                      className="pd-btn pd-btn-ghost"
                      onClick={() => setActiveTab("medical")}
                    >
                      View Records
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "appointments" && (
              <>
                <div className="pd-page-head">
                  <h2>Appointments</h2>
                  <p>Manage your upcoming and past appointments.</p>
                </div>
                <div className="pd-section">
                  <BookAppointment />
                </div>
              </>
            )}

            {activeTab === "medical" && (
              <>
                <MedicalRecords />
              </>
            )}

            {activeTab === "consultations" && (
              <>
                <div className="pd-page-head">
                  <h2>Video Consultations</h2>
                  <p>Connect with your doctor face-to-face.</p>
                </div>
                <div className="pd-section">
                  <div className="pd-empty">
                    <div className="pd-empty-icon">💬</div>
                    <p>
                      No active consultations. Schedule an appointment to start
                      one.
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeTab === "prescriptions" && (
              <>
                <div className="pd-page-head">
                  <h2>Prescriptions</h2>
                  <p>Download and manage your prescriptions.</p>
                </div>
                <div className="pd-section">
                  <div className="pd-empty">
                    <div className="pd-empty-icon">💊</div>
                    <p>No prescriptions found.</p>
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

export default PatientDashboard;
