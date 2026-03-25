import { useEffect, useState } from "react";
import { logoutUser } from "../../utils/authService";
import { getMyBookings } from "../../utils/appointmentService";
import { getSessions } from "../../utils/telemedicineService";
import { getPatientPrescriptions } from "../../utils/prescriptionService";
import UpdateProfileForm from "../UpdateProfileForm";
import BookAppointment from "../BookAppointment";
import MedicalRecords from "../MedicalRecords";
import PatientPrescriptions from "../PatientPrescriptions";

const navItems = [
  { id: "overview", icon: "⊞", label: "Overview" },
  { id: "appointments", icon: "📅", label: "Appointments" },
  { id: "medical", icon: "📋", label: "Medical Records" },
  { id: "consultations", icon: "💬", label: "Consultations" },
  { id: "prescriptions", icon: "💊", label: "Prescriptions" },
  { id: "settings", icon: "⚙", label: "Settings" },
];

const pageTitles = {
  overview: "Overview",
  appointments: "Appointments",
  medical: "Medical Records",
  consultations: "Consultations",
  prescriptions: "Prescriptions",
  settings: "Settings",
};

const fmtDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr.split("T")[0]);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const fmtTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

const isAppointmentOverdue = (appointment) => {
  // Appointment is overdue if date has passed AND status is not completed/cancelled/ended
  if (!appointment.appointment_date) return false;
  const appointmentDate = new Date(appointment.appointment_date.split("T")[0]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isDatePassed = appointmentDate < today;
  const isNotCompleted = !["completed", "cancelled", "ended"].includes(
    appointment.status,
  );
  return isDatePassed && isNotCompleted;
};

const PatientDashboard = ({ user: initialUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState(initialUser);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [consultations, setConsultations] = useState([]);
  const [consultationsLoading, setConsultationsLoading] = useState(false);
  const [consultationsError, setConsultationsError] = useState("");
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [prescriptionsError, setPrescriptionsError] = useState("");
  const [hideOverdues, setHideOverdues] = useState(() => {
    try {
      const saved = localStorage.getItem("patientHideOverdues");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [showOverdueTooltip, setShowOverdueTooltip] = useState(false);
  const [hideEndedConsultations, setHideEndedConsultations] = useState(() => {
    try {
      const saved = localStorage.getItem("patientHideEndedConsultations");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [showEndedConsultTooltip, setShowEndedConsultTooltip] = useState(false);

  const loadAppointments = async () => {
    setAppointmentsLoading(true);
    setAppointmentsError("");
    const res = await getMyBookings();
    if (res.success) setAppointments(res.data || []);
    else setAppointmentsError(res.error || "Could not load appointments.");
    setAppointmentsLoading(false);
  };

  const loadConsultations = async () => {
    setConsultationsLoading(true);
    setConsultationsError("");
    const res = await getSessions();
    if (res.success) setConsultations(res.data || []);
    else setConsultationsError(res.error || "Could not load consultations.");
    setConsultationsLoading(false);
  };

  const loadPrescriptions = async () => {
    setPrescriptionsLoading(true);
    setPrescriptionsError("");
    const res = await getPatientPrescriptions();
    if (res.success) setPrescriptions(res.data || []);
    else setPrescriptionsError(res.message || "Could not load prescriptions.");
    setPrescriptionsLoading(false);
  };

  useEffect(() => {
    loadAppointments();
    loadConsultations();
    loadPrescriptions();
  }, []);

  // Persist hideOverdues to localStorage
  useEffect(() => {
    localStorage.setItem("patientHideOverdues", JSON.stringify(hideOverdues));
  }, [hideOverdues]);

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

        /* ── Lists ── */
        .pd-list { display: flex; flex-direction: column; gap: 10px; }
        .pd-list-card { border: 1px solid #e4eaf0; border-radius: 10px; padding: 12px 14px; background: #fff; display: flex; gap: 10px; align-items: flex-start; }
        .pd-list-icon { width: 36px; height: 36px; border-radius: 10px; background: #eff6ff; border: 1px solid #c7dff0; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .pd-list-body { flex: 1; min-width: 0; }
        .pd-list-title { font-family: 'Sora', sans-serif; font-size: 13.5px; font-weight: 700; color: #0a3d62; margin-bottom: 3px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .pd-chip { padding: 2px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; border: 1px solid #e4eaf0; background: #f8fafc; color: #3a5068; }
        .pd-chip.success { background: #f0fdf4; border-color: #86efac; color: #15803d; }
        .pd-chip.warn { background: #fef9c3; border-color: #fde047; color: #a16207; }
        .pd-chip.info { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
        .pd-chip.danger { background: #fff1f1; border-color: #fca5a5; color: #dc2626; }
        .pd-chip.overdue { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
        .pd-list-card.overdue { opacity: .6; }
        .pd-list-meta { font-size: 12.5px; color: #7a8fa6; margin-bottom: 4px; }
        .pd-list-note { font-size: 12.5px; color: #3a5068; }
        .pd-loading { text-align: center; padding: 18px 8px; color: #7a8fa6; font-size: 13px; }

        /* ── Settings Section ── */
        .pd-settings-option { display: flex; align-items: center; gap: 16px; padding: 18px 16px; background: #f8fafc; border: 1.5px solid #e4eaf0; border-radius: 10px; }
        .pd-settings-content { flex: 1; }
        .pd-settings-label { font-size: 14px; font-weight: 600; color: #0a3d62; margin-bottom: 4px; }
        .pd-settings-description { font-size: 12.5px; color: #7a8fa6; }
        .pd-settings-controls { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .pd-settings-tooltip-wrapper { position: relative; display: flex; align-items: center; flex-shrink: 0; }
        .pd-settings-help-icon { width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid #7a8fa6; color: #7a8fa6; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; cursor: help; transition: all .15s; }
        .pd-settings-help-icon:hover { border-color: #1a6fa0; color: #1a6fa0; background: #eff6ff; }
        .pd-settings-tooltip { position: absolute; bottom: calc(100% + 12px); left: -100px; background: #0a3d62; color: #fff; padding: 10px 12px; border-radius: 8px; font-size: 12px; width: 200px; white-space: normal; line-height: 1.4; box-shadow: 0 4px 12px rgba(0,0,0,.15); z-index: 10; }
        .pd-settings-tooltip::after { content: ''; position: absolute; top: 100%; left: 112px; border: 6px solid transparent; border-top-color: #0a3d62; }
        .pd-toggle-overdue { display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all .15s; flex-shrink: 0; }
        .pd-toggle-overdue-switch { width: 40px; height: 22px; border-radius: 11px; background: #e4eaf0; border: 1.5px solid #e4eaf0; position: relative; transition: all .15s; display: flex; align-items: center; padding: 2px; }
        .pd-toggle-overdue-switch.active { background: #86efac; border-color: #4ade80; }
        .pd-toggle-overdue-circle { width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: all .15s; }
        .pd-toggle-overdue-switch.active .pd-toggle-overdue-circle { transform: translateX(18px); }
      `}</style>

      <div className="pd-root">
        {/* Sidebar */}
        <aside className="pd-sidebar">
          <div className="pd-brand">
            <div className="pd-brand-row">
              <div className="pd-brand-icon">
                <img
                  src="/src/assets/favicon.png"
                  alt="MediConnect Logo"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
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
                    <div className="pd-stat-value">
                      {appointmentsLoading ? "…" : appointments.length}
                    </div>
                    <div className="pd-stat-sub">
                      {appointmentsLoading
                        ? "Loading"
                        : appointments.length === 0
                          ? "No appointments yet"
                          : "Includes pending/confirmed"}
                    </div>
                  </div>
                  <div className="pd-stat">
                    <div className="pd-stat-top">
                      <div className="pd-stat-label">Consultations</div>
                      <div className="pd-stat-icon">💬</div>
                    </div>
                    <div className="pd-stat-value">
                      {consultationsLoading ? "…" : consultations.length}
                    </div>
                    <div className="pd-stat-sub">
                      {consultationsLoading
                        ? "Loading"
                        : consultations.length === 0
                          ? "No sessions"
                          : "Active & past sessions"}
                    </div>
                  </div>
                  <div className="pd-stat">
                    <div className="pd-stat-top">
                      <div className="pd-stat-label">Prescriptions</div>
                      <div className="pd-stat-icon">💊</div>
                    </div>
                    <div className="pd-stat-value">
                      {prescriptionsLoading ? "…" : prescriptions.length}
                    </div>
                    <div className="pd-stat-sub">
                      {prescriptionsLoading
                        ? "Loading"
                        : prescriptions.length === 0
                          ? "No prescriptions yet"
                          : "Latest issued scripts"}
                    </div>
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
                  <div className="pd-section-header">
                    <div className="pd-section-title">Your bookings</div>
                    <button
                      className="pd-btn pd-btn-ghost"
                      onClick={loadAppointments}
                    >
                      Refresh
                    </button>
                  </div>
                  {appointmentsLoading ? (
                    <div className="pd-loading">Loading appointments…</div>
                  ) : appointmentsError ? (
                    <div className="pd-empty">⚠ {appointmentsError}</div>
                  ) : appointments.length === 0 ? (
                    <div className="pd-empty">
                      <div className="pd-empty-icon">📅</div>
                      <p>No appointments yet.</p>
                    </div>
                  ) : (
                    <div className="pd-list">
                      {appointments
                        .filter(
                          (a) => !hideOverdues || !isAppointmentOverdue(a),
                        )
                        .slice(0, 4)
                        .map((a) => (
                          <div
                            key={a.id}
                            className={`pd-list-card${isAppointmentOverdue(a) ? " overdue" : ""}`}
                          >
                            <div className="pd-list-icon">
                              {isAppointmentOverdue(a) ? "⏰" : "📅"}
                            </div>
                            <div className="pd-list-body">
                              <div className="pd-list-title">
                                Dr. {a.doctor_name || "Doctor"}
                                <span
                                  className={`pd-chip ${
                                    isAppointmentOverdue(a)
                                      ? "overdue"
                                      : a.status === "confirmed"
                                        ? "success"
                                        : a.status === "pending"
                                          ? "warn"
                                          : a.status === "cancelled"
                                            ? "danger"
                                            : "info"
                                  }`}
                                >
                                  {isAppointmentOverdue(a)
                                    ? "Overdue"
                                    : a.status || "Pending"}
                                </span>
                                {a.is_telemedicine && (
                                  <span className="pd-chip info">
                                    Telemedicine
                                  </span>
                                )}
                              </div>
                              <div className="pd-list-meta">
                                {fmtDate(a.appointment_date || "")} ·{" "}
                                {fmtTime(a.start_time)} – {fmtTime(a.end_time)}
                              </div>
                              {a.reason && (
                                <div className="pd-list-note">{a.reason}</div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <div className="pd-section">
                  <BookAppointment hideOverdues={hideOverdues} />
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
                  <div className="pd-section-header">
                    <div className="pd-section-title">Sessions</div>
                    <button
                      className="pd-btn pd-btn-ghost"
                      onClick={loadConsultations}
                    >
                      Refresh
                    </button>
                  </div>
                  {consultationsLoading ? (
                    <div className="pd-loading">Loading consultations…</div>
                  ) : consultationsError ? (
                    <div className="pd-empty">⚠ {consultationsError}</div>
                  ) : consultations.length === 0 ? (
                    <div className="pd-empty">
                      <div className="pd-empty-icon">💬</div>
                      <p>No consultations yet. Book a telemedicine slot.</p>
                    </div>
                  ) : (
                    <div className="pd-list">
                      {consultations
                        .filter(
                          (c) =>
                            !(hideEndedConsultations && c.status === "ended"),
                        )
                        .slice(0, 4)
                        .map((c) => (
                          <div
                            key={c.id || c.session_id}
                            className="pd-list-card"
                          >
                            <div className="pd-list-icon">💬</div>
                            <div className="pd-list-body">
                              <div className="pd-list-title">
                                Session {c.session_id || c.id || ""}
                                <span
                                  className={`pd-chip ${
                                    c.status === "ongoing"
                                      ? "success"
                                      : c.status === "ended"
                                        ? "danger"
                                        : "info"
                                  }`}
                                >
                                  {c.status || "scheduled"}
                                </span>
                              </div>
                              <div className="pd-list-meta">
                                Appointment #
                                {c.appointment_id || c.appointmentId || ""}
                              </div>
                              {c.meeting_room && (
                                <div className="pd-list-note">
                                  Room: {c.meeting_room}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "prescriptions" && (
              <>
                <div className="pd-page-head">
                  <h2>Prescriptions</h2>
                  <p>
                    Prescriptions issued by your doctor after confirmed
                    appointments.
                  </p>
                </div>
                <div className="pd-section">
                  <div className="pd-section-header">
                    <div className="pd-section-title">Recent prescriptions</div>
                    <button
                      className="pd-btn pd-btn-ghost"
                      onClick={loadPrescriptions}
                    >
                      Refresh
                    </button>
                  </div>
                  {prescriptionsLoading ? (
                    <div className="pd-loading">Loading prescriptions…</div>
                  ) : prescriptionsError ? (
                    <div className="pd-empty">⚠ {prescriptionsError}</div>
                  ) : prescriptions.length === 0 ? (
                    <div className="pd-empty">
                      <div className="pd-empty-icon">💊</div>
                      <p>No prescriptions yet.</p>
                    </div>
                  ) : (
                    <div className="pd-list">
                      {prescriptions.slice(0, 4).map((p) => (
                        <div key={p.id} className="pd-list-card">
                          <div className="pd-list-icon">💊</div>
                          <div className="pd-list-body">
                            <div className="pd-list-title">
                              {p.doctor_name
                                ? `Dr. ${p.doctor_name}`
                                : "Prescription"}
                              <span className="pd-chip success">Issued</span>
                            </div>
                            <div className="pd-list-meta">
                              {fmtDate(p.appointment_date || p.createdAt)}
                            </div>
                            {p.diagnosis && (
                              <div className="pd-list-note">
                                Diagnosis: {p.diagnosis}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="pd-section">
                  <PatientPrescriptions />
                </div>
              </>
            )}

            {activeTab === "settings" && (
              <>
                <div className="pd-page-head">
                  <h2>Settings</h2>
                  <p>Manage your preferences and view settings.</p>
                </div>
                <div className="pd-section">
                  <div className="pd-section-header">
                    <div className="pd-section-title">Appointment Display</div>
                  </div>
                  <div className="pd-settings-option">
                    <div className="pd-settings-content">
                      <div className="pd-settings-label">
                        Hide Overdue Appointments
                      </div>
                      <div className="pd-settings-description">
                        {hideOverdues
                          ? "Overdue appointments are currently hidden"
                          : "Overdue appointments are shown"}
                      </div>
                    </div>
                    <div className="pd-settings-controls">
                      <div className="pd-settings-tooltip-wrapper">
                        <div
                          className="pd-settings-help-icon"
                          onMouseEnter={() => setShowOverdueTooltip(true)}
                          onMouseLeave={() => setShowOverdueTooltip(false)}
                        >
                          ?
                        </div>
                        {showOverdueTooltip && (
                          <div className="pd-settings-tooltip">
                            Hide appointments that have passed their date but
                            aren't completed.
                          </div>
                        )}
                      </div>
                      <div
                        className="pd-toggle-overdue"
                        onClick={() => setHideOverdues(!hideOverdues)}
                      >
                        <div
                          className={`pd-toggle-overdue-switch${hideOverdues ? " active" : ""}`}
                        >
                          <div className="pd-toggle-overdue-circle"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pd-section">
                  <div className="pd-section-header">
                    <div className="pd-section-title">Consultation Display</div>
                  </div>
                  <div className="pd-settings-option">
                    <div className="pd-settings-content">
                      <div className="pd-settings-label">
                        Hide Ended Consultations
                      </div>
                      <div className="pd-settings-description">
                        {hideEndedConsultations
                          ? "Ended consultations are currently hidden"
                          : "Ended consultations are shown"}
                      </div>
                    </div>
                    <div className="pd-settings-controls">
                      <div className="pd-settings-tooltip-wrapper">
                        <div
                          className="pd-settings-help-icon"
                          onMouseEnter={() => setShowEndedConsultTooltip(true)}
                          onMouseLeave={() => setShowEndedConsultTooltip(false)}
                        >
                          ?
                        </div>
                        {showEndedConsultTooltip && (
                          <div className="pd-settings-tooltip">
                            Hide consultations that have already ended from the
                            Consultations tab.
                          </div>
                        )}
                      </div>
                      <div
                        className="pd-toggle-overdue"
                        onClick={() => {
                          const next = !hideEndedConsultations;
                          setHideEndedConsultations(next);
                          localStorage.setItem(
                            "patientHideEndedConsultations",
                            JSON.stringify(next),
                          );
                        }}
                      >
                        <div
                          className={`pd-toggle-overdue-switch${hideEndedConsultations ? " active" : ""}`}
                        >
                          <div className="pd-toggle-overdue-circle"></div>
                        </div>
                      </div>
                    </div>
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
