import { useState, useEffect, useRef } from "react";
import {
  logoutUser,
  getAuthToken,
  getUserData,
  authenticatedFetch,
} from "../../utils/authService";
import {
  submitForVerification,
  getVerificationDocuments,
  getVerificationStatus,
} from "../../utils/verificationService";
import * as appointmentService from "../../utils/appointmentService";
import * as telemedicineService from "../../utils/telemedicineService";
import {
  getPatientMedicalRecords,
  getFileUrl,
} from "../../utils/medicalRecordService";
import UpdateProfileForm from "../UpdateProfileForm";
import JitsiMeeting from "../JitsiMeeting";
import PDFUploader from "../PDFUploader";
import ScheduleManager from "../ScheduleManager";
import PrescriptionManager from "../PrescriptionManager";
import { getDoctorRevenue } from "../../utils/paymentService";

const navItems = [
  { id: "overview", icon: "⊞", label: "Overview" },
  { id: "appointments", icon: "📆", label: "Appointments" },
  { id: "schedule", icon: "📅", label: "Schedule" },
  { id: "patients", icon: "👥", label: "Patients" },
  { id: "consultations", icon: "💬", label: "Consultations" },
  { id: "prescriptions", icon: "💊", label: "Prescriptions" },
  { id: "revenue", icon: "💰", label: "Revenue" },
  { id: "verification", icon: "✅", label: "Verification" },
  { id: "profile", icon: "👤", label: "Profile" },
];

const pageTitles = {
  overview: "Overview",
  appointments: "My Appointments",
  schedule: "Schedule",
  patients: "Patients",
  consultations: "Consultations",
  prescriptions: "Prescriptions",
  revenue: "Revenue",
  verification: "Verification Status",
  profile: "Doctor Profile",
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

/** Format a monetary value with K / M / B suffix. Full value shown in tooltip via title attr. */
const fmtRevenue = (amount) => {
  if (amount == null || isNaN(amount)) return "0.00";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000)
    return (amount / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "") + "B";
  if (abs >= 1_000_000)
    return (amount / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (abs >= 1_000)
    return (amount / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return amount.toFixed(2);
};

const DoctorDashboard = ({ user: initialUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Appointments tab
  const [apptFilter, setApptFilter] = useState("upcoming");
  const [apptSearch, setApptSearch] = useState("");
  const [apptTypeFilter, setApptTypeFilter] = useState("all");
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [apptError, setApptError] = useState("");
  const [chatApptId, setChatApptId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const chatEndRef = useRef(null);

  // Telemedicine meeting
  const [jitsiSession, setJitsiSession] = useState(null);
  const [fetchingSession, setFetchingSession] = useState(null);
  const [endingSession, setEndingSession] = useState(null); // appointmentId being ended
  const [endedSessions, setEndedSessions] = useState(() => {
    try {
      const stored = localStorage.getItem("doctorEndedSessions");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }); // appointmentIds whose sessions are ended

  // Patient medical records panel (per appointment)
  const [recordsApptId, setRecordsApptId] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsPatientId, setRecordsPatientId] = useState(null);

  // Patients tab - favorite patients
  const [patients, setPatients] = useState([]);
  const favKey = `doctorFavoritePatients_${getUserData()?.id ?? "unknown"}`;
  const [favoritePatientIds, setFavoritePatientIds] = useState(() => {
    try {
      const stored = localStorage.getItem(favKey);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientVisitFilter, setPatientVisitFilter] = useState("all");
  const [patientCurrentPage, setPatientCurrentPage] = useState(1);
  const patientItemsPerPage = 10;

  // Overview stats
  const [overviewStats, setOverviewStats] = useState({
    todayCount: 0,
    totalPatients: 0,
    pendingCount: 0,
    recentAppts: [],
    totalRevenue: 0,
    monthRevenue: 0,
  });
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Revenue tab
  const [revenuePeriod, setRevenuePeriod] = useState("monthly");
  const [revenueData, setRevenueData] = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState("");

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

  // Load appointments when tab or filter changes; also sync ended telemedicine sessions
  useEffect(() => {
    if (activeTab !== "appointments") return;
    setApptLoading(true);
    setApptError("");
    Promise.all([
      appointmentService.getDoctorAppointments(
        apptFilter === "ended" ? "" : apptFilter,
      ),
      telemedicineService.getSessions(),
    ]).then(([apptRes, teleRes]) => {
      if (apptRes.success) setAppointments(apptRes.data || []);
      else setApptError(apptRes.error || "Failed to load appointments");
      if (teleRes.success && Array.isArray(teleRes.data)) {
        const teleEndedIds = teleRes.data
          .filter((s) => s.status === "ended")
          .map((s) => s.appointment_id);
        // Merge with localStorage-persisted ended IDs (covers in-person sessions)
        const stored = (() => {
          try {
            return JSON.parse(
              localStorage.getItem("doctorEndedSessions") || "[]",
            );
          } catch {
            return [];
          }
        })();
        setEndedSessions(new Set([...teleEndedIds, ...stored]));
      }
      setApptLoading(false);
    });
  }, [activeTab, apptFilter]);

  // Load patients when patients tab is opened
  useEffect(() => {
    if (activeTab !== "patients") return;
    setPatientsLoading(true);
    // Fetch all appointments to extract unique patients
    appointmentService.getDoctorAppointments("").then((res) => {
      if (res.success && Array.isArray(res.data)) {
        // Extract unique patients from appointments (now enriched with patient_email)
        const patientMap = new Map();
        res.data.forEach((appt) => {
          if (appt.patient_id && appt.patient_name) {
            if (!patientMap.has(appt.patient_id)) {
              patientMap.set(appt.patient_id, {
                id: appt.patient_id,
                name: appt.patient_name,
                email: appt.patient_email || "",
                lastAppointment: appt.appointment_date,
                appointmentCount: 1,
              });
            } else {
              const patient = patientMap.get(appt.patient_id);
              patient.appointmentCount = (patient.appointmentCount || 1) + 1;
              // Update email if we get it from a later appointment
              if (!patient.email && appt.patient_email) {
                patient.email = appt.patient_email;
              }
              if (
                new Date(appt.appointment_date) >
                new Date(patient.lastAppointment)
              ) {
                patient.lastAppointment = appt.appointment_date;
              }
            }
          }
        });
        setPatients(Array.from(patientMap.values()));
      }
      setPatientsLoading(false);
    });
  }, [activeTab]);

  // Load revenue data
  useEffect(() => {
    if (activeTab !== "revenue") return;
    setRevenueLoading(true);
    setRevenueError("");
    appointmentService.getDoctorAppointments("").then(async (allRes) => {
      const allAppts = allRes.success ? allRes.data || [] : [];
      const slotIds = [
        ...new Set(allAppts.map((a) => a.slot_id).filter(Boolean)),
      ];
      const rev = await getDoctorRevenue(slotIds, revenuePeriod);
      if (rev.success) setRevenueData(rev.data || []);
      else setRevenueError(rev.error || "Failed to load revenue");
      setRevenueLoading(false);
    });
  }, [activeTab, revenuePeriod]);

  // Load overview stats
  useEffect(() => {
    if (activeTab !== "overview") return;
    setOverviewLoading(true);
    Promise.all([
      appointmentService.getDoctorAppointments("today"),
      appointmentService.getDoctorAppointments(""),
    ])
      .then(async ([todayRes, allRes]) => {
        const todayCount = todayRes.success ? (todayRes.data || []).length : 0;
        const allAppts = allRes.success ? allRes.data || [] : [];
        const patientMap = new Map();
        allAppts.forEach((a) => {
          if (a.patient_id) patientMap.set(a.patient_id, true);
        });
        const pendingCount = allAppts.filter(
          (a) => a.status === "pending",
        ).length;
        const todayStr = new Date().toISOString().split("T")[0];
        const recentAppts = allAppts
          .filter(
            (a) =>
              a.appointment_date &&
              a.appointment_date.split("T")[0] >= todayStr &&
              a.status !== "cancelled",
          )
          .sort(
            (a, b) =>
              new Date(a.appointment_date) - new Date(b.appointment_date),
          )
          .slice(0, 5);

        // Fetch revenue summary (all-time + this month)
        const slotIds = [
          ...new Set(allAppts.map((a) => a.slot_id).filter(Boolean)),
        ];
        const [allRevRes, monthRevRes] = await Promise.all([
          getDoctorRevenue(slotIds, "monthly"),
          getDoctorRevenue(slotIds, "monthly"),
        ]);
        const allRevRows = allRevRes.success ? allRevRes.data || [] : [];
        const totalRevenue = allRevRows.reduce(
          (s, r) => s + (r.revenue || 0),
          0,
        );
        const thisMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
        const monthRevenue = allRevRows
          .filter(
            (r) =>
              r.period_start && r.period_start.slice(0, 7) === thisMonthStr,
          )
          .reduce((s, r) => s + (r.revenue || 0), 0);

        setOverviewStats({
          todayCount,
          totalPatients: patientMap.size,
          pendingCount,
          recentAppts,
          totalRevenue,
          monthRevenue,
        });
        setOverviewLoading(false);
      })
      .catch(() => setOverviewLoading(false));
  }, [activeTab]);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleApprove = async (apptId) => {
    setApprovingId(apptId);
    const res = await appointmentService.approveAppointment(apptId);
    if (res.success) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status: "confirmed" } : a)),
      );
    }
    setApprovingId(null);
  };

  const handleJoinMeeting = async (appt) => {
    setFetchingSession(appt.id);
    const res = await telemedicineService.getSessionByAppointment(appt.id);
    if (res.success && res.data) {
      setJitsiSession({
        roomName: res.data.meeting_room,
        displayName: `Dr. ${user?.name || "Doctor"}`,
        sessionId: res.data.id,
        appointmentId: appt.id,
      });
    } else {
      alert("Meeting room not available yet. Please try again shortly.");
    }
    setFetchingSession(null);
  };

  const handleEndConsultation = async (appt) => {
    if (
      !window.confirm(
        `End consultation with ${appt.patient_name || "this patient"}? The session will be closed and removed from your active list.`,
      )
    )
      return;
    setEndingSession(appt.id);
    // For telemedicine appointments, also mark the video session as ended in the DB
    if (appt.is_telemedicine) {
      const sessionRes = await telemedicineService.getSessionByAppointment(
        appt.id,
      );
      if (sessionRes.success && sessionRes.data) {
        await telemedicineService.endSession(sessionRes.data.id);
      }
    }
    // Persist to localStorage so in-person ended state survives page refresh
    const stored = (() => {
      try {
        return JSON.parse(localStorage.getItem("doctorEndedSessions") || "[]");
      } catch {
        return [];
      }
    })();
    localStorage.setItem(
      "doctorEndedSessions",
      JSON.stringify([...new Set([...stored, appt.id])]),
    );
    setEndedSessions((prev) => new Set([...prev, appt.id]));
    setEndingSession(null);
  };

  const openChat = async (apptId) => {
    // Close records panel if open for a different appointment
    if (recordsApptId && recordsApptId !== apptId) closeRecords();
    setChatApptId(apptId);
    setChatMessages([]);
    const res = await appointmentService.getMessages(apptId);
    if (res.success) setChatMessages(res.data || []);
  };

  const closeChat = () => {
    setChatApptId(null);
    setChatMessages([]);
    setChatInput("");
  };

  const openRecords = async (apptId, patientId) => {
    // Close chat if open for a different appointment
    if (chatApptId && chatApptId !== apptId) closeChat();
    if (recordsApptId === apptId) {
      closeRecords();
      return;
    }
    setRecordsApptId(apptId);
    setRecordsPatientId(patientId);
    setRecordsLoading(true);
    setPatientRecords([]);
    const res = await getPatientMedicalRecords(patientId);
    if (res.success) setPatientRecords(res.data || []);
    setRecordsLoading(false);
  };

  const closeRecords = () => {
    setRecordsApptId(null);
    setPatientRecords([]);
    setRecordsPatientId(null);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatApptId) return;
    setChatSending(true);
    const res = await appointmentService.sendMessage(
      chatApptId,
      chatInput.trim(),
    );
    if (res.success) {
      setChatMessages((prev) => [...prev, res.data]);
      setChatInput("");
    }
    setChatSending(false);
  };

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

  const toggleFavoritePatient = (patientId) => {
    setFavoritePatientIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(patientId)) {
        updated.delete(patientId);
      } else {
        updated.add(patientId);
      }
      // Save to localStorage (keyed per doctor)
      localStorage.setItem(favKey, JSON.stringify(Array.from(updated)));
      return updated;
    });
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

  const doctorInitials = (user?.name || "D")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

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
          position: relative;
        }
        .dd-nav-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); }
        .dd-nav-btn.active { background: rgba(125,216,248,0.15); color: #7dd8f8; font-weight: 600; }
        .dd-nav-btn.active::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 3px;
          background: #7dd8f8;
          border-radius: 0 3px 3px 0;
        }
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
          padding: 6px 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .dd-footer-user:hover { background: rgba(255,255,255,0.07); }
        .dd-avatar {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #1a6fa0, #7dd8f8);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #fff;
          flex-shrink: 0;
          text-transform: uppercase; letter-spacing: 0.5px;
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
          display: flex; align-items: center; justify-content: center; gap: 6px;
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
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0; z-index: 50;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .dd-topbar-left { display: flex; align-items: center; gap: 10px; }
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
        .dd-topbar-date {
          font-size: 12px;
          color: #b0bec8;
          font-weight: 500;
        }
        .dd-topbar-username {
          font-size: 13px;
          font-weight: 600;
          color: #1a3550;
        }
        .dd-profile-btn {
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
        .dd-profile-btn:hover {
          border-color: #7dd8f8;
          transform: scale(1.05);
          box-shadow: 0 0 0 3px rgba(125,216,248,0.25);
        }
        /* Hamburger — hidden on desktop, shown on mobile */
        .dd-menu-btn {
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
        .dd-menu-btn:hover { background: #f0f4f8; }
        /* Sidebar backdrop — hidden on desktop */
        .dd-sidebar-backdrop { display: none; }
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
        .dd-stat-accent { display:inline-block; width:3px; height:32px; border-radius:3px; position:absolute; left:0; top:50%; transform:translateY(-50%); }
        .dd-stat { position:relative; overflow:hidden; transition: box-shadow 0.2s, border-color 0.2s; }
        .dd-stat:hover { box-shadow: 0 4px 14px rgba(10,61,98,0.10); border-color: #b8d4ea; }

        /* ── Overview greeting ── */
        .dov-hero {
          background: linear-gradient(135deg, #0a3d62 0%, #1a6fa0 60%, #3b9ed9 100%);
          border-radius: 14px;
          padding: 24px 28px;
          margin-bottom: 20px;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .dov-hero-left h1 { font-family:'Sora',sans-serif; font-size:22px; font-weight:700; margin:0 0 4px; line-height:1.2; }
        .dov-hero-left p { font-size:13px; opacity:0.82; margin:0; }
        .dov-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px; font-size:11.5px; font-weight:700; margin-top:10px; }
        .dov-badge.verified { background:rgba(74,222,128,0.18); border:1px solid rgba(74,222,128,0.4); color:#bbf7d0; }
        .dov-badge.pending-v { background:rgba(251,191,36,0.18); border:1px solid rgba(251,191,36,0.4); color:#fde68a; }
        .dov-badge.unverified { background:rgba(248,113,113,0.18); border:1px solid rgba(248,113,113,0.4); color:#fecaca; }
        .dov-hero-avatar { width:64px; height:64px; border-radius:50%; background:rgba(255,255,255,0.15); border:2px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; font-size:30px; flex-shrink:0; }

        /* ── Recent appointments ── */
        .dov-recent { background:#fff; border:1px solid #e4eaf0; border-radius:10px; padding:18px 20px; margin-bottom:14px; box-sizing:border-box; overflow:hidden; }
        .dov-recent-title { font-family:'Sora',sans-serif; font-size:13.5px; font-weight:700; color:#0a3d62; margin-bottom:14px; display:flex; align-items:center; gap:7px; }
        .dov-appt-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #f0f4f8; }
        .dov-appt-row:last-child { border-bottom:none; padding-bottom:0; }
        .dov-appt-avatar { width:36px; height:36px; border-radius:8px; background:linear-gradient(135deg,#1a6fa0,#3b9ed9); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; flex-shrink:0; }
        .dov-appt-info { flex:1; min-width:0; }
        .dov-appt-name { font-size:13.5px; font-weight:600; color:#1a3a52; }
        .dov-appt-time { font-size:11.5px; color:#7a8fa6; margin-top:1px; }
        .dov-appt-status { font-size:11px; font-weight:700; padding:3px 8px; border-radius:10px; white-space:nowrap; flex-shrink:0; }
        .dov-appt-status.pending { background:#fef9c3; color:#a16207; border:1px solid #fde047; }
        .dov-appt-status.confirmed { background:#dcfce7; color:#15803d; border:1px solid #86efac; }
        .dov-appt-status.completed { background:#eff6ff; color:#1d4ed8; border:1px solid #93c5fd; }
        .dov-empty { text-align:center; padding:28px 16px; color:#b0bec8; font-size:13px; }

        /* â”€â”€ Sections â”€â”€ */
        .dd-section {
          background: #fff;
          border: 1px solid #e4eaf0;
          border-radius: 10px;
          padding: 20px 22px;
          margin-bottom: 14px;
          box-sizing: border-box;
          overflow: hidden;
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

        /* ── Revenue tab ── */
        .rev-period-tabs { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
        .rev-period-btn {
          padding: 7px 18px;
          border-radius: 20px;
          border: 1.5px solid #e4eaf0;
          background: #fff;
          color: #5a7184;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.17s;
        }
        .rev-period-btn.active {
          background: linear-gradient(135deg, #0a3d62, #1a6fa0);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 2px 8px rgba(10,61,98,0.18);
        }
        .rev-period-btn:not(.active):hover { border-color: #0a3d62; color: #0a3d62; }

        .rev-summary-row { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:22px; }
        .rev-summary-card {
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e9eef5;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .rev-summary-label { font-size: 12px; color: #7a8fa6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
        .rev-summary-value { font-size: 24px; font-weight: 800; color: #0a3d62; font-family: 'Sora', sans-serif; }
        .rev-summary-sub { font-size: 12px; color: #7a8fa6; }

        .rev-chart-wrap {
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e9eef5;
          padding: 20px 18px 16px;
          margin-bottom: 20px;
        }
        .rev-chart-title { font-size: 14px; font-weight: 700; color: #1e3a52; margin-bottom: 16px; }
        .rev-bars { display:flex; align-items:flex-end; gap:6px; height:160px; overflow-x:auto; padding-bottom:4px; }
        .rev-bar-col { display:flex; flex-direction:column; align-items:center; flex:1; min-width:34px; max-width:64px; }
        .rev-bar {
          width: 100%;
          border-radius: 5px 5px 0 0;
          background: linear-gradient(180deg, #1a6fa0, #0a3d62);
          transition: height 0.4s ease;
          position: relative;
          cursor: pointer;
        }
        .rev-bar:hover { opacity: 0.82; }
        .rev-bar-label { font-size: 10px; color: #7a8fa6; margin-top: 5px; text-align:center; white-space:nowrap; }
        .rev-bar-val { font-size: 10px; color: #3a5068; font-weight: 700; margin-bottom: 2px; }
        .rev-no-data { text-align:center; padding: 40px 0; color: #b0bec8; font-size: 14px; }

        .rev-table-wrap { background:#fff; border-radius:12px; border:1px solid #e9eef5; overflow:hidden; }
        .rev-table { width:100%; border-collapse:collapse; font-size:13px; }
        .rev-th { background:#f7f9fb; padding:10px 14px; font-weight:700; color:#1e3a52; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.4px; border-bottom:1px solid #e9eef5; }
        .rev-td { padding:10px 14px; color:#3a5068; border-bottom:1px solid #f0f4f8; }
        .rev-tr:last-child .rev-td { border-bottom:none; }
        .rev-td.amount { font-weight:700; color:#0a7a3d; }

        @media (max-width: 640px) {
          .rev-summary-row { grid-template-columns: 1fr 1fr; }
          .rev-summary-value { font-size: 19px; }
        }
        @media (max-width: 420px) {
          .rev-summary-row { grid-template-columns: 1fr; }
        }

        /* ─── Responsive layout ─── */
        @media (max-width: 768px) {
          .dd-sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            z-index: 200;
            box-shadow: none;
          }
          .dd-sidebar.open {
            transform: translateX(0);
            box-shadow: 6px 0 24px rgba(0,0,0,0.22);
          }
          .dd-sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.38);
            z-index: 150;
          }
          .dd-main { margin-left: 0; }
          .dd-menu-btn { display: flex; }
          .dd-topbar { padding: 0 14px; }
          .dd-topbar-date { display: none; }
          .dd-topbar-username { display: none; }
          .dd-content { padding: 14px 12px; }
          .dd-stats { grid-template-columns: 1fr 1fr; }
          .dd-section { padding: 16px 14px; }
          .dd-page-head h2 { font-size: 17px; }
          .dov-hero { padding: 18px; }
          .dov-hero-left h1 { font-size: 17px; }
          .dov-hero-avatar { width: 48px; height: 48px; font-size: 22px; }
          .rev-summary-row { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="dd-root">
        {/* Sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="dd-sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Sidebar */}
        <aside className={`dd-sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="dd-brand">
            <div className="dd-brand-row">
              <div className="dd-brand-icon">
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
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
              >
                <span className="ni">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="dd-footer">
            <div className="dd-footer-user">
              <div className="dd-avatar">{doctorInitials}</div>
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
            <div className="dd-topbar-left">
              <button
                className="dd-menu-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                &#9776;
              </button>
              <span className="dd-topbar-title">{pageTitles[activeTab]}</span>
            </div>
            <div className="dd-topbar-right">
              <span className="dd-topbar-date">{todayLabel}</span>
              <button
                className="dd-profile-btn"
                onClick={() => setShowProfile(true)}
                title="Edit profile"
              >
                {doctorInitials}
              </button>
              <span className="dd-topbar-username">
                Dr. {user?.name || "Doctor"}
              </span>
            </div>
          </header>

          <div className="dd-content">
            {activeTab === "overview" &&
              (() => {
                const hour = new Date().getHours();
                const greeting =
                  hour < 12
                    ? "Good morning"
                    : hour < 17
                      ? "Good afternoon"
                      : "Good evening";
                const fmtDate = (d) =>
                  new Date(d).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  });
                const fmt12 = (t) => {
                  if (!t) return "";
                  const [h, m] = t.split(":").map(Number);
                  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
                };
                const vBadge =
                  verificationStatus?.status === "approved"
                    ? { cls: "verified", icon: "✅", label: "Verified Doctor" }
                    : verificationStatus?.status === "pending"
                      ? {
                          cls: "pending-v",
                          icon: "⏳",
                          label: "Verification Pending",
                        }
                      : verificationStatus?.status === "rejected"
                        ? {
                            cls: "unverified",
                            icon: "❌",
                            label: "Verification Rejected",
                          }
                        : {
                            cls: "unverified",
                            icon: "⚠️",
                            label: "Not Verified",
                          };
                return (
                  <>
                    {/* Hero banner */}
                    <div className="dov-hero">
                      <div className="dov-hero-left">
                        <h1>
                          {greeting}, Dr. {user?.name || "Doctor"}!
                        </h1>
                        <p>Here's a snapshot of your practice today.</p>
                        <div className={`dov-badge ${vBadge.cls}`}>
                          {vBadge.icon} {vBadge.label}
                        </div>
                      </div>
                      <div className="dov-hero-avatar">👨‍⚕️</div>
                    </div>

                    {/* Stat cards */}
                    <div className="dd-stats">
                      <div className="dd-stat">
                        <div
                          className="dd-stat-accent"
                          style={{ background: "#1a6fa0" }}
                        />
                        <div className="dd-stat-top">
                          <div className="dd-stat-label">
                            Today's Appointments
                          </div>
                          <div className="dd-stat-icon">📅</div>
                        </div>
                        <div className="dd-stat-value">
                          {overviewLoading ? "—" : overviewStats.todayCount}
                        </div>
                        <div className="dd-stat-sub">
                          {overviewStats.todayCount === 1
                            ? "1 appointment"
                            : `${overviewStats.todayCount} appointments`}{" "}
                          today
                        </div>
                      </div>
                      <div className="dd-stat">
                        <div
                          className="dd-stat-accent"
                          style={{ background: "#16a34a" }}
                        />
                        <div className="dd-stat-top">
                          <div className="dd-stat-label">Total Patients</div>
                          <div className="dd-stat-icon">👥</div>
                        </div>
                        <div className="dd-stat-value">
                          {overviewLoading ? "—" : overviewStats.totalPatients}
                        </div>
                        <div className="dd-stat-sub">
                          {overviewStats.totalPatients === 0
                            ? "No patients yet"
                            : "Registered patients"}
                        </div>
                      </div>
                      <div className="dd-stat">
                        <div
                          className="dd-stat-accent"
                          style={{ background: "#d97706" }}
                        />
                        <div className="dd-stat-top">
                          <div className="dd-stat-label">Pending Approvals</div>
                          <div className="dd-stat-icon">⏳</div>
                        </div>
                        <div className="dd-stat-value">
                          {overviewLoading ? "—" : overviewStats.pendingCount}
                        </div>
                        <div className="dd-stat-sub">
                          {overviewStats.pendingCount === 0
                            ? "All up to date"
                            : "Awaiting your approval"}
                        </div>
                      </div>
                      <div className="dd-stat">
                        <div
                          className="dd-stat-accent"
                          style={{
                            background:
                              verificationStatus?.status === "approved"
                                ? "#16a34a"
                                : "#d97706",
                          }}
                        />
                        <div className="dd-stat-top">
                          <div className="dd-stat-label">Verification</div>
                          <div className="dd-stat-icon">
                            {verificationStatus?.status === "approved"
                              ? "✅"
                              : "🔖"}
                          </div>
                        </div>
                        <div
                          className="dd-stat-value"
                          style={{ fontSize: "18px", paddingTop: "4px" }}
                        >
                          {verificationStatus?.status === "approved"
                            ? "Active"
                            : verificationStatus?.status === "pending"
                              ? "Pending"
                              : verificationStatus?.status === "rejected"
                                ? "Rejected"
                                : "None"}
                        </div>
                        <div className="dd-stat-sub">
                          {verificationStatus?.status === "approved"
                            ? "Account in good standing"
                            : "Submit documents to verify"}
                        </div>
                      </div>
                      <div className="dd-stat">
                        <div
                          className="dd-stat-accent"
                          style={{ background: "#0d9488" }}
                        />
                        <div className="dd-stat-top">
                          <div className="dd-stat-label">This Month</div>
                          <div className="dd-stat-icon">💳</div>
                        </div>
                        <div
                          className="dd-stat-value"
                          style={{ fontSize: "16px" }}
                        >
                          {overviewLoading
                            ? "—"
                            : `LKR ${fmtRevenue(overviewStats.monthRevenue)}`}
                        </div>
                        <div className="dd-stat-sub">Revenue this month</div>
                      </div>
                      <div className="dd-stat">
                        <div
                          className="dd-stat-accent"
                          style={{ background: "#7c3aed" }}
                        />
                        <div className="dd-stat-top">
                          <div className="dd-stat-label">Total Revenue</div>
                          <div className="dd-stat-icon">💰</div>
                        </div>
                        <div
                          className="dd-stat-value"
                          style={{ fontSize: "16px" }}
                        >
                          {overviewLoading
                            ? "—"
                            : `LKR ${fmtRevenue(overviewStats.totalRevenue)}`}
                        </div>
                        <div className="dd-stat-sub">
                          All completed payments
                        </div>
                      </div>
                    </div>

                    {/* Upcoming appointments */}
                    <div className="dov-recent">
                      <div className="dov-recent-title">
                        📆 Upcoming Appointments
                      </div>
                      {overviewLoading ? (
                        <div className="dov-empty">Loading…</div>
                      ) : overviewStats.recentAppts.length === 0 ? (
                        <div className="dov-empty">
                          No upcoming appointments scheduled.
                        </div>
                      ) : (
                        overviewStats.recentAppts.map((appt) => {
                          const initials = (appt.patient_name || "P")
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);
                          return (
                            <div key={appt.id} className="dov-appt-row">
                              <div className="dov-appt-avatar">{initials}</div>
                              <div className="dov-appt-info">
                                <div className="dov-appt-name">
                                  {appt.patient_name || "Patient"}
                                </div>
                                <div className="dov-appt-time">
                                  {fmtDate(appt.appointment_date)}
                                  {appt.start_time
                                    ? ` · ${fmt12(appt.start_time)}`
                                    : ""}
                                </div>
                              </div>
                              <span
                                className={`dov-appt-status ${appt.status}`}
                              >
                                {appt.status === "pending"
                                  ? "⏳ Pending"
                                  : appt.status === "confirmed"
                                    ? "✅ Confirmed"
                                    : "✔ Completed"}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                );
              })()}

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
                <style>{`
                  .dp-toolbar { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:20px; }
                  .dp-filter-btn { padding:6px 16px; border-radius:20px; border:1.5px solid #e4eaf0; background:#f8fafc; color:#3a5068; font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; white-space:nowrap; }
                  .dp-filter-btn.active { border-color:#1a6fa0; background:#eff6ff; color:#1a6fa0; }
                  .dp-section-title { font-family:'Sora',sans-serif; font-size:14px; font-weight:700; color:#0a3d62; margin-bottom:14px; display:flex; align-items:center; gap:7px; }
                  .dp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; }
                  .dp-card { background:#fff; border:1.5px solid #e4eaf0; border-radius:12px; overflow:hidden; padding:16px; transition:all .2s; position:relative; }
                  .dp-card:hover { box-shadow:0 4px 12px rgba(10,61,98,0.12); border-color:#7dd8f8; }
                  .dp-card.favorite { border-color:#fbbf24; background:#fffbf0; }
                  .dp-favorite-btn { position:absolute; top:12px; right:12px; background:none; border:none; font-size:20px; cursor:pointer; transition:all .2s; padding:0; width:32px; height:32px; display:flex; align-items:center; justify-content:center; }
                  .dp-favorite-btn:hover { transform:scale(1.2); }
                  .dp-header { display:flex; align-items:flex-start; gap:12px; margin-bottom:14px; padding-right:32px; }
                  .dp-avatar { width:48px; height:48px; border-radius:8px; background:linear-gradient(135deg,#1a6fa0,#3b9ed9); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:18px; flex-shrink:0; }
                  .dp-info { flex:1; min-width:0; }
                  .dp-name { font-size:15px; font-weight:700; color:#0a3d62; margin-bottom:2px; }
                  .dp-email { font-size:12px; color:#7a8fa6; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
                  .dp-meta { display:flex; gap:12px; margin-top:10px; padding-top:10px; border-top:1px solid #f0f4f8; flex-wrap:wrap; }
                  .dp-meta-item { font-size:11px; color:#7a8fa6; }
                  .dp-meta-item strong { color:#0a3d62; font-weight:700; display:block; }
                  .dp-badges { display:flex; gap:6px; margin-top:10px; flex-wrap:wrap; }
                  .dp-badge { display:inline-flex; align-items:center; gap:4px; padding:4px 8px; border-radius:20px; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:700; border:1px solid #93c5fd; }
                  .dp-empty { text-align:center; padding:40px 24px; }
                  .dp-empty-icon { font-size:48px; margin-bottom:12px; opacity:0.5; }
                  .dp-empty-text { font-size:14px; color:#7a8fa6; }
                  .dp-table-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; border-radius:8px; border:1.5px solid #e4eaf0; width:100%; }
                  .dp-table { width:100%; border-collapse:collapse; font-size:13px; min-width:480px; table-layout:fixed; }
                  .dp-table col.col-name { width:24%; }
                  .dp-table col.col-email { width:32%; }
                  .dp-table col.col-appts { width:14%; }
                  .dp-table col.col-visit { width:18%; }
                  .dp-table col.col-action { width:12%; }
                  .dp-th { padding:10px 12px; text-align:left; font-weight:700; color:#0a3d62; font-size:11.5px; text-transform:uppercase; letter-spacing:0.4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                  .dp-th-center { text-align:center; }
                  .dp-td { padding:10px 12px; color:#1a3a52; overflow:hidden; text-overflow:ellipsis; }
                  .dp-pagination { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-top:16px; padding-top:12px; border-top:1px solid #f0f4f8; }
                  .dp-pagination-info { font-size:12px; color:#7a8fa6; }
                  .dp-pagination-btns { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
                  .dp-pg-btn { padding:6px 12px; border:1.5px solid #e4eaf0; border-radius:6px; background:#f8fafc; color:#3a5068; font-size:12px; font-weight:600; cursor:pointer; transition:all .15s; min-width:32px; text-align:center; }
                  .dp-pg-btn:disabled { opacity:.5; cursor:default; }
                  .dp-pg-btn.active { border-color:#1a6fa0; background:#eff6ff; color:#1a6fa0; }
                  .dp-pg-btn:not(:disabled):hover { background:#eff6ff; border-color:#1a6fa0; }
                  .dp-search-wrap { position:relative; flex:1; min-width:180px; max-width:320px; }
                  .dp-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); font-size:13px; color:#b0bec8; pointer-events:none; }
                  .dp-search-input { width:100%; box-sizing:border-box; padding:8px 32px 8px 32px; border:1.5px solid #e4eaf0; border-radius:8px; font-size:13px; font-family:'DM Sans',sans-serif; background:#fff; color:#1a3a52; outline:none; transition:border-color 0.2s; }
                  .dp-search-input:focus { border-color:#1a6fa0; }
                  .dp-search-clear { position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:#b0bec8; cursor:pointer; font-size:14px; line-height:1; padding:0; }
                  .dp-search-clear:hover { color:#1a6fa0; }
                  .dp-toolbar-clear { padding:7px 13px; border-radius:8px; border:1.5px solid #e4eaf0; background:#f8fafc; color:#7a8fa6; font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap; transition:all .15s; font-family:'DM Sans',sans-serif; }
                  .dp-toolbar-clear:hover { background:#fee2e2; border-color:#fca5a5; color:#dc2626; }
                  .dp-no-results { text-align:center; padding:32px 16px; }
                  .dp-no-results-icon { font-size:36px; margin-bottom:10px; opacity:0.45; }
                  .dp-no-results-text { font-size:13.5px; color:#7a8fa6; }
                  @media (max-width: 768px) {
                    .dp-grid { grid-template-columns: 1fr; }
                    .dp-card { padding:14px; }
                  }
                  @media (max-width: 480px) {
                    .dp-section-title { font-size:13px; }
                    .dp-name { font-size:14px; }
                    .dp-pagination { flex-direction:column; align-items:flex-start; }
                    .dp-pagination-btns { width:100%; justify-content:center; }
                  }
                `}</style>
                <div className="dd-page-head">
                  <h2>Patients</h2>
                  <p>View and manage your registered patients.</p>
                </div>

                {patientsLoading ? (
                  <div className="dd-section">
                    <div className="dp-empty">
                      <div style={{ fontSize: "16px", color: "#7a8fa6" }}>
                        Loading patients…
                      </div>
                    </div>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="dd-section">
                    <div className="dp-empty">
                      <div className="dp-empty-icon">👥</div>
                      <p className="dp-empty-text">No patients yet.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {favoritePatientIds.size > 0 && (
                      <div className="dd-section">
                        <div className="dp-section-title">
                          ⭐ Favorite Patients
                        </div>
                        <div className="dp-grid">
                          {patients
                            .filter((p) => favoritePatientIds.has(p.id))
                            .map((patient) => {
                              const initials = patient.name
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2);
                              const lastApptDate = patient.lastAppointment
                                ? new Date(
                                    patient.lastAppointment,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "No appointments";
                              return (
                                <div
                                  key={patient.id}
                                  className={`dp-card favorite`}
                                >
                                  <button
                                    className="dp-favorite-btn"
                                    onClick={() =>
                                      toggleFavoritePatient(patient.id)
                                    }
                                    title="Remove from favorites"
                                  >
                                    ⭐
                                  </button>
                                  <div className="dp-header">
                                    <div className="dp-avatar">{initials}</div>
                                    <div className="dp-info">
                                      <div className="dp-name">
                                        {patient.name}
                                      </div>
                                      {patient.email && (
                                        <div className="dp-email">
                                          {patient.email}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="dp-meta">
                                    <div className="dp-meta-item">
                                      <strong>
                                        {patient.appointmentCount}
                                      </strong>
                                      Appointment
                                      {patient.appointmentCount !== 1
                                        ? "s"
                                        : ""}
                                    </div>
                                    <div
                                      className="dp-meta-item"
                                      style={{ marginLeft: "auto" }}
                                    >
                                      <strong>Last Visit</strong>
                                      {lastApptDate}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    <div className="dd-section">
                      <div className="dp-section-title">All Patients</div>

                      {/* Search bar */}
                      <div style={{ marginBottom: "16px" }}>
                        <input
                          type="text"
                          placeholder="Search patients by name or email..."
                          value={patientSearch}
                          onChange={(e) => {
                            setPatientSearch(e.target.value);
                            setPatientCurrentPage(1);
                          }}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "10px 14px",
                            border: "1.5px solid #e4eaf0",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontFamily: "'DM Sans', sans-serif",
                            outline: "none",
                            transition: "border-color 0.2s",
                            background: "#fff",
                            color: "#1a3a52",
                            display: "block",
                          }}
                          onFocus={(e) =>
                            (e.target.style.borderColor = "#1a6fa0")
                          }
                          onBlur={(e) =>
                            (e.target.style.borderColor = "#e4eaf0")
                          }
                        />
                      </div>

                      {/* Table */}
                      {(() => {
                        // Apply search + visit filter (includes all patients, favorites and non-favorites)
                        const filteredPatients = patients.filter((p) => {
                          const q = patientSearch.toLowerCase();
                          const matchSearch =
                            !q ||
                            p.name.toLowerCase().includes(q) ||
                            (p.email && p.email.toLowerCase().includes(q));
                          const c = p.appointmentCount || 0;
                          const matchVisit =
                            patientVisitFilter === "all"
                              ? true
                              : patientVisitFilter === "new"
                                ? c === 1
                                : patientVisitFilter === "returning"
                                  ? c >= 2 && c <= 5
                                  : patientVisitFilter === "frequent"
                                    ? c >= 6
                                    : true;
                          return matchSearch && matchVisit;
                        });

                        const totalPages = Math.ceil(
                          filteredPatients.length / patientItemsPerPage,
                        );
                        const startIndex =
                          (patientCurrentPage - 1) * patientItemsPerPage;
                        const paginatedPatients = filteredPatients.slice(
                          startIndex,
                          startIndex + patientItemsPerPage,
                        );

                        if (filteredPatients.length === 0) {
                          return (
                            <div className="dp-no-results">
                              <div className="dp-no-results-icon">
                                &#128101;
                              </div>
                              <p className="dp-no-results-text">
                                {patientSearch || patientVisitFilter !== "all"
                                  ? "No patients match your search or filter."
                                  : "No patients yet."}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <>
                            <div className="dp-table-wrap">
                              <table className="dp-table">
                                <colgroup>
                                  <col className="col-name" />
                                  <col className="col-email" />
                                  <col className="col-appts" />
                                  <col className="col-visit" />
                                  <col className="col-action" />
                                </colgroup>
                                <thead>
                                  <tr
                                    style={{
                                      background: "#f8fafc",
                                      borderBottom: "1.5px solid #e4eaf0",
                                    }}
                                  >
                                    <th className="dp-th">Patient Name</th>
                                    <th className="dp-th">Email</th>
                                    <th className="dp-th dp-th-center">
                                      Appointments
                                    </th>
                                    <th className="dp-th">Last Visit</th>
                                    <th className="dp-th dp-th-center">
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {paginatedPatients.map((patient, idx) => {
                                    const lastApptDate = patient.lastAppointment
                                      ? new Date(
                                          patient.lastAppointment,
                                        ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })
                                      : "—";
                                    return (
                                      <tr
                                        key={patient.id}
                                        style={{
                                          borderBottom: "1px solid #f0f4f8",
                                          background:
                                            idx % 2 === 0 ? "#fff" : "#f8fafc",
                                        }}
                                      >
                                        <td
                                          className="dp-td"
                                          style={{
                                            fontWeight: 600,
                                            color: "#0a3d62",
                                          }}
                                        >
                                          {patient.name}
                                        </td>
                                        <td
                                          className="dp-td"
                                          style={{
                                            color: patient.email
                                              ? "#1a3a52"
                                              : "#c0c0c0",
                                            wordBreak: "break-word",
                                            fontWeight: patient.email
                                              ? 500
                                              : 400,
                                          }}
                                        >
                                          {patient.email && patient.email.trim()
                                            ? patient.email
                                            : "—"}
                                        </td>
                                        <td
                                          className="dp-td"
                                          style={{
                                            textAlign: "center",
                                            color: "#1a6fa0",
                                            fontWeight: 700,
                                          }}
                                        >
                                          {patient.appointmentCount}
                                        </td>
                                        <td
                                          className="dp-td"
                                          style={{ color: "#7a8fa6" }}
                                        >
                                          {lastApptDate}
                                        </td>
                                        <td
                                          className="dp-td"
                                          style={{ textAlign: "center" }}
                                        >
                                          <button
                                            onClick={() =>
                                              toggleFavoritePatient(patient.id)
                                            }
                                            style={{
                                              background: "none",
                                              border: "none",
                                              fontSize: "18px",
                                              cursor: "pointer",
                                              color: "#cbd5e1",
                                              transition: "all 0.2s",
                                              padding: "4px 8px",
                                            }}
                                            title="Add to favorites"
                                            onMouseEnter={(e) =>
                                              (e.target.style.transform =
                                                "scale(1.2)")
                                            }
                                            onMouseLeave={(e) =>
                                              (e.target.style.transform =
                                                "scale(1)")
                                            }
                                          >
                                            ☆
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Pagination */}
                            <div className="dp-pagination">
                              <span className="dp-pagination-info">
                                Showing {startIndex + 1} to{" "}
                                {Math.min(
                                  startIndex + patientItemsPerPage,
                                  filteredPatients.length,
                                )}{" "}
                                of {filteredPatients.length} patients
                              </span>
                              <div className="dp-pagination-btns">
                                <button
                                  className="dp-pg-btn"
                                  onClick={() =>
                                    setPatientCurrentPage(
                                      Math.max(1, patientCurrentPage - 1),
                                    )
                                  }
                                  disabled={patientCurrentPage === 1}
                                >
                                  ← Prev
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => (
                                  <button
                                    key={i + 1}
                                    className={`dp-pg-btn${patientCurrentPage === i + 1 ? " active" : ""}`}
                                    onClick={() => setPatientCurrentPage(i + 1)}
                                  >
                                    {i + 1}
                                  </button>
                                ))}
                                <button
                                  className="dp-pg-btn"
                                  onClick={() =>
                                    setPatientCurrentPage(
                                      Math.min(
                                        totalPages,
                                        patientCurrentPage + 1,
                                      ),
                                    )
                                  }
                                  disabled={patientCurrentPage === totalPages}
                                >
                                  Next →
                                </button>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </>
                )}
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
                    <div className="dd-empty-icon">📹</div>
                    <p>
                      Go to the <strong>Appointments</strong> tab and click the{" "}
                      <span
                        style={{
                          background: "#dcfce7",
                          color: "#15803d",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontWeight: 700,
                        }}
                      >
                        📹 Join
                      </span>{" "}
                      button on a confirmed telemedicine appointment to start a
                      video session.
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeTab === "prescriptions" && (
              <>
                <div className="dd-page-head">
                  <h2>Prescriptions</h2>
                  <p>
                    Issue prescriptions for confirmed appointments. Drugs
                    suggested via RxNorm.
                  </p>
                </div>
                <PrescriptionManager />
              </>
            )}

            {activeTab === "revenue" &&
              (() => {
                const totalRevenue = revenueData.reduce(
                  (s, r) => s + (r.revenue || 0),
                  0,
                );
                const totalTx = revenueData.reduce(
                  (s, r) => s + (r.count || 0),
                  0,
                );
                const avgTx = totalTx > 0 ? totalRevenue / totalTx : 0;
                const maxRev =
                  revenueData.length > 0
                    ? Math.max(...revenueData.map((r) => r.revenue || 0))
                    : 1;

                const fmtLabel = (periodStart) => {
                  if (!periodStart) return "";
                  const d = new Date(periodStart);
                  if (revenuePeriod === "daily")
                    return d.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    });
                  if (revenuePeriod === "weekly") {
                    const weekNum = Math.ceil(d.getDate() / 7);
                    return `W${weekNum} ${d.toLocaleDateString("en-GB", { month: "short" })}`;
                  }
                  return d.toLocaleDateString("en-GB", {
                    month: "short",
                    year: "2-digit",
                  });
                };

                const displayed = [...revenueData].reverse();

                return (
                  <>
                    <div className="dd-page-head">
                      <h2>Revenue</h2>
                      <p>
                        Your earnings from completed payments, grouped by
                        period.
                      </p>
                    </div>

                    {/* Period selector */}
                    <div className="rev-period-tabs">
                      {["daily", "weekly", "monthly"].map((p) => (
                        <button
                          key={p}
                          className={`rev-period-btn${revenuePeriod === p ? " active" : ""}`}
                          onClick={() => setRevenuePeriod(p)}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>

                    {revenueLoading ? (
                      <div className="rev-no-data">Loading revenue data…</div>
                    ) : revenueError ? (
                      <div className="rev-no-data" style={{ color: "#c0392b" }}>
                        {revenueError}
                      </div>
                    ) : (
                      <>
                        {/* Summary cards */}
                        <div className="rev-summary-row">
                          <div className="rev-summary-card">
                            <div className="rev-summary-label">
                              Total Revenue
                            </div>
                            <div className="rev-summary-value">
                              LKR {fmtRevenue(totalRevenue)}
                            </div>
                            <div className="rev-summary-sub">
                              All successful payments
                            </div>
                          </div>
                          <div className="rev-summary-card">
                            <div className="rev-summary-label">
                              Transactions
                            </div>
                            <div className="rev-summary-value">{totalTx}</div>
                            <div className="rev-summary-sub">
                              Completed payments
                            </div>
                          </div>
                          <div className="rev-summary-card">
                            <div className="rev-summary-label">
                              Avg per Transaction
                            </div>
                            <div className="rev-summary-value">
                              LKR {fmtRevenue(avgTx)}
                            </div>
                            <div className="rev-summary-sub">
                              Average payment value
                            </div>
                          </div>
                        </div>

                        {/* Bar chart */}
                        <div className="rev-chart-wrap">
                          <div className="rev-chart-title">
                            Revenue by{" "}
                            {revenuePeriod.charAt(0).toUpperCase() +
                              revenuePeriod.slice(1)}{" "}
                            Period
                          </div>
                          {displayed.length === 0 ? (
                            <div className="rev-no-data">
                              No completed payments found for this period.
                            </div>
                          ) : (
                            <div className="rev-bars">
                              {displayed.map((row, i) => {
                                const pct =
                                  maxRev > 0
                                    ? ((row.revenue || 0) / maxRev) * 100
                                    : 0;
                                return (
                                  <div key={i} className="rev-bar-col">
                                    <div className="rev-bar-val">
                                      LKR {fmtRevenue(row.revenue || 0)}
                                    </div>
                                    <div
                                      className="rev-bar"
                                      style={{ height: `${Math.max(pct, 4)}%` }}
                                      title={`LKR ${(row.revenue || 0).toFixed(2)} (${row.count} tx)`}
                                    />
                                    <div className="rev-bar-label">
                                      {fmtLabel(row.period_start)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Detail table */}
                        {displayed.length > 0 && (
                          <div className="rev-table-wrap">
                            <table className="rev-table">
                              <thead>
                                <tr>
                                  <th className="rev-th">Period</th>
                                  <th className="rev-th">Transactions</th>
                                  <th className="rev-th">Revenue</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayed.map((row, i) => (
                                  <tr key={i} className="rev-tr">
                                    <td className="rev-td">
                                      {fmtLabel(row.period_start)}
                                    </td>
                                    <td className="rev-td">{row.count}</td>
                                    <td className="rev-td amount">
                                      LKR {fmtRevenue(row.revenue || 0)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                  </>
                );
              })()}

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

            {/* ══════════ APPOINTMENTS TAB ══════════════════════════════ */}
            {activeTab === "appointments" && (
              <>
                <style>{`
                  .da-toolbar { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:20px; padding:4px 0; }
                  .da-fbtn { padding:6px 16px; border-radius:20px; border:1.5px solid #e4eaf0; background:#f8fafc; color:#3a5068; font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; white-space:nowrap; }
                  .da-fbtn.active { border-color:#1a6fa0; background:#eff6ff; color:#1a6fa0; }
                  .da-card { background:#fff; border:1.5px solid #e4eaf0; border-radius:12px; margin-bottom:12px; overflow:hidden; }
                  .da-card-header { display:flex; align-items:flex-start; gap:14px; padding:14px 18px; cursor:pointer; flex-wrap:wrap; }
                  .da-avatar { width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg,#1a6fa0,#3b9ed9); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:16px; flex-shrink:0; margin-top:2px; }
                  .da-card-info { flex:1; min-width:160px; }
                  .da-patient-name { font-size:15px; font-weight:700; color:#1a3a52; }
                  .da-appt-time { font-size:12px; color:#7a8fa6; margin-top:2px; }
                  .da-reason { font-size:12px; color:#5a7a95; margin-top:3px; font-style:italic; }
                  .da-badge { font-size:11px; font-weight:700; padding:3px 9px; border-radius:10px; white-space:nowrap; }
                  .da-badge.pending { background:#fef9c3; color:#a16207; border:1px solid #fde047; }
                  .da-badge.confirmed { background:#dcfce7; color:#15803d; border:1px solid #86efac; }
                  .da-badge.completed { background:#eff6ff; color:#1d4ed8; border:1px solid #93c5fd; }
                  .da-badge.ended { background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; }
                  .da-badge.overdue { background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; }
                  .da-card.overdue { opacity:.6; }
                  .da-actions { display:flex; gap:6px; align-items:center; flex-shrink:0; flex-wrap:wrap; justify-content:flex-end; }
                  .da-approve-btn { padding:6px 14px; border-radius:8px; border:none; background:#15803d; color:#fff; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; }
                  .da-approve-btn:disabled { opacity:.5; cursor:default; }
                  .da-join-btn { padding:6px 14px; border-radius:8px; border:none; background:linear-gradient(135deg,#16a34a,#22c55e); color:#fff; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; white-space:nowrap; }
                  .da-join-btn:disabled { opacity:.6; cursor:default; }
                  .da-end-btn { padding:6px 14px; border-radius:8px; border:1.5px solid #dc2626; background:#fff; color:#dc2626; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; }
                  .da-end-btn:disabled { opacity:.5; cursor:default; }
                  .da-tele-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:8px; background:#f0fdf4; border:1px solid #86efac; color:#15803d; font-size:10.5px; font-weight:700; margin-left:6px; }
                  .da-chat-btn { padding:6px 14px; border-radius:8px; border:1.5px solid #1a6fa0; background:#fff; color:#1a6fa0; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; }
                  .da-chat-panel { border-top:1.5px solid #e4eaf0; background:#f8fafc; }
                  .da-chat-messages { max-height:240px; overflow-y:auto; padding:12px 18px; display:flex; flex-direction:column; gap:8px; }
                  .da-msg { max-width:72%; padding:8px 12px; border-radius:12px; font-size:13px; line-height:1.45; }
                  .da-msg.doctor { align-self:flex-end; background:#1a6fa0; color:#fff; border-bottom-right-radius:4px; }
                  .da-msg.patient { align-self:flex-start; background:#fff; color:#1a3a52; border:1px solid #e4eaf0; border-bottom-left-radius:4px; }
                  .da-msg-meta { font-size:10px; margin-top:3px; opacity:.7; }
                  .da-chat-input { display:flex; gap:8px; padding:10px 14px; border-top:1px solid #e4eaf0; }
                  .da-chat-input textarea { flex:1; border:1.5px solid #e4eaf0; border-radius:8px; padding:8px 10px; font-size:13px; font-family:'DM Sans',sans-serif; resize:none; outline:none; background:#fff; color:#1a3a52; color-scheme:light; }
                  .da-send-btn { padding:8px 18px; border-radius:8px; border:none; background:#1a6fa0; color:#fff; font-size:13px; font-weight:700; cursor:pointer; }
                  .da-send-btn:disabled { opacity:.5; cursor:default; }
                  .da-empty { text-align:center; padding:40px; color:#7a8fa6; font-size:14px; }
                  .da-search-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:16px; }
                  .da-search-wrap { position:relative; flex:1; min-width:180px; max-width:340px; }
                  .da-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); font-size:13px; color:#b0bec8; pointer-events:none; }
                  .da-search-input { width:100%; box-sizing:border-box; padding:8px 30px 8px 32px; border:1.5px solid #e4eaf0; border-radius:8px; font-size:13px; font-family:'DM Sans',sans-serif; background:#fff; color:#1a3a52; outline:none; transition:border-color 0.2s; }
                  .da-search-input:focus { border-color:#1a6fa0; }
                  .da-search-clear { position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:#b0bec8; cursor:pointer; font-size:14px; line-height:1; padding:0; }
                  .da-search-clear:hover { color:#1a6fa0; }
                  .da-toolbar-clear { padding:7px 13px; border-radius:8px; border:1.5px solid #e4eaf0; background:#f8fafc; color:#7a8fa6; font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap; transition:all .15s; font-family:'DM Sans',sans-serif; }
                  .da-toolbar-clear:hover { background:#fee2e2; border-color:#fca5a5; color:#dc2626; }
                  .da-section-label { font-size:11px; font-weight:700; color:#7a8fa6; text-transform:uppercase; letter-spacing:.5px; margin:8px 0 12px; }
                  .da-records-btn { padding:6px 14px; border-radius:8px; border:1.5px solid #7c3aed; background:#fff; color:#7c3aed; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; }
                  .da-records-panel { border-top:1.5px solid #e4eaf0; background:#faf5ff; padding:16px 18px; }
                  .da-records-panel-title { font-family:'Sora',sans-serif; font-size:13px; font-weight:700; color:#4c1d95; margin-bottom:14px; display:flex; align-items:center; gap:7px; }
                  .da-rec-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:10px; }
                  .da-rec-card { background:#fff; border:1.5px solid #e9d5ff; border-radius:10px; overflow:hidden; }
                  .da-rec-banner { height:4px; }
                  .da-rec-body { padding:10px 12px 8px; }
                  .da-rec-cat { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:20px; border:1px solid; font-size:10px; font-weight:700; margin-bottom:6px; }
                  .da-rec-title { font-size:13px; font-weight:700; color:#1a3a52; margin-bottom:4px; line-height:1.3; }
                  .da-rec-desc { font-size:11.5px; color:#56687a; margin-bottom:5px; line-height:1.4; }
                  .da-rec-meta { font-size:11px; color:#94a3b8; }
                  .da-rec-footer { padding:8px 12px; border-top:1px solid #f1f5f9; }
                  .da-rec-view { display:flex; align-items:center; justify-content:center; gap:4px; padding:5px 0; border-radius:6px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-size:11.5px; font-weight:700; text-decoration:none; transition:all .15s; }
                  .da-rec-view:hover { background:#dbeafe; }
                  .da-rec-empty { text-align:center; padding:20px; color:#7a8fa6; font-size:13px; }
                  @media (max-width: 640px) {
                    .da-card-header { gap:10px; padding:12px 14px; }
                    .da-card-info { min-width: calc(100% - 52px); }
                    .da-actions { width:100%; justify-content:flex-start; border-top:1px solid #f0f4f8; padding-top:10px; margin-top:4px; }
                    .da-fbtn { padding:5px 10px; font-size:12px; }
                    .da-approve-btn, .da-join-btn, .da-end-btn, .da-chat-btn, .da-records-btn { padding:5px 10px; font-size:11.5px; }
                  }
                `}</style>
                <div className="dd-page-head">
                  <h2>My Appointments</h2>
                  <p>
                    Review, approve, and chat with patients about their
                    bookings.
                  </p>
                </div>

                {/* Filter + Search toolbar */}
                <div className="da-toolbar">
                  {[
                    { key: "today", label: "Today" },
                    { key: "upcoming", label: "Upcoming" },
                    { key: "", label: "All" },
                    { key: "ended", label: "\u23F9 Ended" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      className={`da-fbtn${apptFilter === key ? " active" : ""}`}
                      onClick={() => {
                        setApptFilter(key);
                        setApptSearch("");
                        setApptTypeFilter("all");
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="da-search-row">
                  <div className="da-search-wrap">
                    <span className="da-search-icon">&#128269;</span>
                    <input
                      className="da-search-input"
                      type="text"
                      placeholder="Search by patient name or reason\u2026"
                      value={apptSearch}
                      onChange={(e) => setApptSearch(e.target.value)}
                    />
                    {apptSearch && (
                      <button
                        className="da-search-clear"
                        onClick={() => setApptSearch("")}
                      >
                        &#x2715;
                      </button>
                    )}
                  </div>
                  {["all", "telemedicine", "in_person"].map((t) => {
                    const labels = {
                      all: "All Types",
                      telemedicine: "\uD83D\uDCF9 Telemedicine",
                      in_person: "\uD83C\uDFE5 In-Person",
                    };
                    return (
                      <button
                        key={t}
                        className={`da-fbtn${apptTypeFilter === t ? " active" : ""}`}
                        onClick={() => setApptTypeFilter(t)}
                      >
                        {labels[t]}
                      </button>
                    );
                  })}
                  {(apptSearch || apptTypeFilter !== "all") && (
                    <button
                      className="da-toolbar-clear"
                      onClick={() => {
                        setApptSearch("");
                        setApptTypeFilter("all");
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {(() => {
                  const baseList =
                    apptFilter === "ended"
                      ? appointments.filter((a) => endedSessions.has(a.id))
                      : appointments;
                  const q = apptSearch.trim().toLowerCase();
                  const filteredAppts = baseList.filter((a) => {
                    const matchSearch =
                      !q ||
                      (a.patient_name &&
                        a.patient_name.toLowerCase().includes(q)) ||
                      (a.reason && a.reason.toLowerCase().includes(q));
                    const matchType =
                      apptTypeFilter === "all"
                        ? true
                        : apptTypeFilter === "telemedicine"
                          ? !!a.is_telemedicine
                          : !a.is_telemedicine;
                    return matchSearch && matchType;
                  });
                  if (apptLoading)
                    return <div className="da-empty">Loading…</div>;
                  if (apptError)
                    return (
                      <div
                        style={{
                          padding: "12px 16px",
                          background: "#fee2e2",
                          color: "#991b1b",
                          borderRadius: 8,
                          marginBottom: 12,
                        }}
                      >
                        {apptError}
                      </div>
                    );
                  if (filteredAppts.length === 0)
                    return (
                      <div className="da-empty">
                        {q || apptTypeFilter !== "all"
                          ? "No appointments match your search or filter."
                          : "No appointments found."}
                      </div>
                    );
                  return filteredAppts.map((appt) => {
                    const initials = appt.patient_name
                      ? appt.patient_name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "P";
                    const dateStr = new Date(
                      appt.appointment_date,
                    ).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });
                    const fmt12 = (t) => {
                      if (!t) return "";
                      const [h, m] = t.split(":").map(Number);
                      const ampm = h < 12 ? "AM" : "PM";
                      return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
                    };
                    const isChatOpen = chatApptId === appt.id;
                    return (
                      <div
                        className={`da-card${isAppointmentOverdue(appt) ? " overdue" : ""}`}
                        key={appt.id}
                      >
                        <div
                          className="da-card-header"
                          onClick={() =>
                            isChatOpen ? closeChat() : openChat(appt.id)
                          }
                        >
                          <div className="da-avatar">{initials}</div>
                          <div className="da-card-info">
                            <div className="da-patient-name">
                              {appt.patient_name || "Patient"}
                              {appt.is_telemedicine && (
                                <span className="da-tele-badge">
                                  📹 Telemedicine
                                </span>
                              )}
                            </div>
                            <div className="da-appt-time">
                              {dateStr} &nbsp;·&nbsp; {fmt12(appt.start_time)} –{" "}
                              {fmt12(appt.end_time)}
                            </div>
                            {appt.reason && (
                              <div className="da-reason">"{appt.reason}"</div>
                            )}
                          </div>
                          <div
                            className="da-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span
                              className={`da-badge ${isAppointmentOverdue(appt) ? "overdue" : endedSessions.has(appt.id) ? "ended" : appt.status}`}
                            >
                              {isAppointmentOverdue(appt)
                                ? "⏰ Overdue"
                                : endedSessions.has(appt.id)
                                  ? "⏹ Ended"
                                  : appt.status === "pending"
                                    ? "⏳ Pending"
                                    : appt.status === "confirmed"
                                      ? "✅ Confirmed"
                                      : "✔ Completed"}
                            </span>
                            {appt.status === "pending" && (
                              <button
                                className="da-approve-btn"
                                disabled={approvingId === appt.id}
                                onClick={() => handleApprove(appt.id)}
                              >
                                {approvingId === appt.id ? "…" : "Approve"}
                              </button>
                            )}
                            {!!appt.is_telemedicine &&
                              appt.status === "confirmed" &&
                              !endedSessions.has(appt.id) && (
                                <button
                                  className="da-join-btn"
                                  disabled={fetchingSession === appt.id}
                                  onClick={() => handleJoinMeeting(appt)}
                                >
                                  {fetchingSession === appt.id
                                    ? "…"
                                    : "📹 Join"}
                                </button>
                              )}
                            {appt.status === "confirmed" &&
                              !endedSessions.has(appt.id) && (
                                <button
                                  className="da-end-btn"
                                  disabled={endingSession === appt.id}
                                  onClick={() => handleEndConsultation(appt)}
                                >
                                  {endingSession === appt.id ? "…" : "⏹ End"}
                                </button>
                              )}
                            <button
                              className="da-records-btn"
                              onClick={() =>
                                openRecords(appt.id, appt.patient_id)
                              }
                            >
                              {recordsApptId === appt.id
                                ? "🗂 Close"
                                : "🗂 Records"}
                            </button>
                            {!endedSessions.has(appt.id) && (
                              <button
                                className="da-chat-btn"
                                onClick={() =>
                                  isChatOpen ? closeChat() : openChat(appt.id)
                                }
                              >
                                {isChatOpen ? "Close" : "💬 Chat"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Inline chat panel */}
                        {isChatOpen && (
                          <div className="da-chat-panel">
                            <div className="da-chat-messages">
                              {chatMessages.length === 0 && (
                                <div
                                  style={{
                                    textAlign: "center",
                                    color: "#7a8fa6",
                                    fontSize: 13,
                                    padding: "12px 0",
                                  }}
                                >
                                  No messages yet. Start the conversation.
                                </div>
                              )}
                              {chatMessages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`da-msg ${msg.sender_role}`}
                                >
                                  {msg.message}
                                  <div className="da-msg-meta">
                                    {msg.sender_role === "doctor"
                                      ? "You"
                                      : appt.patient_name || "Patient"}
                                    &nbsp;·&nbsp;
                                    {new Date(msg.sent_at).toLocaleTimeString(
                                      "en-US",
                                      { hour: "2-digit", minute: "2-digit" },
                                    )}
                                  </div>
                                </div>
                              ))}
                              <div ref={chatEndRef} />
                            </div>
                            <div className="da-chat-input">
                              <textarea
                                rows={2}
                                placeholder="Type a message…"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                  }
                                }}
                              />
                              <button
                                className="da-send-btn"
                                disabled={chatSending || !chatInput.trim()}
                                onClick={handleSendMessage}
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        )}
                        {recordsApptId === appt.id && (
                          <div className="da-records-panel">
                            <div className="da-records-panel-title">
                              🗂 {appt.patient_name || "Patient"}&apos;s Medical
                              Records
                            </div>
                            {recordsLoading ? (
                              <div className="da-rec-empty">
                                Loading records…
                              </div>
                            ) : patientRecords.length === 0 ? (
                              <div className="da-rec-empty">
                                No medical records uploaded by this patient yet.
                              </div>
                            ) : (
                              <div className="da-rec-grid">
                                {patientRecords.map((rec) => {
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
                                  const cat =
                                    CATEGORIES.find(
                                      (c) => c.value === rec.category,
                                    ) || CATEGORIES[4];
                                  return (
                                    <div className="da-rec-card" key={rec.id}>
                                      <div
                                        className="da-rec-banner"
                                        style={{ background: cat.border }}
                                      />
                                      <div className="da-rec-body">
                                        <div
                                          className="da-rec-cat"
                                          style={{
                                            background: cat.color,
                                            color: cat.text,
                                            borderColor: cat.border,
                                          }}
                                        >
                                          {cat.icon} {cat.label}
                                        </div>
                                        <div className="da-rec-title">
                                          {rec.title}
                                        </div>
                                        {rec.description && (
                                          <div className="da-rec-desc">
                                            {rec.description}
                                          </div>
                                        )}
                                        <div className="da-rec-meta">
                                          {new Date(
                                            rec.uploaded_at,
                                          ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          })}
                                          {rec.file_size
                                            ? ` · ${(rec.file_size / 1024 / 1024).toFixed(2)} MB`
                                            : ""}
                                          {rec.file_name
                                            ? ` · ${rec.file_name}`
                                            : ""}
                                        </div>
                                      </div>
                                      <div className="da-rec-footer">
                                        <a
                                          className="da-rec-view"
                                          href={getFileUrl(rec.file_url)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          👁 View / Download
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
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
                            color: docProfile.specialization
                              ? "#1a3a52"
                              : "#7a8fa6",
                            background: "#fff",
                            boxSizing: "border-box",
                            appearance: "auto",
                          }}
                        >
                          <option value="">— Select specialization —</option>
                          <option value="General Practice">
                            General Practice
                          </option>
                          <option value="Internal Medicine">
                            Internal Medicine
                          </option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Dermatology">Dermatology</option>
                          <option value="Endocrinology">Endocrinology</option>
                          <option value="Gastroenterology">
                            Gastroenterology
                          </option>
                          <option value="Geriatrics">Geriatrics</option>
                          <option value="Hematology">Hematology</option>
                          <option value="Infectious Disease">
                            Infectious Disease
                          </option>
                          <option value="Nephrology">Nephrology</option>
                          <option value="Neurology">Neurology</option>
                          <option value="Oncology">Oncology</option>
                          <option value="Ophthalmology">Ophthalmology</option>
                          <option value="Orthopedics">Orthopedics</option>
                          <option value="Otolaryngology (ENT)">
                            Otolaryngology (ENT)
                          </option>
                          <option value="Pediatrics">Pediatrics</option>
                          <option value="Psychiatry">Psychiatry</option>
                          <option value="Pulmonology">Pulmonology</option>
                          <option value="Radiology">Radiology</option>
                          <option value="Rheumatology">Rheumatology</option>
                          <option value="Surgery (General)">
                            Surgery (General)
                          </option>
                          <option value="Surgery (Cardiothoracic)">
                            Surgery (Cardiothoracic)
                          </option>
                          <option value="Surgery (Neurosurgery)">
                            Surgery (Neurosurgery)
                          </option>
                          <option value="Surgery (Plastic)">
                            Surgery (Plastic)
                          </option>
                          <option value="Surgery (Vascular)">
                            Surgery (Vascular)
                          </option>
                          <option value="Urology">Urology</option>
                          <option value="Obstetrics & Gynecology">
                            Obstetrics &amp; Gynecology
                          </option>
                          <option value="Anesthesiology">Anesthesiology</option>
                          <option value="Emergency Medicine">
                            Emergency Medicine
                          </option>
                          <option value="Family Medicine">
                            Family Medicine
                          </option>
                          <option value="Pathology">Pathology</option>
                          <option value="Physical Medicine & Rehabilitation">
                            Physical Medicine &amp; Rehabilitation
                          </option>
                          <option value="Sports Medicine">
                            Sports Medicine
                          </option>
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

      {jitsiSession && (
        <JitsiMeeting
          roomName={jitsiSession.roomName}
          displayName={jitsiSession.displayName}
          onClose={() => setJitsiSession(null)}
        />
      )}
    </>
  );
};

export default DoctorDashboard;
