import React, { useState, useEffect, useCallback, useRef } from "react";
import * as appointmentService from "../utils/appointmentService";
import * as telemedicineService from "../utils/telemedicineService";
import { getUserData } from "../utils/authService";
import JitsiMeeting from "./JitsiMeeting";

/* ── constants ─────────────────────────────────────────────────── */

const DAYS = [
  { label: "Sunday", value: 1 },
  { label: "Monday", value: 2 },
  { label: "Tuesday", value: 3 },
  { label: "Wednesday", value: 4 },
  { label: "Thursday", value: 5 },
  { label: "Friday", value: 6 },
  { label: "Saturday", value: 0 },
];

/* ── helpers ───────────────────────────────────────────────────── */

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(date) {
  return date.toISOString().split("T")[0];
}

function formatWeekRange(monday) {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const opts = { month: "short", day: "numeric" };
  return `${monday.toLocaleDateString("en-US", opts)} – ${sunday.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

function fmt12(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── component ─────────────────────────────────────────────────── */

const BookAppointment = () => {
  const [view, setView] = useState("book"); // 'book' | 'my-bookings'

  // Doctor list
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState("");

  // Selected doctor + slot picker
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(getMonday(new Date()));
  const [slots, setSlots] = useState([]);
  const [scheduleType, setScheduleType] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  // Booking modal
  const [bookingSlot, setBookingSlot] = useState(null); // slot object
  const [bookingReason, setBookingReason] = useState("");
  const [isTelemedicine, setIsTelemedicine] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Telemedicine session
  const [jitsiSession, setJitsiSession] = useState(null); // { roomName, displayName }
  const [fetchingSession, setFetchingSession] = useState(null); // appointmentId being fetched
  const [endedSessions, setEndedSessions] = useState(new Set()); // appointment IDs whose session is ended

  // My bookings
  const [myBookings, setMyBookings] = useState([]);
  const [bookingFilter, setBookingFilter] = useState("");
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  // Chat per appointment
  const [chatApptId, setChatApptId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef(null);

  /* ── load doctors ────────────────────────────────────────────── */

  useEffect(() => {
    setDoctorsLoading(true);
    appointmentService.listDoctors().then((res) => {
      if (res.success) setDoctors(res.data || []);
      else setDoctorsError(res.error);
      setDoctorsLoading(false);
    });
  }, []);

  /* ── load slots for selected doctor ─────────────────────────── */

  const loadSlots = useCallback(async (doctor, week) => {
    setSlotsLoading(true);
    setSlotsError("");
    const weekStr = toDateStr(week);
    const res = await appointmentService.getDoctorSlots(
      doctor.doctor_id,
      weekStr,
    );
    if (res.success) {
      setSlots(res.data?.slots || []);
      setScheduleType(res.data?.scheduleType || null);
    } else {
      setSlotsError(res.error);
    }
    setSlotsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      loadSlots(selectedDoctor, currentWeek);
    }
  }, [selectedDoctor, currentWeek, loadSlots]);

  /* ── load my bookings ───────────────────────────────────────── */

  const loadMyBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError("");
    const [apptRes, teleRes] = await Promise.all([
      appointmentService.getMyBookings(),
      telemedicineService.getSessions(),
    ]);
    if (apptRes.success) setMyBookings(apptRes.data || []);
    else setBookingsError(apptRes.error);
    if (teleRes.success && Array.isArray(teleRes.data)) {
      setEndedSessions(
        new Set(
          teleRes.data
            .filter((s) => s.status === "ended")
            .map((s) => s.appointment_id),
        ),
      );
    }
    setBookingsLoading(false);
  }, []);

  useEffect(() => {
    if (view === "my-bookings") loadMyBookings();
  }, [view, loadMyBookings]);

  /* ── book slot ──────────────────────────────────────────────── */

  const handleBook = async () => {
    setBookingLoading(true);
    setBookingError("");
    const res = await appointmentService.createBooking({
      doctorId: selectedDoctor.doctor_id,
      slotId: bookingSlot.id,
      appointmentDate: bookingSlot.appointmentDate,
      startTime: bookingSlot.start_time.substring(0, 5),
      endTime: bookingSlot.end_time.substring(0, 5),
      reason: bookingReason,
      doctorName: selectedDoctor.name,
      patientName: getUserData()?.name || "",
      patientPhone: getUserData()?.phone || "",
      isTelemedicine,
    });
    if (res.success) {
      setBookingSuccess({
        doctor: selectedDoctor.name,
        date: fmtDate(bookingSlot.appointmentDate),
        time: `${fmt12(bookingSlot.start_time)} – ${fmt12(bookingSlot.end_time)}`,
        isTelemedicine,
      });
      setBookingSlot(null);
      setIsTelemedicine(false);
      // Refresh slots to reflect the booking
      loadSlots(selectedDoctor, currentWeek);
    } else {
      setBookingError(res.error);
    }
    setBookingLoading(false);
  };

  /* ── join telemedicine meeting ─────────────────────────────── */

  const handleJoinMeeting = async (appt) => {
    setFetchingSession(appt.id);
    const res = await telemedicineService.getSessionByAppointment(appt.id);
    if (res.success && res.data) {
      setJitsiSession({
        roomName: res.data.meeting_room,
        displayName: getUserData()?.name || "Patient",
      });
    } else {
      alert("Meeting room not available yet. Please try again shortly.");
    }
    setFetchingSession(null);
  };

  /* ── chat ──────────────────────────────────────────────────── */

  const openChat = async (apptId) => {
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

  /* ── cancel booking ─────────────────────────────────────────── */

  const handleCancel = async (id) => {
    setCancellingId(id);
    const res = await appointmentService.cancelBooking(id);
    if (res.success) {
      setMyBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
      );
    } else {
      setBookingsError(res.error);
    }
    setCancellingId(null);
  };

  /* ── helpers ────────────────────────────────────────────────── */

  const shiftWeek = (dir) => {
    setCurrentWeek((w) => {
      const next = new Date(w);
      next.setDate(next.getDate() + dir * 7);
      return next;
    });
  };

  const slotsForDay = (dayValue) =>
    slots
      .filter((s) => Number(s.day_of_week) === dayValue)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

  /* ═════════════════════════════════════════════════════════════ */
  /*  RENDER                                                       */
  /* ═════════════════════════════════════════════════════════════ */

  return (
    <div className="ba-root">
      <style>{`
        .ba-root { font-family: 'DM Sans', sans-serif; }

        /* ── view toggle ── */
        .ba-toggle { display:flex; gap:8px; margin-bottom:20px; }
        .ba-toggle-btn { padding:8px 20px; border-radius:20px; border:1.5px solid #e4eaf0; background:#f8fafc; color:#3a5068; font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; font-family:'DM Sans',sans-serif; }
        .ba-toggle-btn:hover { border-color:#0a3d62; color:#0a3d62; }
        .ba-toggle-btn.active { background:linear-gradient(135deg,#0a3d62,#1a6fa0); color:#fff; border-color:#0a3d62; box-shadow:0 2px 8px rgba(10,61,98,.2); }

        /* ── error / spinner ── */
        .ba-error { padding:10px 14px; background:#fee2e2; color:#991b1b; border:1px solid #fecaca; border-radius:8px; font-size:13px; margin-bottom:14px; }
        .ba-loading { display:flex; align-items:center; gap:10px; color:#7a8fa6; font-size:14px; padding:24px 0; }
        .ba-spinner { width:16px; height:16px; border:2px solid #c7dff0; border-top-color:#0a3d62; border-radius:50%; animation:ba-spin .6s linear infinite; }
        @keyframes ba-spin { to { transform:rotate(360deg); } }

        /* ── success banner ── */
        .ba-success { padding:14px 16px; background:#f0fdf4; border:1.5px solid #86efac; border-radius:10px; margin-bottom:16px; }
        .ba-success-title { font-size:14px; font-weight:700; color:#15803d; margin-bottom:4px; }
        .ba-success-body { font-size:13px; color:#166534; }

        /* ── doctor grid ── */
        .ba-doc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; }
        .ba-doc-card { background:#fff; border:1.5px solid #e4eaf0; border-radius:12px; padding:18px; cursor:pointer; transition:all .18s; }
        .ba-doc-card:hover { border-color:#1a6fa0; box-shadow:0 4px 16px rgba(10,61,98,.12); transform:translateY(-2px); }
        .ba-doc-avatar { width:48px; height:48px; background:linear-gradient(135deg,#0a3d62,#1a6fa0); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; margin-bottom:12px; }
        .ba-doc-name { font-family:'Sora',sans-serif; font-size:15px; font-weight:700; color:#0a3d62; margin-bottom:3px; }
        .ba-doc-spec { font-size:12px; color:#7a8fa6; margin-bottom:8px; }
        .ba-doc-fee { font-size:12px; font-weight:600; color:#1a6fa0; background:#eff6ff; padding:3px 10px; border-radius:6px; display:inline-block; }
        .ba-doc-empty { text-align:center; padding:40px; color:#b0bec8; font-size:14px; }

        /* ── slot picker ── */
        .ba-back { display:flex; align-items:center; gap:8px; margin-bottom:14px; cursor:pointer; color:#1a6fa0; font-size:13px; font-weight:600; background:none; border:none; padding:0; font-family:'DM Sans',sans-serif; }
        .ba-back:hover { color:#0a3d62; }
        .ba-doc-header { background:#fff; border:1.5px solid #e4eaf0; border-radius:12px; padding:16px 18px; margin-bottom:14px; display:flex; align-items:center; gap:14px; }
        .ba-doc-header-avatar { width:44px; height:44px; background:linear-gradient(135deg,#0a3d62,#1a6fa0); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .ba-doc-header-name { font-family:'Sora',sans-serif; font-size:16px; font-weight:700; color:#0a3d62; }
        .ba-doc-header-spec { font-size:12px; color:#7a8fa6; }

        /* ── week nav ── */
        .ba-week-nav { display:flex; align-items:center; gap:10px; margin-bottom:16px; background:#f0f7ff; border:1px solid #c7dff0; border-radius:10px; padding:10px 14px; }
        .ba-week-btn { padding:5px 12px; border-radius:7px; border:1px solid #b0ccdf; background:#fff; color:#0a3d62; font-size:13px; font-weight:700; cursor:pointer; transition:all .15s; font-family:'DM Sans',sans-serif; }
        .ba-week-btn:hover { background:#e3f0fb; }
        .ba-week-label { font-size:13px; font-weight:600; color:#1a3a52; flex:1; text-align:center; }
        .ba-week-today { font-size:11px; padding:3px 9px; border-radius:6px; border:1px solid #93c5fd; background:#eff6ff; color:#1d4ed8; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; }
        .ba-week-today:hover { background:#dbeafe; }

        /* ── day slots ── */
        .ba-days { display:flex; flex-direction:column; gap:10px; }
        .ba-day-card { background:#fff; border:1.5px solid #e4eaf0; border-radius:12px; overflow:hidden; }
        .ba-day-head { display:flex; align-items:center; gap:10px; padding:10px 15px; background:#f8fafc; border-bottom:1px solid #e4eaf0; }
        .ba-day-name { font-size:13px; font-weight:700; color:#1a3a52; min-width:100px; }
        .ba-day-date { font-size:11px; color:#7a8fa6; }
        .ba-day-count { font-size:11px; color:#7a8fa6; margin-left:auto; }
        .ba-slots { padding:10px 15px; display:flex; flex-wrap:wrap; gap:8px; }
        .ba-no-slots { padding:12px 15px; font-size:12.5px; color:#b0bec8; font-style:italic; }
        .ba-slot { padding:8px 14px; border-radius:8px; border:1.5px solid; font-size:12.5px; font-weight:600; cursor:pointer; transition:all .15s; font-family:'DM Sans',sans-serif; }
        .ba-slot.available { border-color:#86efac; background:#f0fdf4; color:#15803d; }
        .ba-slot.available:hover { background:#dcfce7; border-color:#4ade80; box-shadow:0 2px 8px rgba(21,128,61,.15); }
        .ba-slot.booked { border-color:#e4eaf0; background:#f8fafc; color:#b0bec8; cursor:not-allowed; }
        .ba-slot.past { border-color:#e4eaf0; background:#f1f5f9; color:#b0bec8; cursor:not-allowed; opacity:.6; }
        .ba-slot.past .ba-slot-badge { color:#94a3b8; }
        .ba-slot-time { display:block; }
        .ba-slot-badge { font-size:10px; font-weight:700; margin-top:2px; display:block; }
        .ba-slot.available .ba-slot-badge { color:#15803d; }
        .ba-slot.booked .ba-slot-badge { color:#b0bec8; }

        /* ── booking modal ── */
        .ba-overlay { position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:200; display:flex; align-items:center; justify-content:center; padding:16px; }
        .ba-modal { background:#fff; border-radius:14px; padding:28px; width:100%; max-width:420px; box-shadow:0 16px 48px rgba(0,0,0,.18); }
        .ba-modal-title { font-family:'Sora',sans-serif; font-size:17px; font-weight:700; color:#0a3d62; margin-bottom:6px; }
        .ba-modal-sub { font-size:13px; color:#7a8fa6; margin-bottom:18px; }
        .ba-booking-info { background:#f0f7ff; border:1px solid #c7dff0; border-radius:8px; padding:12px 14px; margin-bottom:16px; }
        .ba-booking-info-row { display:flex; align-items:center; gap:8px; font-size:13px; color:#1a3a52; margin-bottom:6px; }
        .ba-booking-info-row:last-child { margin-bottom:0; }
        .ba-booking-info-label { font-size:11px; font-weight:600; color:#7a8fa6; text-transform:uppercase; letter-spacing:.4px; min-width:52px; }
        .ba-modal-field { margin-bottom:14px; }
        .ba-modal-field label { display:block; font-size:12px; font-weight:600; color:#3a5068; margin-bottom:5px; text-transform:uppercase; letter-spacing:.4px; }
        .ba-modal-field textarea { width:100%; padding:9px 12px; border:1.5px solid #e4eaf0; border-radius:8px; font-size:13px; font-family:'DM Sans',sans-serif; color:#1a3a52; resize:vertical; box-sizing:border-box; background:#fff; }
        .ba-modal-field textarea:focus { outline:none; border-color:#1a6fa0; }
        .ba-modal-err { font-size:12px; color:#dc2626; padding:7px 10px; background:#fff1f1; border-radius:6px; border:1px solid #fecaca; margin-bottom:10px; }
        .ba-modal-actions { display:flex; gap:10px; justify-content:flex-end; }
        .ba-modal-cancel { padding:9px 18px; border-radius:8px; border:1px solid #e4eaf0; background:#f8fafc; color:#3a5068; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; }
        .ba-modal-confirm { padding:9px 22px; border-radius:8px; border:none; background:linear-gradient(135deg,#0a3d62,#1a6fa0); color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700; cursor:pointer; }
        .ba-modal-confirm:disabled { opacity:.5; cursor:default; }

        /* ── my bookings ── */
        .ba-bookings-list { display:flex; flex-direction:column; gap:10px; }
        .ba-booking-card { background:#fff; border:1.5px solid #e4eaf0; border-radius:12px; padding:16px 18px; display:flex; align-items:flex-start; gap:14px; }
        .ba-booking-card.cancelled { opacity:.65; }
        .ba-booking-icon { width:40px; height:40px; border-radius:10px; background:#eff6ff; border:1px solid #93c5fd; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
        .ba-booking-icon.cancelled { background:#f9fafb; border-color:#e4eaf0; }
        .ba-booking-body { flex:1; min-width:0; }
        .ba-booking-doctor { font-size:14px; font-weight:700; color:#0a3d62; margin-bottom:3px; }
        .ba-booking-meta { font-size:12.5px; color:#7a8fa6; margin-bottom:6px; }
        .ba-booking-reason { font-size:12px; color:#3a5068; background:#f8fafc; border-radius:6px; padding:5px 8px; display:inline-block; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ba-status-badge { font-size:11px; font-weight:700; padding:3px 9px; border-radius:10px; }
        .ba-status-badge.pending { background:#fef9c3; color:#a16207; border:1px solid #fde047; }
        .ba-status-badge.confirmed { background:#dcfce7; color:#15803d; border:1px solid #86efac; }
        .ba-status-badge.cancelled { background:#f3f4f6; color:#9ca3af; border:1px solid #e5e7eb; }
        .ba-status-badge.ended { background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; }
        .ba-filter-bar { display:flex; gap:7px; flex-wrap:wrap; margin-bottom:14px; }
        .ba-filter-btn { padding:5px 14px; border-radius:20px; border:1.5px solid #e4eaf0; background:#f8fafc; color:#3a5068; font-size:12px; font-weight:600; cursor:pointer; transition:all .15s; }
        .ba-filter-btn.active { border-color:#1a6fa0; background:#eff6ff; color:#1a6fa0; }
        .ba-status-badge.completed { background:#eff6ff; color:#1d4ed8; border:1px solid #93c5fd; }
        .ba-cancel-btn { padding:5px 12px; border-radius:7px; border:1px solid #fca5a5; background:#fff1f1; color:#dc2626; font-size:11px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .15s; flex-shrink:0; }
        .ba-cancel-btn:hover { background:#fee2e2; }
        .ba-cancel-btn:disabled { opacity:.5; cursor:default; }
        .ba-bookings-empty { text-align:center; padding:36px; color:#b0bec8; }
        .ba-bookings-empty-icon { font-size:36px; margin-bottom:8px; opacity:.5; }

        /* ── telemedicine toggle ── */
        .ba-tele-toggle { display:flex; align-items:center; gap:10px; background:#f0fdf4; border:1.5px solid #86efac; border-radius:10px; padding:11px 14px; margin-bottom:14px; cursor:pointer; transition:all .15s; }
        .ba-tele-toggle:hover { border-color:#4ade80; }
        .ba-tele-toggle.off { background:#f8fafc; border-color:#e4eaf0; }
        .ba-tele-check { width:18px; height:18px; border-radius:5px; border:2px solid #4ade80; background:#15803d; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ba-tele-check.off { background:#fff; border-color:#c7d2de; }
        .ba-tele-label { font-size:13px; font-weight:600; color:#15803d; flex:1; }
        .ba-tele-label.off { color:#7a8fa6; }
        .ba-tele-sub { font-size:11px; color:#7a8fa6; }
        /* ── telemedicine badge ── */
        .ba-tele-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:8px; background:#f0fdf4; border:1px solid #86efac; color:#15803d; font-size:10.5px; font-weight:700; margin-left:6px; }
        /* ── join meeting ── */
        .ba-join-btn { padding:6px 14px; border-radius:8px; border:none; background:linear-gradient(135deg,#16a34a,#22c55e); color:#fff; font-size:12px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:5px; }
        .ba-join-btn:disabled { opacity:.6; cursor:default; }
        /* ── chat panel ── */
        .ba-chat-btn { padding:6px 14px; border-radius:8px; border:1.5px solid #1a6fa0; background:#fff; color:#1a6fa0; font-size:12px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; }
        .ba-chat-btn:hover { background:#eff6ff; }
        .ba-chat-panel { border-top:1.5px solid #e4eaf0; background:#f8fafc; border-radius:0 0 12px 12px; }
        .ba-chat-messages { max-height:220px; overflow-y:auto; padding:12px 16px; display:flex; flex-direction:column; gap:8px; }
        .ba-msg { max-width:72%; padding:8px 12px; border-radius:12px; font-size:13px; line-height:1.45; }
        .ba-msg.patient { align-self:flex-end; background:#1a6fa0; color:#fff; border-bottom-right-radius:4px; }
        .ba-msg.doctor { align-self:flex-start; background:#fff; color:#1a3a52; border:1px solid #e4eaf0; border-bottom-left-radius:4px; }
        .ba-msg-meta { font-size:10px; margin-top:3px; opacity:.7; }
        .ba-chat-input-row { display:flex; gap:8px; padding:10px 14px; border-top:1px solid #e4eaf0; }
        .ba-chat-input-row textarea { flex:1; border:1.5px solid #e4eaf0; border-radius:8px; padding:8px 10px; font-size:13px; font-family:'DM Sans',sans-serif; resize:none; outline:none; background:#fff; color:#1a3a52; color-scheme:light; }
        .ba-chat-send-btn { padding:8px 18px; border-radius:8px; border:none; background:#1a6fa0; color:#fff; font-size:13px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; }
        .ba-chat-send-btn:disabled { opacity:.5; cursor:default; }
      `}</style>

      {/* ── View toggler ── */}
      <div className="ba-toggle">
        <button
          className={`ba-toggle-btn${view === "book" ? " active" : ""}`}
          onClick={() => {
            setView("book");
            setBookingSuccess(null);
          }}
        >
          🔍 Find a Doctor
        </button>
        <button
          className={`ba-toggle-btn${view === "my-bookings" ? " active" : ""}`}
          onClick={() => setView("my-bookings")}
        >
          📋 My Appointments
        </button>
      </div>

      {/* ══════════════════════ BOOK VIEW ══════════════════════════ */}
      {view === "book" && (
        <>
          {/* Success banner */}
          {bookingSuccess && (
            <div className="ba-success">
              <div className="ba-success-title">✓ Appointment Requested!</div>
              <div className="ba-success-body">
                Dr. {bookingSuccess.doctor} on {bookingSuccess.date} at{" "}
                {bookingSuccess.time}
                {bookingSuccess.isTelemedicine && (
                  <span className="ba-tele-badge" style={{ marginLeft: 8 }}>
                    📹 Telemedicine
                  </span>
                )}
              </div>
              {bookingSuccess.isTelemedicine && (
                <div style={{ fontSize: 12, color: "#15803d", marginTop: 6 }}>
                  📌 Once approved, a video meeting room will be created. You
                  can join from My Appointments.
                </div>
              )}
            </div>
          )}

          {!selectedDoctor ? (
            /* Doctor list */
            <>
              {doctorsError && <div className="ba-error">⚠ {doctorsError}</div>}
              {doctorsLoading ? (
                <div className="ba-loading">
                  <div className="ba-spinner" /> Loading doctors…
                </div>
              ) : doctors.length === 0 ? (
                <div className="ba-doc-empty">
                  No verified doctors available at this time.
                </div>
              ) : (
                <div className="ba-doc-grid">
                  {doctors.map((doc) => (
                    <div
                      key={doc.doctor_id}
                      className="ba-doc-card"
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setBookingSuccess(null);
                      }}
                    >
                      <div className="ba-doc-avatar">👨‍⚕️</div>
                      <div className="ba-doc-name">Dr. {doc.name}</div>
                      <div className="ba-doc-spec">{doc.specialization}</div>
                      {doc.consultation_fee && (
                        <span className="ba-doc-fee">
                          Rs. {parseFloat(doc.consultation_fee).toFixed(2)} /
                          session
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Slot picker */
            <>
              <button
                className="ba-back"
                onClick={() => setSelectedDoctor(null)}
              >
                ← Back to Doctors
              </button>

              {/* Doctor info header */}
              <div className="ba-doc-header">
                <div className="ba-doc-header-avatar">👨‍⚕️</div>
                <div>
                  <div className="ba-doc-header-name">
                    Dr. {selectedDoctor.name}
                  </div>
                  <div className="ba-doc-header-spec">
                    {selectedDoctor.specialization}
                  </div>
                </div>
              </div>

              {/* Week navigation */}
              <div className="ba-week-nav">
                <button className="ba-week-btn" onClick={() => shiftWeek(-1)}>
                  ‹ Prev
                </button>
                <span className="ba-week-label">
                  📅 {formatWeekRange(currentWeek)}
                </span>
                <button
                  className="ba-week-today"
                  onClick={() => setCurrentWeek(getMonday(new Date()))}
                >
                  This Week
                </button>
                <button className="ba-week-btn" onClick={() => shiftWeek(1)}>
                  Next ›
                </button>
              </div>

              {slotsError && <div className="ba-error">⚠ {slotsError}</div>}

              {slotsLoading ? (
                <div className="ba-loading">
                  <div className="ba-spinner" /> Loading slots…
                </div>
              ) : (
                <div className="ba-days">
                  {DAYS.map((day) => {
                    const daySlots = slotsForDay(day.value);
                    // Compute the actual date for this day in the current week
                    const slotDate =
                      daySlots.length > 0
                        ? daySlots[0].appointmentDate
                        : (() => {
                            const d = new Date(currentWeek);
                            let offset = day.value - 1;
                            if (day.value === 0) offset = 6;
                            d.setDate(d.getDate() + offset);
                            return toDateStr(d);
                          })();

                    // Disable today and all past dates — only tomorrow onwards
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dayDate = new Date(slotDate + "T00:00:00");
                    const isPast = dayDate <= today;

                    return (
                      <div key={day.value} className="ba-day-card">
                        <div className="ba-day-head">
                          <span className="ba-day-name">{day.label}</span>
                          <span className="ba-day-date">
                            {fmtDate(slotDate)}
                          </span>
                          <span className="ba-day-count">
                            {isPast
                              ? "Unavailable"
                              : `${daySlots.filter((s) => !s.isBooked).length} available`}
                          </span>
                        </div>

                        {daySlots.length === 0 ? (
                          <div className="ba-no-slots">No slots scheduled.</div>
                        ) : (
                          <div className="ba-slots">
                            {daySlots.map((slot) => {
                              const isDisabled = slot.isBooked || isPast;
                              return (
                                <button
                                  key={slot.id}
                                  className={`ba-slot ${isPast ? "past" : slot.isBooked ? "booked" : "available"}`}
                                  onClick={() => {
                                    if (!isDisabled) {
                                      setBookingSlot(slot);
                                      setBookingReason("");
                                      setBookingError("");
                                    }
                                  }}
                                  disabled={isDisabled}
                                >
                                  <span className="ba-slot-time">
                                    {fmt12(slot.start_time)} –{" "}
                                    {fmt12(slot.end_time)}
                                  </span>
                                  <span className="ba-slot-badge">
                                    {isPast
                                      ? "Past"
                                      : slot.isBooked
                                        ? "Booked"
                                        : "Available"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ═════════════════════ MY BOOKINGS ═════════════════════════ */}
      {view === "my-bookings" && (
        <>
          {bookingsError && <div className="ba-error">⚠ {bookingsError}</div>}
          {!bookingsLoading && myBookings.length > 0 && (
            <div className="ba-filter-bar">
              {[
                { key: "", label: "All" },
                { key: "pending", label: "⏳ Pending" },
                { key: "confirmed", label: "✅ Confirmed" },
                { key: "cancelled", label: "❌ Cancelled" },
                { key: "ended", label: "⏹ Ended" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`ba-filter-btn${bookingFilter === key ? " active" : ""}`}
                  onClick={() => setBookingFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {bookingsLoading ? (
            <div className="ba-loading">
              <div className="ba-spinner" /> Loading appointments…
            </div>
          ) : myBookings.length === 0 ? (
            <div className="ba-bookings-empty">
              <div className="ba-bookings-empty-icon">📅</div>
              <p>No appointments yet. Find a doctor and book a slot.</p>
            </div>
          ) : (
            <div className="ba-bookings-list">
              {(() => {
                const fb =
                  bookingFilter === "ended"
                    ? myBookings.filter((b) => endedSessions.has(b.id))
                    : bookingFilter
                      ? myBookings.filter((b) => b.status === bookingFilter)
                      : myBookings;
                if (fb.length === 0)
                  return (
                    <div className="ba-bookings-empty">
                      <div className="ba-bookings-empty-icon">🔍</div>
                      <p>No appointments match this filter.</p>
                    </div>
                  );
                return fb.map((b) => (
                  <React.Fragment key={b.id}>
                    <div
                      className={`ba-booking-card${b.status === "cancelled" ? " cancelled" : ""}`}
                    >
                      <div
                        className={`ba-booking-icon${b.status === "cancelled" ? " cancelled" : ""}`}
                      >
                        {b.status === "confirmed"
                          ? "📅"
                          : b.status === "completed"
                            ? "✅"
                            : "❌"}
                      </div>
                      <div className="ba-booking-body">
                        <div className="ba-booking-doctor">
                          Dr. {b.doctor_name || "Doctor"}
                          <span
                            className={`ba-status-badge ${endedSessions.has(b.id) ? "ended" : b.status}`}
                            style={{ marginLeft: 8 }}
                          >
                            {endedSessions.has(b.id)
                              ? "⏹ Ended"
                              : b.status === "pending"
                                ? "⏳ Awaiting Approval"
                                : b.status === "confirmed"
                                  ? "✅ Confirmed"
                                  : b.status === "cancelled"
                                    ? "❌ Cancelled"
                                    : b.status === "completed"
                                      ? "✔ Completed"
                                      : b.status.charAt(0).toUpperCase() +
                                        b.status.slice(1)}
                          </span>
                          {b.is_telemedicine && (
                            <span className="ba-tele-badge">
                              📹 Telemedicine
                            </span>
                          )}
                        </div>
                        <div className="ba-booking-meta">
                          {fmtDate(
                            b.appointment_date?.split("T")[0] ||
                              b.appointment_date,
                          )}{" "}
                          &nbsp;·&nbsp; {fmt12(b.start_time)} –{" "}
                          {fmt12(b.end_time)}
                        </div>
                        {b.reason && (
                          <span className="ba-booking-reason" title={b.reason}>
                            {b.reason}
                          </span>
                        )}
                      </div>{" "}
                      {!!b.is_telemedicine &&
                        b.status === "confirmed" &&
                        !endedSessions.has(b.id) && (
                          <button
                            className="ba-join-btn"
                            onClick={() => handleJoinMeeting(b)}
                            disabled={fetchingSession === b.id}
                          >
                            {fetchingSession === b.id ? "\u2026" : "📹 Join"}
                          </button>
                        )}{" "}
                      {b.status === "pending" && (
                        <button
                          className="ba-cancel-btn"
                          onClick={() => handleCancel(b.id)}
                          disabled={cancellingId === b.id}
                        >
                          {cancellingId === b.id ? "…" : "Cancel"}
                        </button>
                      )}
                      {(b.status === "confirmed" ||
                        b.status === "pending" ||
                        b.status === "completed") &&
                        !endedSessions.has(b.id) && (
                          <button
                            className="ba-chat-btn"
                            onClick={() =>
                              chatApptId === b.id ? closeChat() : openChat(b.id)
                            }
                          >
                            {chatApptId === b.id ? "Close" : "💬 Chat"}
                          </button>
                        )}
                    </div>

                    {/* Inline chat panel — sibling of the card row */}
                    {chatApptId === b.id && (
                      <div className="ba-chat-panel">
                        <div className="ba-chat-messages">
                          {chatMessages.length === 0 && (
                            <div
                              style={{
                                textAlign: "center",
                                color: "#7a8fa6",
                                fontSize: 13,
                                padding: "12px 0",
                              }}
                            >
                              No messages yet. Send a message to your doctor.
                            </div>
                          )}
                          {chatMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`ba-msg ${msg.sender_role}`}
                            >
                              {msg.message}
                              <div className="ba-msg-meta">
                                {msg.sender_role === "patient"
                                  ? "You"
                                  : `Dr. ${b.doctor_name || "Doctor"}`}
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
                        <div className="ba-chat-input-row">
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
                            className="ba-chat-send-btn"
                            disabled={chatSending || !chatInput.trim()}
                            onClick={handleSendMessage}
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ));
              })()}
            </div>
          )}
        </>
      )}

      {/* ══════════════════ BOOKING MODAL ══════════════════════════ */}
      {/* ══════════════════ JITSI MEETING ════════════════════════ */}
      {jitsiSession && (
        <JitsiMeeting
          roomName={jitsiSession.roomName}
          displayName={jitsiSession.displayName}
          onClose={() => setJitsiSession(null)}
        />
      )}

      {bookingSlot && (
        <div
          className="ba-overlay"
          onClick={() => {
            setBookingSlot(null);
            setIsTelemedicine(false);
          }}
        >
          <div className="ba-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ba-modal-title">Confirm Appointment</div>
            <div className="ba-modal-sub">
              Review the details below before confirming.
            </div>
            <div className="ba-booking-info">
              <div className="ba-booking-info-row">
                <span className="ba-booking-info-label">Doctor</span>
                Dr. {selectedDoctor.name}
              </div>
              <div className="ba-booking-info-row">
                <span className="ba-booking-info-label">Date</span>
                {fmtDate(bookingSlot.appointmentDate)}
              </div>
              <div className="ba-booking-info-row">
                <span className="ba-booking-info-label">Time</span>
                {fmt12(bookingSlot.start_time)} – {fmt12(bookingSlot.end_time)}
              </div>
              {selectedDoctor.consultation_fee && (
                <div className="ba-booking-info-row">
                  <span className="ba-booking-info-label">Fee</span>Rs.{" "}
                  {parseFloat(selectedDoctor.consultation_fee).toFixed(2)}
                </div>
              )}
            </div>{" "}
            {/* Telemedicine toggle */}
            <div
              className={`ba-tele-toggle${isTelemedicine ? "" : " off"}`}
              onClick={() => setIsTelemedicine((v) => !v)}
            >
              <div className={`ba-tele-check${isTelemedicine ? "" : " off"}`}>
                {isTelemedicine && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div className={`ba-tele-label${isTelemedicine ? "" : " off"}`}>
                  📹{" "}
                  {isTelemedicine
                    ? "Video consultation (Telemedicine)"
                    : "In-person appointment"}
                </div>
                <div className="ba-tele-sub">
                  {isTelemedicine
                    ? "You will receive a Jitsi video meeting link once approved."
                    : "Switch to telemedicine for a video call instead."}
                </div>
              </div>
            </div>
            <div className="ba-modal-field">
              <label>Reason for Visit (optional)</label>
              <textarea
                rows={3}
                placeholder="e.g. Routine check-up, follow-up, symptoms…"
                value={bookingReason}
                onChange={(e) => setBookingReason(e.target.value)}
              />
            </div>
            {bookingError && (
              <div className="ba-modal-err">⚠ {bookingError}</div>
            )}
            <div className="ba-modal-actions">
              <button
                className="ba-modal-cancel"
                onClick={() => {
                  setBookingSlot(null);
                  setIsTelemedicine(false);
                }}
              >
                Cancel
              </button>
              <button
                className="ba-modal-confirm"
                onClick={handleBook}
                disabled={bookingLoading}
              >
                {bookingLoading ? "Booking…" : "Confirm Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
