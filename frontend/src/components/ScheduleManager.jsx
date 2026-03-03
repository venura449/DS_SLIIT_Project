import { useState, useEffect, useCallback } from "react";
import * as scheduleService from "../utils/scheduleService";

/* ── constants ─────────────────────────────────────────────────── */

const DAYS = [
  { label: "Sunday", short: "Mon", value: 1 },
  { label: "Monday", short: "Tue", value: 2 },
  { label: "Tuesday", short: "Wed", value: 3 },
  { label: "Wednesday", short: "Thu", value: 4 },
  { label: "Thursday", short: "Fri", value: 5 },
  { label: "Friday", short: "Sat", value: 6 },
  { label: "Saturday", short: "Sun", value: 0 },
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

/* ── component ─────────────────────────────────────────────────── */

const ScheduleManager = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scheduleType, setScheduleType] = useState("recurring");
  const [slots, setSlots] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(getMonday(new Date()));
  const [typeChanging, setTypeChanging] = useState(false);

  // Add-slot modal
  const [addModal, setAddModal] = useState(null); // { dayOfWeek }
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("10:00");
  const [slotSaving, setSlotSaving] = useState(false);
  const [slotError, setSlotError] = useState("");

  // Per-slot action state
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Reset-week confirmation
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  /* ── load schedule ─────────────────────────────────────────── */

  const loadSchedule = useCallback(
    async (week) => {
      setLoading(true);
      setError("");
      const weekStr =
        scheduleType === "reset" ? toDateStr(week || currentWeek) : undefined;
      const res = await scheduleService.getSchedule(weekStr);
      if (res.success) {
        if (res.data) {
          setScheduleType(res.data.schedule_type);
          setSlots(res.data.slots || []);
        } else {
          setSlots([]);
        }
      } else {
        setError(res.error);
      }
      setLoading(false);
    },
    [scheduleType, currentWeek],
  );

  useEffect(() => {
    loadSchedule(currentWeek);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek]);

  /* ── change schedule type ──────────────────────────────────── */

  const handleTypeChange = async (newType) => {
    if (newType === scheduleType) return;
    setTypeChanging(true);
    setError("");
    const res = await scheduleService.setScheduleType(newType);
    if (res.success) {
      setScheduleType(newType);
      setSlots([]);
    } else {
      setError(res.error);
    }
    setTypeChanging(false);
  };

  /* ── add slot ──────────────────────────────────────────────── */

  const openAddModal = (dayOfWeek) => {
    setAddModal({ dayOfWeek });
    setSlotStart("09:00");
    setSlotEnd("10:00");
    setSlotError("");
  };

  const handleAddSlot = async () => {
    if (slotStart >= slotEnd) {
      setSlotError("End time must be after start time.");
      return;
    }
    setSlotSaving(true);
    setSlotError("");
    const res = await scheduleService.addSlot({
      dayOfWeek: addModal.dayOfWeek,
      startTime: slotStart,
      endTime: slotEnd,
      weekStart: scheduleType === "reset" ? toDateStr(currentWeek) : undefined,
    });
    if (res.success) {
      setSlots((prev) => [...prev, res.data]);
      setAddModal(null);
    } else {
      setSlotError(res.error);
    }
    setSlotSaving(false);
  };

  /* ── toggle availability ───────────────────────────────────── */

  const handleToggle = async (slot) => {
    setTogglingId(slot.id);
    const res = await scheduleService.toggleSlotAvailability(
      slot.id,
      !slot.is_available,
    );
    if (res.success) {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slot.id ? { ...s, is_available: res.data.is_available } : s,
        ),
      );
    } else {
      setError(res.error);
    }
    setTogglingId(null);
  };

  /* ── toggle all slots in a day ─────────────────────────────── */

  const handleToggleDay = async (dayOfWeek, makeAvailable) => {
    const daySlots = slots.filter((s) => s.day_of_week === dayOfWeek);
    for (const slot of daySlots) {
      if (slot.is_available !== makeAvailable) {
        await scheduleService.toggleSlotAvailability(slot.id, makeAvailable);
      }
    }
    setSlots((prev) =>
      prev.map((s) =>
        s.day_of_week === dayOfWeek ? { ...s, is_available: makeAvailable } : s,
      ),
    );
  };

  /* ── delete slot ───────────────────────────────────────────── */

  const handleDelete = async (slotId) => {
    setDeletingId(slotId);
    const res = await scheduleService.deleteSlot(slotId);
    if (res.success) {
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } else {
      setError(res.error);
    }
    setDeletingId(null);
  };

  /* ── reset week ────────────────────────────────────────────── */

  const handleResetWeek = async () => {
    setResetting(true);
    const res = await scheduleService.resetWeek(toDateStr(currentWeek));
    if (res.success) {
      setSlots([]);
    } else {
      setError(res.error);
    }
    setResetting(false);
    setConfirmReset(false);
  };

  /* ── week navigation ───────────────────────────────────────── */

  const shiftWeek = (dir) => {
    setCurrentWeek((w) => {
      const next = new Date(w);
      next.setDate(next.getDate() + dir * 7);
      return next;
    });
  };

  /* ── render ────────────────────────────────────────────────── */

  const slotsForDay = (dayValue) =>
    slots
      .filter((s) => Number(s.day_of_week) === dayValue)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const allDayUnavailable = (dayValue) => {
    const ds = slotsForDay(dayValue);
    return ds.length > 0 && ds.every((s) => !s.is_available);
  };

  return (
    <div className="sm-root">
      <style>{`
        /* ── root ── */
        .sm-root { font-family: 'DM Sans', sans-serif; }

        /* ── type selector ── */
        .sm-type-bar { display:flex; align-items:center; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
        .sm-type-label { font-size:12px; font-weight:700; color:#3a5068; text-transform:uppercase; letter-spacing:.5px; }
        .sm-type-btn { padding:7px 18px; border-radius:20px; border:1.5px solid #e4eaf0; background:#f8fafc; color:#3a5068; font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; font-family:'DM Sans',sans-serif; }
        .sm-type-btn:hover { border-color:#0a3d62; color:#0a3d62; }
        .sm-type-btn.active { background:linear-gradient(135deg,#0a3d62,#1a6fa0); color:#fff; border-color:#0a3d62; box-shadow:0 2px 8px rgba(10,61,98,.2); }
        .sm-type-btn:disabled { opacity:.5; cursor:default; }
        .sm-type-hint { font-size:11.5px; color:#7a8fa6; background:#f0f4f8; padding:4px 12px; border-radius:6px; }

        /* ── week nav ── */
        .sm-week-nav { display:flex; align-items:center; gap:10px; margin-bottom:20px; background:#f0f7ff; border:1px solid #c7dff0; border-radius:10px; padding:10px 14px; }
        .sm-week-nav-btn { padding:5px 12px; border-radius:7px; border:1px solid #b0ccdf; background:#fff; color:#0a3d62; font-size:13px; font-weight:700; cursor:pointer; transition:all .15s; }
        .sm-week-nav-btn:hover { background:#e3f0fb; }
        .sm-week-label { font-size:13px; font-weight:600; color:#1a3a52; flex:1; text-align:center; }
        .sm-week-today { font-size:11px; padding:3px 9px; border-radius:6px; border:1px solid #93c5fd; background:#eff6ff; color:#1d4ed8; font-weight:600; cursor:pointer; }
        .sm-week-today:hover { background:#dbeafe; }
        .sm-week-reset { padding:5px 12px; border-radius:7px; border:1px solid #fca5a5; background:#fff1f1; color:#dc2626; font-size:12px; font-weight:600; cursor:pointer; transition:all .15s; }
        .sm-week-reset:hover { background:#fee2e2; }

        /* ── days grid ── */
        .sm-days { display:flex; flex-direction:column; gap:10px; }
        .sm-day-card { background:#fff; border:1.5px solid #e4eaf0; border-radius:12px; overflow:hidden; transition:border-color .15s; }
        .sm-day-card.unavailable { border-color:#fecaca; background:#fff9f9; }
        .sm-day-head { display:flex; align-items:center; gap:10px; padding:10px 15px; background:#f8fafc; border-bottom:1px solid #e4eaf0; }
        .sm-day-card.unavailable .sm-day-head { background:#fff0f0; border-bottom-color:#fecaca; }
        .sm-day-name { font-size:13px; font-weight:700; color:#1a3a52; min-width:90px; }
        .sm-day-count { font-size:11px; color:#7a8fa6; }
        .sm-day-actions { margin-left:auto; display:flex; gap:6px; align-items:center; }
        .sm-day-unavail-btn { font-size:11px; padding:3px 9px; border-radius:6px; cursor:pointer; font-weight:600; font-family:'DM Sans',sans-serif; transition:all .15s; }
        .sm-day-unavail-btn.mark { border:1px solid #fca5a5; background:#fff1f1; color:#dc2626; }
        .sm-day-unavail-btn.mark:hover { background:#fee2e2; }
        .sm-day-unavail-btn.restore { border:1px solid #86efac; background:#f0fdf4; color:#15803d; }
        .sm-day-unavail-btn.restore:hover { background:#dcfce7; }
        .sm-add-slot-btn { font-size:11px; padding:3px 9px; border-radius:6px; border:1px solid #93c5fd; background:#eff6ff; color:#1d4ed8; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .15s; }
        .sm-add-slot-btn:hover { background:#dbeafe; }

        /* ── slots ── */
        .sm-slots { padding:10px 15px; display:flex; flex-direction:column; gap:7px; }
        .sm-no-slots { padding:12px 15px; font-size:12.5px; color:#b0bec8; font-style:italic; }
        .sm-slot { display:flex; align-items:center; gap:8px; padding:7px 10px; background:#f8fafc; border:1px solid #e4eaf0; border-radius:8px; transition:all .15s; }
        .sm-slot.unavailable { background:#fff5f5; border-color:#fecaca; opacity:.8; }
        .sm-slot-time { font-size:13px; font-weight:600; color:#1a3a52; min-width:130px; }
        .sm-slot.unavailable .sm-slot-time { text-decoration:line-through; color:#9ca3af; }
        .sm-slot-badge { font-size:10px; font-weight:700; padding:2px 7px; border-radius:10px; }
        .sm-slot-badge.avail { background:#dcfce7; color:#15803d; border:1px solid #86efac; }
        .sm-slot-badge.unavail { background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; }
        .sm-slot-actions { margin-left:auto; display:flex; gap:5px; }
        .sm-slot-toggle { font-size:11px; padding:3px 8px; border-radius:5px; cursor:pointer; font-weight:600; font-family:'DM Sans',sans-serif; transition:all .15s; }
        .sm-slot-toggle.avail { border:1px solid #fca5a5; background:#fff1f1; color:#dc2626; }
        .sm-slot-toggle.avail:hover { background:#fee2e2; }
        .sm-slot-toggle.unavail { border:1px solid #86efac; background:#f0fdf4; color:#15803d; }
        .sm-slot-toggle.unavail:hover { background:#dcfce7; }
        .sm-slot-toggle:disabled { opacity:.5; cursor:default; }
        .sm-slot-del { font-size:11px; padding:3px 7px; border-radius:5px; border:1px solid #e4eaf0; background:#f8fafc; color:#9ca3af; cursor:pointer; transition:all .15s; }
        .sm-slot-del:hover { border-color:#fca5a5; color:#dc2626; background:#fff1f1; }
        .sm-slot-del:disabled { opacity:.4; cursor:default; }

        /* ── add slot modal ── */
        .sm-overlay { position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:200; display:flex; align-items:center; justify-content:center; padding:16px; }
        .sm-modal { background:#fff; border-radius:14px; padding:28px; width:100%; max-width:380px; box-shadow:0 16px 48px rgba(0,0,0,.18); }
        .sm-modal-title { font-family:'Sora',sans-serif; font-size:16px; font-weight:700; color:#0a3d62; margin-bottom:18px; }
        .sm-field { margin-bottom:14px; }
        .sm-field label { display:block; font-size:12px; font-weight:600; color:#3a5068; margin-bottom:5px; text-transform:uppercase; letter-spacing:.4px; }
        .sm-field input[type="time"] { width:100%; padding:9px 12px; border:1.5px solid #e4eaf0; border-radius:8px; font-size:14px; font-family:'DM Sans',sans-serif; color:#1a3a52; background:#fff; box-sizing:border-box; color-scheme:light; }
        .sm-field input[type="time"]:focus { outline:none; border-color:#1a6fa0; background:#fff; }
        .sm-modal-err { font-size:12px; color:#dc2626; margin-bottom:10px; padding:7px 10px; background:#fff1f1; border-radius:6px; border:1px solid #fecaca; }
        .sm-modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:18px; }
        .sm-modal-cancel { padding:9px 18px; border-radius:8px; border:1px solid #e4eaf0; background:#f8fafc; color:#3a5068; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; }
        .sm-modal-save { padding:9px 22px; border-radius:8px; border:none; background:linear-gradient(135deg,#0a3d62,#1a6fa0); color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700; cursor:pointer; }
        .sm-modal-save:disabled { opacity:.5; cursor:default; }

        /* ── confirm modal ── */
        .sm-confirm-title { font-size:15px; font-weight:700; color:#dc2626; margin-bottom:8px; }
        .sm-confirm-body { font-size:13px; color:#3a5068; margin-bottom:14px; line-height:1.5; }
        .sm-confirm-yes { padding:9px 18px; border-radius:8px; border:none; background:#dc2626; color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; }
        .sm-confirm-yes:disabled { opacity:.5; cursor:default; }

        /* ── misc ── */
        .sm-error { padding:10px 14px; background:#fee2e2; color:#991b1b; border:1px solid #fecaca; border-radius:8px; font-size:13px; margin-bottom:14px; }
        .sm-loading { display:flex; align-items:center; gap:10px; color:#7a8fa6; font-size:14px; padding:24px 0; }
        .sm-spinner { width:16px; height:16px; border:2px solid #c7dff0; border-top-color:#0a3d62; border-radius:50%; animation:sm-spin .6s linear infinite; }
        @keyframes sm-spin { to { transform:rotate(360deg); } }
        .sm-empty-head { text-align:center; padding:32px 0; }
        .sm-empty-icon { font-size:36px; margin-bottom:8px; }
        .sm-empty-text { font-size:14px; color:#7a8fa6; }
      `}</style>

      {/* ── Schedule Type Selector ── */}
      <div className="sm-type-bar">
        <span className="sm-type-label">Schedule Type:</span>
        {["recurring", "reset"].map((t) => (
          <button
            key={t}
            className={`sm-type-btn${scheduleType === t ? " active" : ""}`}
            onClick={() => handleTypeChange(t)}
            disabled={typeChanging}
          >
            {t === "recurring" ? "🔁 Recurring" : "🔄 Reset Weekly"}
          </button>
        ))}
        <span className="sm-type-hint">
          {scheduleType === "recurring"
            ? "Same schedule repeats every week"
            : "You set fresh slots each week"}
        </span>
      </div>

      {/* ── Week Navigation (reset mode only) ── */}
      {scheduleType === "reset" && (
        <div className="sm-week-nav">
          <button className="sm-week-nav-btn" onClick={() => shiftWeek(-1)}>
            ‹ Prev
          </button>
          <span className="sm-week-label">
            📅 {formatWeekRange(currentWeek)}
          </span>
          <button
            className="sm-week-today"
            onClick={() => setCurrentWeek(getMonday(new Date()))}
          >
            This Week
          </button>
          <button className="sm-week-nav-btn" onClick={() => shiftWeek(1)}>
            Next ›
          </button>
          <button
            className="sm-week-reset"
            onClick={() => setConfirmReset(true)}
            disabled={slots.length === 0}
          >
            🗑 Clear Week
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {error && <div className="sm-error">⚠ {error}</div>}

      {/* ── Loading ── */}
      {loading ? (
        <div className="sm-loading">
          <div className="sm-spinner" /> Loading schedule…
        </div>
      ) : (
        <div className="sm-days">
          {DAYS.map((day) => {
            const daySlots = slotsForDay(day.value);
            const allUnavail = allDayUnavailable(day.value);

            return (
              <div
                key={day.value}
                className={`sm-day-card${allUnavail ? " unavailable" : ""}`}
              >
                {/* Day header */}
                <div className="sm-day-head">
                  <span className="sm-day-name">{day.label}</span>
                  <span className="sm-day-count">
                    {daySlots.length === 0
                      ? "No slots"
                      : `${daySlots.filter((s) => s.is_available).length}/${daySlots.length} available`}
                  </span>
                  <div className="sm-day-actions">
                    {daySlots.length > 0 && (
                      <button
                        className={`sm-day-unavail-btn ${allUnavail ? "restore" : "mark"}`}
                        onClick={() => handleToggleDay(day.value, allUnavail)}
                      >
                        {allUnavail ? "✓ Mark Available" : "✕ Day Off"}
                      </button>
                    )}
                    <button
                      className="sm-add-slot-btn"
                      onClick={() => openAddModal(day.value)}
                    >
                      + Add Slot
                    </button>
                  </div>
                </div>

                {/* Slots */}
                {daySlots.length === 0 ? (
                  <div className="sm-no-slots">No time slots added yet.</div>
                ) : (
                  <div className="sm-slots">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`sm-slot${!slot.is_available ? " unavailable" : ""}`}
                      >
                        <span className="sm-slot-time">
                          {fmt12(slot.start_time)} – {fmt12(slot.end_time)}
                        </span>
                        <span
                          className={`sm-slot-badge ${slot.is_available ? "avail" : "unavail"}`}
                        >
                          {slot.is_available ? "Available" : "Unavailable"}
                        </span>
                        <div className="sm-slot-actions">
                          <button
                            className={`sm-slot-toggle ${slot.is_available ? "avail" : "unavail"}`}
                            onClick={() => handleToggle(slot)}
                            disabled={togglingId === slot.id}
                          >
                            {togglingId === slot.id
                              ? "…"
                              : slot.is_available
                                ? "Mark Unavailable"
                                : "Mark Available"}
                          </button>
                          <button
                            className="sm-slot-del"
                            onClick={() => handleDelete(slot.id)}
                            disabled={deletingId === slot.id}
                            title="Delete slot"
                          >
                            {deletingId === slot.id ? "…" : "✕"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Slot Modal ── */}
      {addModal && (
        <div className="sm-overlay" onClick={() => setAddModal(null)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-title">
              Add Slot —{" "}
              {DAYS.find((d) => d.value === addModal.dayOfWeek)?.label}
            </div>
            <div className="sm-field">
              <label>Start Time</label>
              <input
                type="time"
                value={slotStart}
                onChange={(e) => setSlotStart(e.target.value)}
              />
            </div>
            <div className="sm-field">
              <label>End Time</label>
              <input
                type="time"
                value={slotEnd}
                onChange={(e) => setSlotEnd(e.target.value)}
              />
            </div>
            {slotError && <div className="sm-modal-err">{slotError}</div>}
            <div className="sm-modal-actions">
              <button
                className="sm-modal-cancel"
                onClick={() => setAddModal(null)}
              >
                Cancel
              </button>
              <button
                className="sm-modal-save"
                onClick={handleAddSlot}
                disabled={slotSaving}
              >
                {slotSaving ? "Saving…" : "Add Slot"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Reset Week ── */}
      {confirmReset && (
        <div className="sm-overlay" onClick={() => setConfirmReset(false)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-confirm-title">Clear This Week?</div>
            <div className="sm-confirm-body">
              All {slots.length} slot{slots.length !== 1 ? "s" : ""} for{" "}
              <strong>{formatWeekRange(currentWeek)}</strong> will be
              permanently deleted.
            </div>
            <div className="sm-modal-actions">
              <button
                className="sm-modal-cancel"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </button>
              <button
                className="sm-confirm-yes"
                onClick={handleResetWeek}
                disabled={resetting}
              >
                {resetting ? "Clearing…" : "Yes, Clear Week"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;
