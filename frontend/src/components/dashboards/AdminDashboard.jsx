import { useState } from "react";
import { logoutUser } from "../../utils/authService";

const navItems = [
  { id: "overview", icon: "⊞", label: "Overview" },
  { id: "users", icon: "👥", label: "Users" },
  { id: "doctors", icon: "👨‍⚕️", label: "Doctor Verification" },
  { id: "reports", icon: "📈", label: "Reports" },
  { id: "settings", icon: "⚙️", label: "Settings" },
  { id: "logs", icon: "📋", label: "Activity Logs" },
];

const pageTitles = {
  overview: "Overview",
  users: "User Management",
  doctors: "Doctor Verification",
  reports: "Reports",
  settings: "System Settings",
  logs: "Activity Logs",
};

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const handleLogout = () => {
    logoutUser();
    if (onLogout) onLogout();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');

        .ad-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #f4f7fb;
        }

        /* â”€â”€ Sidebar â”€â”€ */
        .ad-sidebar {
          width: 220px;
          min-height: 100vh;
          background: #0a3d62;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0;
          z-index: 100;
        }
        .ad-brand {
          padding: 18px 16px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .ad-brand-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ad-brand-icon {
          width: 34px; height: 34px;
          background: rgba(125,216,248,0.18);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
        }
        .ad-brand-name {
          font-family: 'Sora', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          line-height: 1;
        }
        .ad-brand-name span { color: #7dd8f8; }
        .ad-brand-sub {
          font-size: 10px;
          color: rgba(255,255,255,0.45);
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .ad-nav {
          flex: 1;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ad-nav-btn {
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
        .ad-nav-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .ad-nav-btn.active { background: rgba(125,216,248,0.15); color: #7dd8f8; }
        .ad-nav-btn .ni { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }

        .ad-footer {
          padding: 12px 14px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .ad-footer-user {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 10px;
        }
        .ad-avatar {
          width: 32px; height: 32px;
          background: rgba(125,216,248,0.2);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        .ad-footer-name {
          font-size: 12.5px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ad-footer-email {
          font-size: 10.5px;
          color: rgba(255,255,255,0.4);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ad-footer-meta { flex: 1; min-width: 0; }
        .ad-signout {
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
        .ad-signout:hover {
          background: rgba(255,70,70,0.15);
          border-color: rgba(255,70,70,0.25);
          color: #ff9999;
        }

        /* â”€â”€ Main â”€â”€ */
        .ad-main {
          margin-left: 220px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .ad-topbar {
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
        .ad-topbar-title {
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #0a3d62;
        }
        .ad-topbar-right {
          font-size: 12.5px;
          color: #7a8fa6;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ad-content { padding: 22px 24px; }

        /* â”€â”€ Stat cards â”€â”€ */
        .ad-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }
        .ad-stat {
          background: #fff;
          border: 1px solid #e4eaf0;
          border-radius: 10px;
          padding: 16px 18px;
        }
        .ad-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .ad-stat-label {
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #7a8fa6;
        }
        .ad-stat-icon { font-size: 20px; opacity: 0.65; }
        .ad-stat-value {
          font-family: 'Sora', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #0a3d62;
          line-height: 1;
          margin-bottom: 3px;
        }
        .ad-stat-sub { font-size: 11px; color: #b0bec8; }

        /* â”€â”€ Sections â”€â”€ */
        .ad-section {
          background: #fff;
          border: 1px solid #e4eaf0;
          border-radius: 10px;
          padding: 20px 22px;
          margin-bottom: 14px;
        }
        .ad-section-title {
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #0a3d62;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .ad-empty {
          text-align: center;
          padding: 28px 16px;
          color: #b0bec8;
        }
        .ad-empty-icon { font-size: 32px; margin-bottom: 8px; opacity: 0.45; }
        .ad-empty p { font-size: 13px; }

        /* â”€â”€ Buttons â”€â”€ */
        .ad-btn {
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
        .ad-btn-primary {
          background: linear-gradient(135deg, #0a3d62, #1a6fa0);
          color: #fff;
          box-shadow: 0 2px 6px rgba(10,61,98,0.18);
        }
        .ad-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .ad-btn-sm {
          padding: 5px 10px;
          font-size: 11.5px;
        }

        /* â”€â”€ Page header â”€â”€ */
        .ad-page-head { margin-bottom: 18px; }
        .ad-page-head h2 {
          font-family: 'Sora', sans-serif;
          font-size: 19px;
          font-weight: 700;
          color: #0a3d62;
          margin-bottom: 2px;
        }
        .ad-page-head p { font-size: 13px; color: #7a8fa6; }

        /* â”€â”€ Table â”€â”€ */
        .ad-table-wrap { overflow-x: auto; }
        .ad-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .ad-table th {
          background: #f4f7fb;
          padding: 10px 14px;
          text-align: left;
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #7a8fa6;
          border-bottom: 1px solid #e4eaf0;
        }
        .ad-table td {
          padding: 11px 14px;
          border-bottom: 1px solid #f0f4f8;
          color: #3a5068;
        }
        .ad-table tr:last-child td { border-bottom: none; }
        .ad-table tr:hover td { background: #fafcff; }
        .ad-table .empty-row td {
          text-align: center;
          padding: 32px;
          color: #b0bec8;
        }

        /* â”€â”€ Badges â”€â”€ */
        .ad-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        .ad-badge-pending  { background: #fffbeb; color: #92400e; border: 1px solid #fcd34d; }
        .ad-badge-verified { background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; }
        .ad-badge-admin    { background: #eff6ff; color: #1d4ed8; border: 1px solid #93c5fd; }
      `}</style>

      <div className="ad-root">
        {/* Sidebar */}
        <aside className="ad-sidebar">
          <div className="ad-brand">
            <div className="ad-brand-row">
              <div className="ad-brand-icon">🏥</div>
              <div>
                <div className="ad-brand-name">
                  Medi<span>Connect</span>
                </div>
                <div className="ad-brand-sub">Admin Panel</div>
              </div>
            </div>
          </div>

          <nav className="ad-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`ad-nav-btn${activeTab === item.id ? " active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="ni">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="ad-footer">
            <div className="ad-footer-user">
              <div className="ad-avatar">ðŸ›¡ï¸</div>
              <div className="ad-footer-meta">
                <div className="ad-footer-name">{user?.name || "Admin"}</div>
                <div className="ad-footer-email">{user?.email || ""}</div>
              </div>
            </div>
            <button className="ad-signout" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </aside>

        {/* Main area */}
        <div className="ad-main">
          <header className="ad-topbar">
            <span className="ad-topbar-title">{pageTitles[activeTab]}</span>
            <div className="ad-topbar-right">
              <span>ðŸ›¡ï¸</span>
              <span>{user?.name || "Admin"}</span>
            </div>
          </header>

          <div className="ad-content">
            {activeTab === "overview" && (
              <>
                <div className="ad-page-head">
                  <h2>System Overview</h2>
                  <p>Platform statistics and health at a glance.</p>
                </div>
                <div className="ad-stats">
                  <div className="ad-stat">
                    <div className="ad-stat-top">
                      <div className="ad-stat-label">Total Users</div>
                      <div className="ad-stat-icon">👥</div>
                    </div>
                    <div className="ad-stat-value">0</div>
                    <div className="ad-stat-sub">Active accounts</div>
                  </div>
                  <div className="ad-stat">
                    <div className="ad-stat-top">
                      <div className="ad-stat-label">Doctors</div>
                      <div className="ad-stat-icon">👨‍⚕️</div>
                    </div>
                    <div className="ad-stat-value">0</div>
                    <div className="ad-stat-sub">Verified professionals</div>
                  </div>
                  <div className="ad-stat">
                    <div className="ad-stat-top">
                      <div className="ad-stat-label">Appointments</div>
                      <div className="ad-stat-icon">📅</div>
                    </div>
                    <div className="ad-stat-value">0</div>
                    <div className="ad-stat-sub">This month</div>
                  </div>
                  <div className="ad-stat">
                    <div className="ad-stat-top">
                      <div className="ad-stat-label">Pending Review</div>
                      <div className="ad-stat-icon">⏳</div>
                    </div>
                    <div className="ad-stat-value">0</div>
                    <div className="ad-stat-sub">Verifications</div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "users" && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "18px",
                  }}
                >
                  <div className="ad-page-head" style={{ marginBottom: 0 }}>
                    <h2>User Management</h2>
                    <p>View and manage all platform users.</p>
                  </div>
                  <button className="ad-btn ad-btn-primary">+ Add User</button>
                </div>
                <div className="ad-section">
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="empty-row">
                          <td colSpan="5">No users found</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === "doctors" && (
              <>
                <div className="ad-page-head">
                  <h2>Doctor Verification</h2>
                  <p>Review and approve doctor credential submissions.</p>
                </div>
                <div className="ad-section">
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th>Doctor</th>
                          <th>Email</th>
                          <th>License #</th>
                          <th>Submitted</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="empty-row">
                          <td colSpan="6">No pending verifications</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === "reports" && (
              <>
                <div className="ad-page-head">
                  <h2>Reports</h2>
                  <p>Platform analytics and usage statistics.</p>
                </div>
                <div className="ad-section">
                  <div className="ad-section-title">
                    ðŸ“Š Monthly Statistics
                  </div>
                  <div className="ad-empty">
                    <div className="ad-empty-icon">ðŸ“ˆ</div>
                    <p>Reports and analytics will be displayed here.</p>
                  </div>
                </div>
              </>
            )}

            {activeTab === "settings" && (
              <>
                <div className="ad-page-head">
                  <h2>System Settings</h2>
                  <p>Configure platform behavior and integrations.</p>
                </div>
                <div className="ad-section">
                  <div className="ad-section-title">
                    ðŸ”§ Platform Configuration
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#7a8fa6",
                      marginBottom: "16px",
                    }}
                  >
                    Manage API endpoints, authentication keys, and system
                    integrations.
                  </p>
                  <button className="ad-btn ad-btn-primary">
                    Configure Settings
                  </button>
                </div>
              </>
            )}

            {activeTab === "logs" && (
              <>
                <div className="ad-page-head">
                  <h2>Activity Logs</h2>
                  <p>Track all user actions and system events.</p>
                </div>
                <div className="ad-section">
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>User</th>
                          <th>Action</th>
                          <th>Details</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="empty-row">
                          <td colSpan="5">No activity logs available</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
