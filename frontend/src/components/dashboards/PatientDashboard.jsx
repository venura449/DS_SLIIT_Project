import { useEffect, useState } from "react";
import { logoutUser } from "../../utils/authService";
import { getMyBookings } from "../../utils/appointmentService";
import { getSessions } from "../../utils/telemedicineService";
import { getPatientPrescriptions } from "../../utils/prescriptionService";
import UpdateProfileForm from "../UpdateProfileForm";
import BookAppointment from "../BookAppointment";
import MedicalRecords from "../MedicalRecords";
import PatientPrescriptions from "../PatientPrescriptions";
import NotificationBell from "../NotificationBell";
import ChatBubbleButton from "../ChatBubbleButton";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const userInitials = (user?.name || "P").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const upcomingAppointments = appointments.filter(
    a => !isAppointmentOverdue(a) && !["completed","cancelled","ended"].includes(a.status)
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');

        /* ── Root layout ── */
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
          box-shadow: 3px 0 16px rgba(0,0,0,0.14);
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
          overflow: hidden;
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
          padding: 10px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
        }
        .pd-nav-section {
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.9px;
          color: rgba(255,255,255,0.28);
          padding: 10px 11px 5px;
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
          position: relative;
        }
        .pd-nav-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); }
        .pd-nav-btn.active {
          background: rgba(125,216,248,0.15);
          color: #7dd8f8;
          font-weight: 600;
        }
        .pd-nav-btn.active::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 3px;
          background: #7dd8f8;
          border-radius: 0 3px 3px 0;
        }
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
          padding: 6px 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .pd-footer-user:hover { background: rgba(255,255,255,0.07); }
        .pd-avatar {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #1a6fa0, #7dd8f8);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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
          display: flex; align-items: center; justify-content: center; gap: 6px;
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
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0; z-index: 50;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .pd-topbar-left { display: flex; align-items: center; gap: 10px; }
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
        .pd-topbar-date {
          font-size: 12px;
          color: #b0bec8;
          font-weight: 500;
        }
        .pd-profile-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a6fa0, #7dd8f8);
          border: 2px solid #e4eaf0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .pd-profile-btn:hover {
          border-color: #7dd8f8;
          transform: scale(1.05);
          box-shadow: 0 0 0 3px rgba(125,216,248,0.25);
        }
        .pd-content { padding: 22px 24px; }

        /* ── Welcome banner ── */
        .pd-welcome {
          background: linear-gradient(135deg, #0a3d62 0%, #1a6fa0 55%, #2590c4 100%);
          border-radius: 14px;
          padding: 26px 30px;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
          color: #fff;
        }
        .pd-welcome::before {
          content: '';
          position: absolute;
          top: -50px; right: -50px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: rgba(125,216,248,0.1);
          pointer-events: none;
        }
        .pd-welcome::after {
          content: '';
          position: absolute;
          bottom: -35px; right: 100px;
          width: 140px; height: 140px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          pointer-events: none;
        }
        .pd-welcome-title {
          font-family: 'Sora', sans-serif;
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 6px;
          position: relative;
        }
        .pd-welcome-sub {
          font-size: 13.5px;
          color: rgba(255,255,255,0.75);
          position: relative;
          max-width: 520px;
        }
        .pd-welcome-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          flex-wrap: wrap;
          position: relative;
        }
        .pd-welcome-btn {
          padding: 9px 18px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
        }
        .pd-welcome-btn-primary {
          background: #fff;
          color: #0a3d62;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }
        .pd-welcome-btn-primary:hover { background: rgba(255,255,255,0.92); transform: translateY(-1px); }
        .pd-welcome-btn-ghost {
          background: rgba(255,255,255,0.12);
          color: #fff;
          border: 1.5px solid rgba(255,255,255,0.25) !important;
        }
        .pd-welcome-btn-ghost:hover { background: rgba(255,255,255,0.22); }

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
          border-radius: 12px;
          padding: 18px 20px;
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .pd-stat:hover { box-shadow: 0 4px 18px rgba(10,61,98,0.09); transform: translateY(-1px); }
        .pd-stat-accent {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 12px 12px 0 0;
        }
        .pd-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .pd-stat-label {
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #7a8fa6;
        }
        .pd-stat-icon-wrap {
          width: 36px; height: 36px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
        }
        .pd-stat-value {
          font-family: 'Sora', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #0a3d62;
          line-height: 1;
          margin-bottom: 4px;
        }
        .pd-stat-sub { font-size: 11px; color: #b0bec8; }

        /* ── Sections ── */
        .pd-section {
          background: #fff;
          border: 1px solid #e4eaf0;
          border-radius: 12px;
          padding: 20px 22px;
          margin-bottom: 14px;
        }
        .pd-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
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
          padding: 34px 16px;
          color: #b0bec8;
        }
        .pd-empty-icon { font-size: 36px; margin-bottom: 10px; opacity: 0.5; }
        .pd-empty p { font-size: 13px; margin-bottom: 14px; }

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
          box-shadow: 0 2px 8px rgba(10,61,98,0.2);
        }
        .pd-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(10,61,98,0.25); }
        .pd-btn-ghost {
          background: #f0f4f8;
          color: #1a6fa0;
          border: 1px solid #e4eaf0 !important;
        }
        .pd-btn-ghost:hover { background: #deeaf5; border-color: #c7dff0 !important; }
        .pd-btn-success {
          background: linear-gradient(135deg, #15803d, #22c55e);
          color: #fff;
          box-shadow: 0 2px 8px rgba(21,128,61,0.2);
        }
        .pd-btn-success:hover { opacity: 0.88; transform: translateY(-1px); }
        .pd-btn-sm { padding: 6px 12px; font-size: 12px; }

        /* ── Page header ── */
        .pd-page-head { margin-bottom: 20px; }
        .pd-page-head h2 {
          font-family: 'Sora', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #0a3d62;
          margin-bottom: 3px;
        }
        .pd-page-head p { font-size: 13px; color: #7a8fa6; }

        /* ── Overview grid ── */
        .pd-overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        .pd-mini-appt {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid #e4eaf0;
          border-radius: 8px;
          transition: border-color 0.15s, background 0.15s;
        }
        .pd-mini-appt:hover { border-color: #c7dff0; background: #fafcff; }
        .pd-mini-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .pd-mini-body { flex: 1; min-width: 0; }
        .pd-mini-title { font-size: 12.5px; font-weight: 600; color: #0a3d62; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pd-mini-sub { font-size: 11.5px; color: #7a8fa6; }

        /* ── Lists ── */
        .pd-list { display: flex; flex-direction: column; gap: 10px; }
        .pd-list-card {
          border: 1px solid #e4eaf0;
          border-radius: 10px;
          padding: 14px 16px;
          background: #fff;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          transition: box-shadow 0.15s, border-color 0.15s;
        }
        .pd-list-card:hover { border-color: #c7dff0; box-shadow: 0 2px 10px rgba(10,61,98,0.06); }
        .pd-list-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          background: #eff6ff;
          border: 1px solid #c7dff0;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
        }
        .pd-list-icon.success { background: #f0fdf4; border-color: #86efac; }
        .pd-list-icon.warn { background: #fffbeb; border-color: #fde047; }
        .pd-list-icon.danger { background: #fff1f2; border-color: #fca5a5; }
        .pd-list-body { flex: 1; min-width: 0; }
        .pd-list-title { font-family: 'Sora', sans-serif; font-size: 13.5px; font-weight: 700; color: #0a3d62; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .pd-chip { padding: 2px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; border: 1px solid #e4eaf0; background: #f8fafc; color: #3a5068; white-space: nowrap; }
        .pd-chip.success { background: #f0fdf4; border-color: #86efac; color: #15803d; }
        .pd-chip.warn { background: #fef9c3; border-color: #fde047; color: #a16207; }
        .pd-chip.info { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
        .pd-chip.danger { background: #fff1f1; border-color: #fca5a5; color: #dc2626; }
        .pd-chip.overdue { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
        .pd-list-card.overdue { opacity: .7; border-color: #fecaca; background: #fff9f9; }
        .pd-list-meta { font-size: 12.5px; color: #7a8fa6; margin-bottom: 4px; }
        .pd-list-note { font-size: 12.5px; color: #3a5068; }
        .pd-list-actions { display: flex; gap: 6px; margin-top: 8px; }

        /* ── Animated loading dots ── */
        .pd-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 24px 8px;
          color: #7a8fa6;
          font-size: 13px;
        }
        .pd-loading-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #7dd8f8;
          animation: pd-bounce 1s infinite;
        }
        .pd-loading-dot:nth-child(2) { animation-delay: 0.15s; }
        .pd-loading-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes pd-bounce { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }

        /* ── Settings ── */
        .pd-settings-stack { display: flex; flex-direction: column; gap: 10px; }
        .pd-settings-option {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          background: #f8fafc;
          border: 1.5px solid #e4eaf0;
          border-radius: 10px;
          transition: border-color 0.15s;
        }
        .pd-settings-option:hover { border-color: #c7dff0; }
        .pd-settings-option-icon {
          width: 38px; height: 38px;
          border-radius: 9px;
          background: #eff6ff;
          border: 1px solid #c7dff0;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .pd-settings-content { flex: 1; }
        .pd-settings-label { font-size: 14px; font-weight: 600; color: #0a3d62; margin-bottom: 3px; }
        .pd-settings-description { font-size: 12.5px; color: #7a8fa6; }
        .pd-settings-controls { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .pd-settings-tooltip-wrapper { position: relative; display: flex; align-items: center; }
        .pd-settings-help-icon {
          width: 22px; height: 22px;
          border-radius: 50%;
          border: 1.5px solid #b0bec8;
          color: #b0bec8;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700;
          cursor: help;
          transition: all .15s;
        }
        .pd-settings-help-icon:hover { border-color: #1a6fa0; color: #1a6fa0; background: #eff6ff; }
        .pd-settings-tooltip {
          position: absolute;
          bottom: calc(100% + 10px);
          left: -100px;
          background: #0a3d62;
          color: #fff;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 12px;
          width: 200px;
          white-space: normal;
          line-height: 1.5;
          box-shadow: 0 4px 14px rgba(0,0,0,.18);
          z-index: 10;
        }
        .pd-settings-tooltip::after { content: ''; position: absolute; top: 100%; left: 108px; border: 6px solid transparent; border-top-color: #0a3d62; }
        .pd-toggle-wrap { display: flex; align-items: center; cursor: pointer; flex-shrink: 0; }
        .pd-toggle-switch {
          width: 40px; height: 22px;
          border-radius: 11px;
          background: #e4eaf0;
          border: 1.5px solid #d0d8e4;
          position: relative;
          transition: all .2s;
          display: flex; align-items: center;
          padding: 2px;
        }
        .pd-toggle-switch.active { background: #7dd8f8; border-color: #38bdf8; }
        .pd-toggle-circle {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          transition: all .2s;
        }
        .pd-toggle-switch.active .pd-toggle-circle { transform: translateX(18px); }

        /* ── Hamburger (mobile) ── */
        .pd-menu-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 34px; height: 34px;
          background: none;
          border: 1.5px solid #e4eaf0;
          border-radius: 7px;
          cursor: pointer;
          font-size: 17px;
          color: #0a3d62;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .pd-menu-btn:hover { background: #f0f4f8; }

        /* ── Sidebar backdrop (mobile) ── */
        .pd-sidebar-backdrop { display: none; }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .pd-overview-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .pd-sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            z-index: 200;
            box-shadow: none;
          }
          .pd-sidebar.open {
            transform: translateX(0);
            box-shadow: 6px 0 24px rgba(0,0,0,0.22);
          }
          .pd-sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.38);
            z-index: 150;
          }
          .pd-main { margin-left: 0; }
          .pd-menu-btn { display: flex; }
          .pd-topbar { padding: 0 14px; }
          .pd-topbar-date { display: none; }
          .pd-topbar-username { display: none; }
          .pd-content { padding: 14px 12px; }
          .pd-stats { grid-template-columns: 1fr 1fr; }
          .pd-section { padding: 16px 14px; }
          .pd-section-header { flex-wrap: wrap; gap: 8px; }
          .pd-btn { padding: 7px 13px; font-size: 12.5px; }
          .pd-page-head h2 { font-size: 17px; }
          .pd-welcome { padding: 20px 20px; }
          .pd-welcome-title { font-size: 18px; }
          .pd-settings-option { flex-direction: column; align-items: flex-start; gap: 12px; }
          .pd-settings-controls { width: 100%; justify-content: flex-end; }
          .pd-settings-tooltip { left: unset; right: 0; }
          .pd-settings-tooltip::after { left: unset; right: 14px; }
        }
        @media (max-width: 480px) {
          .pd-stats { grid-template-columns: 1fr; }
          .pd-topbar { height: 50px; }
          .pd-stat-value { font-size: 22px; }
          .pd-list-card { padding: 11px 12px; }
          .pd-welcome-actions { flex-direction: column; }
          .pd-welcome-btn { justify-content: center; }
        }
      `}</style>

      <div className="pd-root">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div className="pd-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside className={`pd-sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="pd-brand">
            <div className="pd-brand-row">
              <div className="pd-brand-icon">
                <img src="/src/assets/favicon.png" alt="MediConnect" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              <div>
                <div className="pd-brand-name">Medi<span>Connect</span></div>
                <div className="pd-brand-sub">Patient Portal</div>
              </div>
            </div>
          </div>

          <nav className="pd-nav">
            <div className="pd-nav-section">Main</div>
            {navItems.slice(0, 2).map((item) => (
              <button
                key={item.id}
                className={`pd-nav-btn${activeTab === item.id ? " active" : ""}`}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              >
                <span className="ni">{item.icon}</span>
                {item.label}
              </button>
            ))}
            <div className="pd-nav-section">Health</div>
            {navItems.slice(2, 5).map((item) => (
              <button
                key={item.id}
                className={`pd-nav-btn${activeTab === item.id ? " active" : ""}`}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              >
                <span className="ni">{item.icon}</span>
                {item.label}
              </button>
            ))}
            <div className="pd-nav-section">Account</div>
            {navItems.slice(5).map((item) => (
              <button
                key={item.id}
                className={`pd-nav-btn${activeTab === item.id ? " active" : ""}`}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              >
                <span className="ni">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pd-footer">
            <div className="pd-footer-user" onClick={() => setShowProfile(true)} title="Edit profile">
              <div className="pd-avatar">{userInitials}</div>
              <div className="pd-footer-meta">
                <div className="pd-footer-name">{user?.name || "Patient"}</div>
                <div className="pd-footer-email">{user?.email || ""}</div>
              </div>
            </div>
            <button className="pd-signout" onClick={handleLogout}>← Sign out</button>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="pd-main">
          <header className="pd-topbar">
            <div className="pd-topbar-left">
              <button className="pd-menu-btn" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle menu">☰</button>
              <span className="pd-topbar-title">{pageTitles[activeTab]}</span>
            </div>
            <div className="pd-topbar-right">
              <span className="pd-topbar-date">{todayLabel}</span>
              <NotificationBell userId={user?.id} />
              <button className="pd-profile-btn" onClick={() => setShowProfile(true)} title="Edit profile">
                {userInitials}
              </button>
              <span className="pd-topbar-username">{user?.name || "Patient"}</span>
            </div>
          </header>

          <div className="pd-content">

            {/* ──────── OVERVIEW ──────── */}
            {activeTab === "overview" && (
              <>
                {/* Welcome banner */}
                <div className="pd-welcome">
                  <div className="pd-welcome-title">Good day, {user?.name?.split(" ")[0] || "Patient"} 👋</div>
                  <div className="pd-welcome-sub">Here's a summary of your health activity. Stay on top of your appointments and prescriptions.</div>
                  <div className="pd-welcome-actions">
                    <button className="pd-welcome-btn pd-welcome-btn-primary" onClick={() => setActiveTab("appointments")}>
                      📅 Book Appointment
                    </button>
                    <button className="pd-welcome-btn pd-welcome-btn-ghost" onClick={() => setActiveTab("consultations")}>
                      💬 Start Consultation
                    </button>
                    <button className="pd-welcome-btn pd-welcome-btn-ghost" onClick={() => setActiveTab("medical")}>
                      📋 View Records
                    </button>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="pd-stats">
                  <div className="pd-stat">
                    <div className="pd-stat-accent" style={{ background: "linear-gradient(90deg,#0a3d62,#1a6fa0)" }} />
                    <div className="pd-stat-top">
                      <div className="pd-stat-label">Appointments</div>
                      <div className="pd-stat-icon-wrap" style={{ background: "#eff6ff" }}>📅</div>
                    </div>
                    <div className="pd-stat-value">{appointmentsLoading ? "…" : appointments.length}</div>
                    <div className="pd-stat-sub">{appointmentsLoading ? "Loading…" : appointments.length === 0 ? "No appointments yet" : "Total bookings"}</div>
                  </div>
                  <div className="pd-stat">
                    <div className="pd-stat-accent" style={{ background: "linear-gradient(90deg,#7c3aed,#a855f7)" }} />
                    <div className="pd-stat-top">
                      <div className="pd-stat-label">Consultations</div>
                      <div className="pd-stat-icon-wrap" style={{ background: "#f5f3ff" }}>💬</div>
                    </div>
                    <div className="pd-stat-value">{consultationsLoading ? "…" : consultations.length}</div>
                    <div className="pd-stat-sub">{consultationsLoading ? "Loading…" : consultations.length === 0 ? "No sessions" : "Active & past sessions"}</div>
                  </div>
                  <div className="pd-stat">
                    <div className="pd-stat-accent" style={{ background: "linear-gradient(90deg,#15803d,#22c55e)" }} />
                    <div className="pd-stat-top">
                      <div className="pd-stat-label">Prescriptions</div>
                      <div className="pd-stat-icon-wrap" style={{ background: "#f0fdf4" }}>💊</div>
                    </div>
                    <div className="pd-stat-value">{prescriptionsLoading ? "…" : prescriptions.length}</div>
                    <div className="pd-stat-sub">{prescriptionsLoading ? "Loading…" : prescriptions.length === 0 ? "No prescriptions yet" : "Issued by doctors"}</div>
                  </div>
                </div>

                {/* Overview grid: upcoming + recent prescriptions */}
                <div className="pd-overview-grid">
                  <div className="pd-section" style={{ marginBottom: 0 }}>
                    <div className="pd-section-header">
                      <div className="pd-section-title">📅 Upcoming Appointments</div>
                      <button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={() => setActiveTab("appointments")}>See all</button>
                    </div>
                    {appointmentsLoading ? (
                      <div className="pd-loading"><div className="pd-loading-dot"/><div className="pd-loading-dot"/><div className="pd-loading-dot"/></div>
                    ) : upcomingAppointments.length === 0 ? (
                      <div className="pd-empty" style={{ padding: "22px 8px" }}>
                        <div className="pd-empty-icon">📅</div>
                        <p>No upcoming appointments</p>
                        <button className="pd-btn pd-btn-primary pd-btn-sm" onClick={() => setActiveTab("appointments")}>Book now</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {upcomingAppointments.slice(0, 3).map(a => (
                          <div key={a.id} className="pd-mini-appt">
                            <div className="pd-mini-dot" style={{ background: a.status === "confirmed" ? "#22c55e" : "#f59e0b" }} />
                            <div className="pd-mini-body">
                              <div className="pd-mini-title">Dr. {a.doctor_name || "Doctor"}</div>
                              <div className="pd-mini-sub">{fmtDate(a.appointment_date)} · {fmtTime(a.start_time)}</div>
                            </div>
                            <span className={`pd-chip ${a.status === "confirmed" ? "success" : "warn"}`}>{a.status || "pending"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pd-section" style={{ marginBottom: 0 }}>
                    <div className="pd-section-header">
                      <div className="pd-section-title">💊 Recent Prescriptions</div>
                      <button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={() => setActiveTab("prescriptions")}>See all</button>
                    </div>
                    {prescriptionsLoading ? (
                      <div className="pd-loading"><div className="pd-loading-dot"/><div className="pd-loading-dot"/><div className="pd-loading-dot"/></div>
                    ) : prescriptions.length === 0 ? (
                      <div className="pd-empty" style={{ padding: "22px 8px" }}>
                        <div className="pd-empty-icon">💊</div>
                        <p>No prescriptions yet</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {prescriptions.slice(0, 3).map(p => (
                          <div key={p.id} className="pd-mini-appt">
                            <div className="pd-mini-dot" style={{ background: "#22c55e" }} />
                            <div className="pd-mini-body">
                              <div className="pd-mini-title">{p.doctor_name ? `Dr. ${p.doctor_name}` : "Prescription"}</div>
                              <div className="pd-mini-sub">{fmtDate(p.appointment_date || p.createdAt)}{p.diagnosis ? ` · ${p.diagnosis}` : ""}</div>
                            </div>
                            <span className="pd-chip success">Issued</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ──────── APPOINTMENTS ──────── */}
            {activeTab === "appointments" && (
              <>
                <div className="pd-page-head">
                  <h2>📅 Appointments</h2>
                  <p>Manage your upcoming and past appointments.</p>
                </div>
                <div className="pd-section">
                  <div className="pd-section-header">
                    <div className="pd-section-title">Your Bookings</div>
                    <button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={loadAppointments}>🔄 Refresh</button>
                  </div>
                  {appointmentsLoading ? (
                    <div className="pd-loading">
                      <div className="pd-loading-dot"/><div className="pd-loading-dot"/><div className="pd-loading-dot"/>
                      <span style={{ marginLeft: 6 }}>Loading appointments…</span>
                    </div>
                  ) : appointmentsError ? (
                    <div className="pd-empty">⚠ {appointmentsError}</div>
                  ) : appointments.length === 0 ? (
                    <div className="pd-empty">
                      <div className="pd-empty-icon">📅</div>
                      <p>No appointments yet. Book one below.</p>
                    </div>
                  ) : (
                    <div className="pd-list">
                      {appointments.filter(a => !hideOverdues || !isAppointmentOverdue(a)).map(a => {
                        const overdue = isAppointmentOverdue(a);
                        const iconVariant = overdue ? "danger" : a.status === "confirmed" ? "success" : a.status === "cancelled" ? "danger" : "warn";
                        return (
                          <div key={a.id} className={`pd-list-card${overdue ? " overdue" : ""}`}>
                            <div className={`pd-list-icon ${iconVariant}`}>
                              {overdue ? "⏰" : a.is_telemedicine ? "💻" : "📅"}
                            </div>
                            <div className="pd-list-body">
                              <div className="pd-list-title">
                                Dr. {a.doctor_name || "Doctor"}
                                <span className={`pd-chip ${overdue ? "overdue" : a.status === "confirmed" ? "success" : a.status === "pending" ? "warn" : a.status === "cancelled" ? "danger" : "info"}`}>
                                  {overdue ? "Overdue" : a.status || "Pending"}
                                </span>
                                {a.is_telemedicine && <span className="pd-chip info">Telemedicine</span>}
                              </div>
                              <div className="pd-list-meta">
                                {fmtDate(a.appointment_date || "")} · {fmtTime(a.start_time)} – {fmtTime(a.end_time)}
                              </div>
                              {a.reason && <div className="pd-list-note">{a.reason}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="pd-section">
                  <BookAppointment hideOverdues={hideOverdues} />
                </div>
              </>
            )}

            {/* ──────── MEDICAL ──────── */}
            {activeTab === "medical" && <MedicalRecords />}

            {/* ──────── CONSULTATIONS ──────── */}
            {activeTab === "consultations" && (
              <>
                <div className="pd-page-head">
                  <h2>💬 Video Consultations</h2>
                  <p>Connect with your doctor face-to-face via video call.</p>
                </div>
                <div className="pd-section">
                  <div className="pd-section-header">
                    <div className="pd-section-title">Your Sessions</div>
                    <button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={loadConsultations}>🔄 Refresh</button>
                  </div>
                  {consultationsLoading ? (
                    <div className="pd-loading">
                      <div className="pd-loading-dot"/><div className="pd-loading-dot"/><div className="pd-loading-dot"/>
                      <span style={{ marginLeft: 6 }}>Loading consultations…</span>
                    </div>
                  ) : consultationsError ? (
                    <div className="pd-empty">⚠ {consultationsError}</div>
                  ) : consultations.length === 0 ? (
                    <div className="pd-empty">
                      <div className="pd-empty-icon">💬</div>
                      <p>No consultations yet. Book a telemedicine appointment.</p>
                      <button className="pd-btn pd-btn-primary pd-btn-sm" onClick={() => setActiveTab("appointments")}>Book Telemedicine</button>
                    </div>
                  ) : (
                    <div className="pd-list">
                      {consultations.filter(c => !(hideEndedConsultations && c.status === "ended")).map(c => {
                        const isActive = c.status === "ongoing" || c.status === "scheduled";
                        return (
                          <div key={c.id || c.session_id} className="pd-list-card">
                            <div className={`pd-list-icon ${c.status === "ongoing" ? "success" : c.status === "ended" ? "danger" : ""}`}>
                              {c.status === "ongoing" ? "🟢" : c.status === "ended" ? "🔴" : "💬"}
                            </div>
                            <div className="pd-list-body">
                              <div className="pd-list-title">
                                Session {c.session_id || c.id || ""}
                                <span className={`pd-chip ${c.status === "ongoing" ? "success" : c.status === "ended" ? "danger" : "info"}`}>
                                  {c.status || "Scheduled"}
                                </span>
                              </div>
                              <div className="pd-list-meta">Appointment #{c.appointment_id || c.appointmentId || ""}</div>
                              {c.meeting_room && <div className="pd-list-note">Room: {c.meeting_room}</div>}
                              {isActive && (
                                <div className="pd-list-actions">
                                  <button className="pd-btn pd-btn-success pd-btn-sm" onClick={() => setActiveTab("appointments")}>▶ Join Session</button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ──────── PRESCRIPTIONS ──────── */}
            {activeTab === "prescriptions" && (
              <>
                <div className="pd-page-head">
                  <h2>💊 Prescriptions</h2>
                  <p>Prescriptions issued by your doctor after confirmed appointments.</p>
                </div>
                <div className="pd-section">
                  <div className="pd-section-header">
                    <div className="pd-section-title">All Prescriptions</div>
                    <button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={loadPrescriptions}>🔄 Refresh</button>
                  </div>
                  {prescriptionsLoading ? (
                    <div className="pd-loading">
                      <div className="pd-loading-dot"/><div className="pd-loading-dot"/><div className="pd-loading-dot"/>
                      <span style={{ marginLeft: 6 }}>Loading prescriptions…</span>
                    </div>
                  ) : prescriptionsError ? (
                    <div className="pd-empty">⚠ {prescriptionsError}</div>
                  ) : prescriptions.length === 0 ? (
                    <div className="pd-empty">
                      <div className="pd-empty-icon">💊</div>
                      <p>No prescriptions yet.</p>
                    </div>
                  ) : (
                    <div className="pd-list">
                      {prescriptions.map(p => (
                        <div key={p.id} className="pd-list-card">
                          <div className="pd-list-icon success">💊</div>
                          <div className="pd-list-body">
                            <div className="pd-list-title">
                              {p.doctor_name ? `Dr. ${p.doctor_name}` : "Prescription"}
                              <span className="pd-chip success">Issued</span>
                            </div>
                            <div className="pd-list-meta">{fmtDate(p.appointment_date || p.createdAt)}</div>
                            {p.diagnosis && <div className="pd-list-note">Diagnosis: {p.diagnosis}</div>}
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

            {/* ──────── SETTINGS ──────── */}
            {activeTab === "settings" && (
              <>
                <div className="pd-page-head">
                  <h2>⚙ Settings</h2>
                  <p>Manage your account preferences and display settings.</p>
                </div>

                {/* Profile card */}
                <div className="pd-section">
                  <div className="pd-section-header">
                    <div className="pd-section-title">👤 Profile</div>
                  </div>
                  <div className="pd-settings-stack">
                    <div className="pd-settings-option">
                      <div className="pd-settings-option-icon">✏️</div>
                      <div className="pd-settings-content">
                        <div className="pd-settings-label">Edit Profile</div>
                        <div className="pd-settings-description">Update your name, phone and personal details.</div>
                      </div>
                      <div className="pd-settings-controls">
                        <button className="pd-btn pd-btn-primary pd-btn-sm" onClick={() => setShowProfile(true)}>Edit Profile</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Display preferences */}
                <div className="pd-section">
                  <div className="pd-section-header">
                    <div className="pd-section-title">🖥 Display Preferences</div>
                  </div>
                  <div className="pd-settings-stack">
                    <div className="pd-settings-option">
                      <div className="pd-settings-option-icon">⏰</div>
                      <div className="pd-settings-content">
                        <div className="pd-settings-label">Hide Overdue Appointments</div>
                        <div className="pd-settings-description">
                          {hideOverdues ? "Overdue appointments are currently hidden." : "Overdue appointments are shown with a warning."}
                        </div>
                      </div>
                      <div className="pd-settings-controls">
                        <div className="pd-settings-tooltip-wrapper">
                          <div
                            className="pd-settings-help-icon"
                            onMouseEnter={() => setShowOverdueTooltip(true)}
                            onMouseLeave={() => setShowOverdueTooltip(false)}
                          >?</div>
                          {showOverdueTooltip && (
                            <div className="pd-settings-tooltip">
                              Hide appointments that have passed their date but aren't marked complete or cancelled.
                            </div>
                          )}
                        </div>
                        <div className="pd-toggle-wrap" onClick={() => setHideOverdues(!hideOverdues)}>
                          <div className={`pd-toggle-switch${hideOverdues ? " active" : ""}`}>
                            <div className="pd-toggle-circle" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pd-settings-option">
                      <div className="pd-settings-option-icon">🔴</div>
                      <div className="pd-settings-content">
                        <div className="pd-settings-label">Hide Ended Consultations</div>
                        <div className="pd-settings-description">
                          {hideEndedConsultations ? "Ended consultations are currently hidden." : "Ended consultations are shown in your list."}
                        </div>
                      </div>
                      <div className="pd-settings-controls">
                        <div className="pd-settings-tooltip-wrapper">
                          <div
                            className="pd-settings-help-icon"
                            onMouseEnter={() => setShowEndedConsultTooltip(true)}
                            onMouseLeave={() => setShowEndedConsultTooltip(false)}
                          >?</div>
                          {showEndedConsultTooltip && (
                            <div className="pd-settings-tooltip">
                              Hide consultations that have already ended from the Consultations tab.
                            </div>
                          )}
                        </div>
                        <div className="pd-toggle-wrap" onClick={() => {
                          const next = !hideEndedConsultations;
                          setHideEndedConsultations(next);
                          localStorage.setItem("patientHideEndedConsultations", JSON.stringify(next));
                        }}>
                          <div className={`pd-toggle-switch${hideEndedConsultations ? " active" : ""}`}>
                            <div className="pd-toggle-circle" />
                          </div>
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

      <ChatBubbleButton />
    </>
  );
};

export default PatientDashboard;

