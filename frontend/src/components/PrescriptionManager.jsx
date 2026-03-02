import { useState, useEffect, useRef, useCallback } from "react";
import * as appointmentService from "../utils/appointmentService";
import {
  createPrescription,
  updatePrescription,
  getDoctorPrescriptions,
  searchDrugs,
  FREQUENCY_OPTIONS,
  DURATION_SUGGESTIONS,
} from "../utils/prescriptionService";

/* ─── helpers ─────────────────────────────────────────────── */
const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

const emptyDrug = () => ({
  _key: Date.now() + Math.random(),
  rxcui: "",
  drugName: "",
  strength: "",
  dosageForm: "",
  frequency: "OD",
  duration: "7 days",
  instructions: "",
  _searchResults: [],
  _showDropdown: false,
  _searching: false,
});

/* ─── DrugRow subcomponent ───────────────────────────────── */
const DrugRow = ({ drug, idx, onChange, onRemove }) => {
  const searchTimer = useRef(null);
  const dropdownRef = useRef(null);

  const handleDrugNameChange = (val) => {
    onChange(idx, {
      ...drug,
      drugName: val,
      rxcui: "",
      _showDropdown: false,
      _searchResults: [],
    });
    clearTimeout(searchTimer.current);
    if (val.trim().length >= 2) {
      onChange(idx, {
        ...drug,
        drugName: val,
        _searching: true,
        _showDropdown: false,
      });
      searchTimer.current = setTimeout(async () => {
        const results = await searchDrugs(val);
        onChange(idx, (prev) => ({
          ...prev,
          drugName: val,
          _searching: false,
          _searchResults: results,
          _showDropdown: results.length > 0,
        }));
      }, 350);
    }
  };

  const selectSuggestion = (suggestion) => {
    onChange(idx, {
      ...drug,
      rxcui: suggestion.rxcui,
      drugName: suggestion.name,
      _searchResults: [],
      _showDropdown: false,
      _searching: false,
    });
  };

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onChange(idx, (prev) => ({ ...prev, _showDropdown: false }));
      }
    };
    const escHandler = (e) => {
      if (e.key === "Escape") {
        onChange(idx, (prev) => ({ ...prev, _showDropdown: false }));
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [idx, onChange]);

  const inp = {
    border: "1.5px solid #e4eaf0",
    borderRadius: 7,
    padding: "7px 10px",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    color: "#1a3a52",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1.5px solid #e4eaf0",
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#0a3d62",
            textTransform: "uppercase",
            letterSpacing: ".4px",
          }}
        >
          Drug {idx + 1}
        </span>
        <button
          type="button"
          onClick={() => onRemove(idx)}
          style={{
            border: "none",
            background: "none",
            color: "#ef4444",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
            padding: "2px 6px",
            borderRadius: 5,
          }}
          title="Remove drug"
        >
          ✕
        </button>
      </div>

      {/* Drug name with RxNorm autocomplete */}
      <div style={{ position: "relative", marginBottom: 10 }} ref={dropdownRef}>
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: "#5a7a95",
            textTransform: "uppercase",
            letterSpacing: ".4px",
            marginBottom: 4,
          }}
        >
          Drug Name *
        </label>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search drug (e.g. Amoxicillin, Paracetamol)…"
            value={drug.drugName}
            onChange={(e) => handleDrugNameChange(e.target.value)}
            style={{
              ...inp,
              paddingRight: drug._searching ? 34 : 10,
              borderColor: drug._searching ? "#93c5fd" : "#e4eaf0",
            }}
            autoComplete="off"
          />
          {drug._searching && (
            <span
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 14,
                height: 14,
                border: "2px solid #e4eaf0",
                borderTopColor: "#1a6fa0",
                borderRadius: "50%",
                display: "inline-block",
                animation: "prx-spin 0.7s linear infinite",
              }}
            />
          )}
        </div>
        {drug.rxcui && (
          <div style={{ fontSize: 11, color: "#15803d", marginTop: 3 }}>
            ✓ RxNorm CUI: {drug.rxcui}
          </div>
        )}
        {drug._showDropdown && drug._searchResults.length > 0 && (
          <div
            style={{
              position: "absolute",
              zIndex: 200,
              left: 0,
              right: 0,
              top: "100%",
              background: "#fff",
              border: "1.5px solid #e4eaf0",
              borderRadius: 8,
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "5px 10px",
                fontSize: 10,
                fontWeight: 700,
                color: "#7a8fa6",
                textTransform: "uppercase",
                letterSpacing: ".4px",
                background: "#f8fafc",
                borderBottom: "1px solid #e4eaf0",
              }}
            >
              RxNorm Suggestions
            </div>
            {drug._searchResults.map((s) => (
              <div
                key={s.rxcui}
                onMouseDown={() => selectSuggestion(s)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#1a3a52",
                  borderBottom: "1px solid #f0f4f8",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#eff6ff")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <span>{s.name}</span>
                <span
                  style={{
                    fontSize: 10,
                    color: "#1d4ed8",
                    background: "#eff6ff",
                    padding: "1px 7px",
                    borderRadius: 10,
                    border: "1px solid #93c5fd",
                  }}
                >
                  CUI {s.rxcui}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row: strength + form */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              color: "#5a7a95",
              textTransform: "uppercase",
              letterSpacing: ".4px",
              marginBottom: 4,
            }}
          >
            Strength / Dose
          </label>
          <input
            type="text"
            placeholder="e.g. 500 mg, 10 mg/5 mL"
            value={drug.strength}
            onChange={(e) =>
              onChange(idx, { ...drug, strength: e.target.value })
            }
            style={inp}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              color: "#5a7a95",
              textTransform: "uppercase",
              letterSpacing: ".4px",
              marginBottom: 4,
            }}
          >
            Dosage Form
          </label>
          <input
            type="text"
            placeholder="e.g. Tablet, Capsule, Syrup"
            value={drug.dosageForm}
            onChange={(e) =>
              onChange(idx, { ...drug, dosageForm: e.target.value })
            }
            style={inp}
          />
        </div>
      </div>

      {/* Row: frequency + duration */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              color: "#5a7a95",
              textTransform: "uppercase",
              letterSpacing: ".4px",
              marginBottom: 4,
            }}
          >
            Frequency *
          </label>
          <select
            value={drug.frequency}
            onChange={(e) =>
              onChange(idx, { ...drug, frequency: e.target.value })
            }
            style={{ ...inp }}
          >
            {FREQUENCY_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              color: "#5a7a95",
              textTransform: "uppercase",
              letterSpacing: ".4px",
              marginBottom: 4,
            }}
          >
            Duration *
          </label>
          <input
            type="text"
            placeholder="e.g. 7 days, 1 month"
            list={`duration-opts-${idx}`}
            value={drug.duration}
            onChange={(e) =>
              onChange(idx, { ...drug, duration: e.target.value })
            }
            style={inp}
          />
          <datalist id={`duration-opts-${idx}`}>
            {DURATION_SUGGESTIONS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: "#5a7a95",
            textTransform: "uppercase",
            letterSpacing: ".4px",
            marginBottom: 4,
          }}
        >
          Special Instructions
        </label>
        <input
          type="text"
          placeholder="e.g. Take with food, Avoid alcohol"
          value={drug.instructions}
          onChange={(e) =>
            onChange(idx, { ...drug, instructions: e.target.value })
          }
          style={inp}
        />
      </div>
    </div>
  );
};

/* ─── PrescriptionForm modal ─────────────────────────────── */
const PrescriptionForm = ({ appointment, existing, onSave, onClose }) => {
  const [diagnosis, setDiagnosis] = useState(existing?.diagnosis ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [drugs, setDrugs] = useState(
    existing?.drugs?.length
      ? existing.drugs.map((d) => ({
          ...emptyDrug(),
          ...d,
          _key: d.id || Date.now() + Math.random(),
          drugName: d.drug_name ?? "",
          strength: d.strength ?? "",
          dosageForm: d.dosage_form ?? "",
          instructions: d.instructions ?? "",
          frequency: d.frequency ?? "OD",
          duration: d.duration ?? "7 days",
          _searchResults: [],
          _showDropdown: false,
          _searching: false,
        }))
      : [emptyDrug()],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleDrugChange = useCallback((idx, updater) => {
    setDrugs((prev) => {
      const next = [...prev];
      next[idx] = typeof updater === "function" ? updater(prev[idx]) : updater;
      return next;
    });
  }, []);

  const handleAddDrug = () => setDrugs((prev) => [...prev, emptyDrug()]);
  const handleRemoveDrug = (idx) =>
    setDrugs((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!diagnosis.trim()) {
      setError("Diagnosis is required.");
      return;
    }
    if (drugs.length === 0) {
      setError("Add at least one drug.");
      return;
    }
    for (const d of drugs) {
      if (!d.drugName.trim()) {
        setError("All drugs must have a name.");
        return;
      }
      if (!d.frequency) {
        setError("All drugs must have a frequency.");
        return;
      }
      if (!d.duration.trim()) {
        setError("All drugs must have a duration.");
        return;
      }
    }
    setSaving(true);
    setError("");
    const payload = {
      appointmentId: appointment.id,
      diagnosis: diagnosis.trim(),
      notes: notes.trim() || null,
      drugs: drugs.map((d) => ({
        rxcui: d.rxcui || null,
        drugName: (d.drugName ?? "").trim(),
        strength: (d.strength ?? "").trim() || null,
        dosageForm: (d.dosageForm ?? "").trim() || null,
        frequency: d.frequency,
        duration: (d.duration ?? "").trim(),
        instructions: (d.instructions ?? "").trim() || null,
      })),
    };
    let res;
    if (existing?.id) {
      res = await updatePrescription(existing.id, payload);
    } else {
      res = await createPrescription(payload);
    }
    setSaving(false);
    if (res.success) {
      onSave(res.data);
    } else {
      setError(res.message || "Failed to save prescription.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 700,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid #e4eaf0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#0a3d62",
              }}
            >
              💊 {existing ? "Edit" : "New"} Prescription
            </div>
            <div style={{ fontSize: 12, color: "#7a8fa6", marginTop: 2 }}>
              Patient: <strong>{appointment.patient_name || "Patient"}</strong>
              &nbsp;·&nbsp;
              {new Date(appointment.appointment_date).toLocaleDateString(
                "en-US",
                { weekday: "short", month: "short", day: "numeric" },
              )}
              &nbsp;{fmt12(appointment.start_time)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#7a8fa6",
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
          {error && (
            <div
              style={{
                marginBottom: 14,
                padding: "9px 14px",
                background: "#fff1f1",
                border: "1px solid #fca5a5",
                borderRadius: 8,
                fontSize: 13,
                color: "#dc2626",
              }}
            >
              ⚠ {error}
            </div>
          )}

          {/* Diagnosis */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "#3a5068",
                textTransform: "uppercase",
                letterSpacing: ".4px",
                marginBottom: 6,
              }}
            >
              Diagnosis *
            </label>
            <textarea
              rows={3}
              placeholder="Describe the diagnosis or condition…"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              style={{
                width: "100%",
                border: "1.5px solid #e4eaf0",
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                color: "#1a3a52",
                background: "#fff",
                resize: "vertical",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          {/* Drugs */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#3a5068",
                  textTransform: "uppercase",
                  letterSpacing: ".4px",
                }}
              >
                Medications *
              </label>
              <button
                type="button"
                onClick={handleAddDrug}
                style={{
                  background: "#eff6ff",
                  border: "1px solid #93c5fd",
                  color: "#1d4ed8",
                  borderRadius: 7,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Add Drug
              </button>
            </div>
            {drugs.map((drug, idx) => (
              <DrugRow
                key={drug._key}
                drug={drug}
                idx={idx}
                onChange={handleDrugChange}
                onRemove={handleRemoveDrug}
              />
            ))}
          </div>

          {/* Notes */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "#3a5068",
                textTransform: "uppercase",
                letterSpacing: ".4px",
                marginBottom: 6,
              }}
            >
              Additional Notes
            </label>
            <textarea
              rows={2}
              placeholder="General advice, follow-up instructions, dietary notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                border: "1.5px solid #e4eaf0",
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                color: "#1a3a52",
                background: "#fff",
                resize: "vertical",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid #e4eaf0",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1.5px solid #e4eaf0",
              background: "#f8fafc",
              color: "#3a5068",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: "8px 22px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg,#0a3d62,#1a6fa0)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.75 : 1,
            }}
          >
            {saving
              ? "Saving…"
              : existing
                ? "Update Prescription"
                : "Issue Prescription"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── PrescriptionView — view-only card ─────────────────── */
const PrescriptionView = ({ prescription, onClose }) => {
  const dateStr = prescription.appointment_date
    ? new Date(prescription.appointment_date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid #e4eaf0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Sora',sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#0a3d62",
              }}
            >
              💊 Prescription
            </div>
            <div style={{ fontSize: 12, color: "#7a8fa6", marginTop: 2 }}>
              {prescription.doctor_name
                ? `Dr. ${prescription.doctor_name}`
                : ""}
              {dateStr ? ` · ${dateStr}` : ""}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#7a8fa6",
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#5a7a95",
                textTransform: "uppercase",
                letterSpacing: ".4px",
                marginBottom: 5,
              }}
            >
              Diagnosis
            </div>
            <div style={{ fontSize: 14, color: "#1a3a52", lineHeight: 1.5 }}>
              {prescription.diagnosis}
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#5a7a95",
              textTransform: "uppercase",
              letterSpacing: ".4px",
              marginBottom: 10,
            }}
          >
            Medications
          </div>
          {(prescription.drugs || []).map((d, i) => (
            <div
              key={d.id || i}
              style={{
                background: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: 9,
                padding: "12px 14px",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#15803d",
                  marginBottom: 4,
                }}
              >
                {d.drug_name}
                {d.strength ? (
                  <span
                    style={{ fontWeight: 400, color: "#3a5068", marginLeft: 6 }}
                  >
                    {d.strength}
                  </span>
                ) : null}
                {d.dosage_form ? (
                  <span
                    style={{
                      fontWeight: 400,
                      color: "#7a8fa6",
                      marginLeft: 5,
                      fontSize: 12,
                    }}
                  >
                    ({d.dosage_form})
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize: 13, color: "#1a3a52" }}>
                <span
                  style={{
                    background: "#dcfce7",
                    border: "1px solid #86efac",
                    padding: "1px 8px",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 12,
                    marginRight: 8,
                  }}
                >
                  {d.frequency}
                </span>
                for <strong>{d.duration}</strong>
              </div>
              {d.instructions && (
                <div style={{ fontSize: 12, color: "#5a7a95", marginTop: 4 }}>
                  📝 {d.instructions}
                </div>
              )}
            </div>
          ))}
          {prescription.notes && (
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#5a7a95",
                  textTransform: "uppercase",
                  letterSpacing: ".4px",
                  marginBottom: 5,
                }}
              >
                Notes
              </div>
              <div style={{ fontSize: 13, color: "#1a3a52", lineHeight: 1.5 }}>
                {prescription.notes}
              </div>
            </div>
          )}
        </div>
        <div
          style={{
            padding: "12px 22px",
            borderTop: "1px solid #e4eaf0",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "7px 20px",
              borderRadius: 8,
              border: "1.5px solid #e4eaf0",
              background: "#f8fafc",
              color: "#3a5068",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main PrescriptionManager (Doctor view) ────────────── */
const PrescriptionManager = () => {
  const [confirmedAppointments, setConfirmedAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [formAppt, setFormAppt] = useState(null); // appointment for new/edit form
  const [editPrescription, setEditPrescription] = useState(null); // existing prescription when editing
  const [viewPrescription, setViewPrescription] = useState(null); // for view-only modal

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const [apptRes, prescRes] = await Promise.all([
      appointmentService.getDoctorAppointments(""),
      getDoctorPrescriptions(),
    ]);
    if (apptRes.success) {
      setConfirmedAppointments(
        (apptRes.data || []).filter((a) => a.status === "confirmed"),
      );
    } else {
      setError("Failed to load appointments.");
    }
    if (prescRes.success) setPrescriptions(prescRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const prescriptionByAppt = {};
  for (const p of prescriptions) {
    prescriptionByAppt[p.appointment_id] = p;
  }

  const handleSaved = (saved) => {
    setPrescriptions((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setFormAppt(null);
    setEditPrescription(null);
  };

  const openNew = (appt) => {
    setEditPrescription(null);
    setFormAppt(appt);
  };

  const openEdit = (appt, presc) => {
    setEditPrescription(presc);
    setFormAppt(appt);
  };

  const dateStr = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";

  return (
    <div>
      <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes prx-spin { to { transform: rotate(360deg); } }
                .pm-section { background:#fff; border:1px solid #e4eaf0; border-radius:10px; padding:20px 22px; margin-bottom:14px; }
                .pm-section-title { font-family:'Sora',sans-serif; font-size:14px; font-weight:700; color:#0a3d62; margin-bottom:14px; display:flex; align-items:center; gap:7px; }
                .pm-appt-row { display:flex; align-items:center; gap:14px; padding:12px 16px; border:1.5px solid #e4eaf0; border-radius:10px; margin-bottom:8px; }
                .pm-appt-info { flex:1; min-width:0; }
                .pm-appt-name { font-size:14px; font-weight:700; color:#1a3a52; }
                .pm-appt-sub { font-size:12px; color:#7a8fa6; margin-top:2px; }
                .pm-btn-issue { padding:7px 16px; border-radius:8px; border:none; background:linear-gradient(135deg,#0a3d62,#1a6fa0); color:#fff; font-size:12px; font-weight:700; cursor:pointer; }
                .pm-btn-edit { padding:7px 14px; border-radius:8px; border:1.5px solid #1a6fa0; background:#fff; color:#1a6fa0; font-size:12px; font-weight:700; cursor:pointer; }
                .pm-btn-view { padding:7px 14px; border-radius:8px; border:1.5px solid #7c3aed; background:#fff; color:#7c3aed; font-size:12px; font-weight:700; cursor:pointer; }
                .pm-empty { text-align:center; padding:28px; color:#b0bec8; font-size:13px; }
                .pm-presc-card { border:1.5px solid #e9d5ff; border-radius:10px; padding:14px 16px; margin-bottom:10px; background:#faf5ff; }
                .pm-presc-header { display:flex; align-items:center; gap:12px; margin-bottom:8px; }
                .pm-presc-patient { font-size:14px; font-weight:700; color:#4c1d95; }
                .pm-presc-date { font-size:12px; color:#7a8fa6; }
                .pm-drug-chip { display:inline-flex; align-items:center; gap:5px; background:#f0fdf4; border:1px solid #86efac; color:#15803d; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; margin:2px; }
                .pm-freq { background:#dcfce7; border:1px solid #86efac; color:#15803d; padding:1px 7px; border-radius:10px; font-size:11px; font-weight:700; }
            `}</style>

      {/* Confirmed appointments ready for prescribing */}
      <div className="pm-section">
        <div className="pm-section-title">
          📋 Confirmed Appointments — Issue Prescription
        </div>
        {loading ? (
          <div className="pm-empty">Loading…</div>
        ) : error ? (
          <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>
        ) : confirmedAppointments.length === 0 ? (
          <div className="pm-empty">
            No confirmed appointments yet. Approve appointments from the
            Appointments tab to prescribe.
          </div>
        ) : (
          confirmedAppointments.map((appt) => {
            const existing = prescriptionByAppt[appt.id];
            return (
              <div className="pm-appt-row" key={appt.id}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#1a6fa0,#3b9ed9)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {(appt.patient_name || "P")
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="pm-appt-info">
                  <div className="pm-appt-name">
                    {appt.patient_name || "Patient"}
                  </div>
                  <div className="pm-appt-sub">
                    {dateStr(appt.appointment_date)}&nbsp;·&nbsp;
                    {fmt12(appt.start_time)} – {fmt12(appt.end_time)}
                    {appt.reason ? (
                      <>
                        &nbsp;·&nbsp;<em>"{appt.reason}"</em>
                      </>
                    ) : null}
                  </div>
                </div>
                {existing ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="pm-btn-view"
                      onClick={() => setViewPrescription(existing)}
                    >
                      👁 View
                    </button>
                    <button
                      className="pm-btn-edit"
                      onClick={() => openEdit(appt, existing)}
                    >
                      ✏ Edit
                    </button>
                  </div>
                ) : (
                  <button
                    className="pm-btn-issue"
                    onClick={() => openNew(appt)}
                  >
                    + Issue Prescription
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* All issued prescriptions */}
      <div className="pm-section">
        <div className="pm-section-title">💊 Issued Prescriptions</div>
        {loading ? (
          <div className="pm-empty">Loading…</div>
        ) : prescriptions.length === 0 ? (
          <div className="pm-empty">No prescriptions issued yet.</div>
        ) : (
          prescriptions.map((p) => (
            <div className="pm-presc-card" key={p.id}>
              <div className="pm-presc-header">
                <div style={{ flex: 1 }}>
                  <div className="pm-presc-patient">
                    {p.patient_name || "Patient"}
                  </div>
                  <div className="pm-presc-date">
                    {dateStr(p.appointment_date)}
                    {p.start_time ? ` · ${fmt12(p.start_time)}` : ""}
                  </div>
                </div>
                <button
                  className="pm-btn-view"
                  onClick={() => setViewPrescription(p)}
                >
                  👁 View
                </button>
              </div>
              <div style={{ fontSize: 13, color: "#1a3a52", marginBottom: 8 }}>
                <strong>Diagnosis:</strong> {p.diagnosis}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {(p.drugs || []).map((d, i) => (
                  <span key={i} className="pm-drug-chip">
                    💊 {d.drug_name}
                    {d.strength ? ` ${d.strength}` : ""}
                    <span className="pm-freq">{d.frequency}</span>
                    <span style={{ color: "#5a7a95", fontWeight: 400 }}>
                      {d.duration}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Prescription form modal */}
      {formAppt && (
        <PrescriptionForm
          appointment={formAppt}
          existing={editPrescription}
          onSave={handleSaved}
          onClose={() => {
            setFormAppt(null);
            setEditPrescription(null);
          }}
        />
      )}

      {/* View-only modal */}
      {viewPrescription && (
        <PrescriptionView
          prescription={viewPrescription}
          onClose={() => setViewPrescription(null)}
        />
      )}
    </div>
  );
};

export default PrescriptionManager;
