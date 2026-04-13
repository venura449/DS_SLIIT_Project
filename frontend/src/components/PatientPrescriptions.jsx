import { useState, useEffect } from "react";
import { getPatientPrescriptions } from "../utils/prescriptionService";

const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

const dateStr = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

/* ── PDF download helper ─────────────────────────────────── */
const downloadPrescription = (prescription) => {
  const fmt12 = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  };
  const dateStr = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "";

  const drugs = prescription.drugs || [];
  const drugsHtml = drugs
    .map(
      (d, i) => `
      <div class="drug">
        <div class="drug-header">
          <span class="drug-num">${i + 1}.</span>
          <span class="drug-name">${d.drug_name || ""}${d.strength ? " " + d.strength : ""}${d.dosage_form ? " (" + d.dosage_form + ")" : ""}</span>
          ${d.frequency ? `<span class="drug-freq">${d.frequency}</span>` : ""}
        </div>
        <div class="drug-detail">Duration: <strong>${d.duration || "—"}</strong></div>
        ${d.instructions ? `<div class="drug-note">Instructions: ${d.instructions}</div>` : ""}
      </div>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Prescription – Dr. ${prescription.doctor_name || "Doctor"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a2533; background: #fff; padding: 0; }
    .page { max-width: 720px; margin: 0 auto; padding: 36px 40px; }
    /* Header */
    .rx-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #7c3aed; padding-bottom: 16px; margin-bottom: 24px; }
    .rx-logo { font-size: 28px; font-weight: 800; color: #7c3aed; letter-spacing: -1px; }
    .rx-logo span { color: #a855f7; }
    .rx-meta { text-align: right; font-size: 12px; color: #5a7a95; }
    .rx-meta strong { display: block; font-size: 14px; color: #1a2533; margin-bottom: 2px; }
    /* Patient/Doctor info */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 10px; padding: 16px 20px; margin-bottom: 22px; }
    .info-item label { font-size: 10px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: .5px; display: block; margin-bottom: 3px; }
    .info-item span { font-size: 13px; color: #1a2533; }
    /* Diagnosis */
    .section-title { font-size: 11px; font-weight: 700; color: #5a7a95; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; }
    .diagnosis-box { background: #f8f4ff; border-left: 4px solid #7c3aed; padding: 12px 16px; border-radius: 6px; font-size: 14px; color: #1a2533; margin-bottom: 22px; }
    /* Drugs */
    .drugs-section { margin-bottom: 22px; }
    .drug { border: 1px solid #e9d5ff; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; }
    .drug-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
    .drug-num { font-size: 13px; color: #7c3aed; font-weight: 700; }
    .drug-name { font-size: 14px; font-weight: 700; color: #1a2533; flex: 1; }
    .drug-freq { background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .drug-detail { font-size: 12px; color: #3a5068; margin-top: 2px; }
    .drug-note { font-size: 12px; color: #5a7a95; margin-top: 4px; }
    /* Notes */
    .notes-box { background: #fffbeb; border: 1px solid #fde047; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #1a2533; margin-bottom: 22px; }
    /* Footer */
    .rx-footer { border-top: 1px solid #e4eaf0; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; }
    .signature-block { text-align: center; }
    .sig-line { border-top: 1.5px solid #1a2533; width: 180px; padding-top: 6px; font-size: 12px; color: #5a7a95; }
    .rx-stamp { font-size: 11px; color: #b0bec8; text-align: right; }
    @media print {
      body { padding: 0; }
      .page { padding: 20px 28px; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="rx-header">
    <div class="rx-logo">Medi<span>Care</span> <span style="font-size:13px;font-weight:400;color:#7a8fa6">Prescription</span></div>
    <div class="rx-meta">
      <strong>${dateStr(prescription.appointment_date)}</strong>
      ${prescription.start_time ? fmt12(prescription.start_time) : ""}
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item">
      <label>Prescribing Doctor</label>
      <span>${prescription.doctor_name ? "Dr. " + prescription.doctor_name : "—"}</span>
    </div>
    <div class="info-item">
      <label>Patient</label>
      <span>${prescription.patient_name || "—"}</span>
    </div>
    <div class="info-item">
      <label>Appointment Date</label>
      <span>${dateStr(prescription.appointment_date) || "—"}</span>
    </div>
    <div class="info-item">
      <label>Prescription ID</label>
      <span style="font-size:11px;color:#7a8fa6">${prescription.id || "—"}</span>
    </div>
  </div>

  <div class="section-title">Diagnosis</div>
  <div class="diagnosis-box">${prescription.diagnosis || "—"}</div>

  <div class="drugs-section">
    <div class="section-title">Prescribed Medications (${drugs.length})</div>
    ${drugsHtml || "<p style='color:#b0bec8;font-size:13px'>No medications listed.</p>"}
  </div>

  ${prescription.notes ? `<div class="section-title">Additional Notes</div><div class="notes-box">${prescription.notes}</div>` : ""}

  <div class="rx-footer">
    <div class="signature-block">
      <div class="sig-line">Dr. ${prescription.doctor_name || "____________________"}</div>
    </div>
    <div class="rx-stamp">Generated by MediCare Health System<br/>This prescription is computer-generated.</div>
  </div>
</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
};

/* ── View-only prescription card ─────────────────────────── */
const PrescriptionCard = ({ prescription }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        border: "1.5px solid #e9d5ff",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 12,
        background: "#fff",
      }}
    >
      {/* Header strip */}
      <div
        style={{
          padding: "14px 18px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "#faf5ff",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#7c3aed,#a855f7)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          💊
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Sora',sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: "#4c1d95",
            }}
          >
            {prescription.doctor_name
              ? `Dr. ${prescription.doctor_name}`
              : "Prescription"}
          </div>
          <div style={{ fontSize: 12, color: "#7a8fa6", marginTop: 2 }}>
            {dateStr(prescription.appointment_date)}
            {prescription.start_time
              ? ` · ${fmt12(prescription.start_time)}`
              : ""}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#1a3a52",
              marginTop: 3,
              fontStyle: "italic",
            }}
          >
            {prescription.diagnosis}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              color: "#15803d",
              padding: "2px 9px",
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {(prescription.drugs || []).length} drug
            {(prescription.drugs || []).length !== 1 ? "s" : ""}
          </span>
          <button
            title="Download prescription as PDF"
            onClick={(e) => {
              e.stopPropagation();
              downloadPrescription(prescription);
            }}
            style={{
              background: "#eff6ff",
              border: "1px solid #93c5fd",
              color: "#1d4ed8",
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
            }}
          >
            ⬇ PDF
          </button>
          <span style={{ color: "#7a8fa6", fontSize: 16 }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ padding: "16px 18px", borderTop: "1px solid #e9d5ff" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#5a7a95",
              textTransform: "uppercase",
              letterSpacing: ".4px",
              marginBottom: 6,
            }}
          >
            Diagnosis
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#1a3a52",
              lineHeight: 1.5,
              marginBottom: 14,
            }}
          >
            {prescription.diagnosis}
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
              key={i}
              style={{
                background: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: 9,
                padding: "12px 14px",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                <div>
                  <span
                    style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}
                  >
                    {d.drug_name}
                  </span>
                  {d.strength && (
                    <span
                      style={{ fontSize: 13, color: "#3a5068", marginLeft: 6 }}
                    >
                      {d.strength}
                    </span>
                  )}
                  {d.dosage_form && (
                    <span
                      style={{ fontSize: 12, color: "#7a8fa6", marginLeft: 5 }}
                    >
                      ({d.dosage_form})
                    </span>
                  )}
                </div>
                <span
                  style={{
                    background: "#dcfce7",
                    border: "1px solid #86efac",
                    color: "#15803d",
                    padding: "2px 10px",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {d.frequency}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#1a3a52", marginTop: 5 }}>
                Duration: <strong>{d.duration}</strong>
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
      )}
    </div>
  );
};

/* ── PatientPrescriptions (main export) ──────────────────── */
const PatientPrescriptions = ({
  data,
  loading: loadingProp,
  error: errorProp,
  onRefresh,
}) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rxSearch, setRxSearch] = useState("");
  const [rxDoctorFilter, setRxDoctorFilter] = useState("all");

  // Only fetch internally if no data prop is provided
  useEffect(() => {
    if (data !== undefined) return;
    setLoading(true);
    getPatientPrescriptions().then((res) => {
      if (res.success) setPrescriptions(res.data || []);
      else setError("Failed to load prescriptions.");
      setLoading(false);
    });
  }, [data]);

  const displayList = data !== undefined ? data : prescriptions;
  const isLoading = data !== undefined ? loadingProp : loading;
  const isError = data !== undefined ? errorProp : error;

  // Build unique doctor list for filter dropdown
  const doctorOptions = [
    ...new Set(displayList.map((p) => p.doctor_name).filter(Boolean)),
  ].sort();

  const q = rxSearch.toLowerCase().trim();
  const filtered = displayList.filter((p) => {
    if (rxDoctorFilter !== "all" && p.doctor_name !== rxDoctorFilter)
      return false;
    if (q) {
      const docMatch = (p.doctor_name || "").toLowerCase().includes(q);
      const diagMatch = (p.diagnosis || "").toLowerCase().includes(q);
      if (!docMatch && !diagMatch) return false;
    }
    return true;
  });

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>

      {/* ── Toolbar ── */}
      {!isLoading && !isError && displayList.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 13,
                pointerEvents: "none",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by doctor or diagnosis…"
              value={rxSearch}
              onChange={(e) => setRxSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 30px 7px 30px",
                border: "1px solid #dce6ef",
                borderRadius: 8,
                fontSize: 13,
                color: "#1a3550",
                background: "#f7fafc",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color .18s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#7c3aed";
                e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#dce6ef";
                e.target.style.boxShadow = "none";
              }}
            />
            {rxSearch && (
              <button
                onClick={() => setRxSearch("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: "#7a8fa6",
                  padding: "2px 4px",
                }}
              >
                ✕
              </button>
            )}
          </div>
          <select
            value={rxDoctorFilter}
            onChange={(e) => setRxDoctorFilter(e.target.value)}
            style={{
              padding: "7px 10px",
              border: "1px solid #dce6ef",
              borderRadius: 8,
              fontSize: 13,
              color: "#1a3550",
              background: "#f7fafc",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Doctors</option>
            {doctorOptions.map((d) => (
              <option key={d} value={d}>
                Dr. {d}
              </option>
            ))}
          </select>
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{
                padding: "7px 14px",
                border: "1px solid #e4eaf0",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: "#1a6fa0",
                background: "#f0f4f8",
                cursor: "pointer",
              }}
            >
              🔄 Refresh
            </button>
          )}
          {(rxSearch || rxDoctorFilter !== "all") && (
            <button
              onClick={() => {
                setRxSearch("");
                setRxDoctorFilter("all");
              }}
              style={{
                padding: "7px 12px",
                border: "1px solid #e4eaf0",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: "#1a6fa0",
                background: "#f0f4f8",
                cursor: "pointer",
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "#7a8fa6",
            fontSize: 14,
          }}
        >
          Loading prescriptions…
        </div>
      ) : isError ? (
        <div
          style={{
            padding: "12px 16px",
            background: "#fff1f1",
            border: "1px solid #fca5a5",
            borderRadius: 8,
            fontSize: 13,
            color: "#dc2626",
          }}
        >
          {isError}
        </div>
      ) : displayList.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#b0bec8" }}>
          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.45 }}>
            💊
          </div>
          <p style={{ fontSize: 13 }}>
            No prescriptions found. Prescriptions issued by your doctor will
            appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#b0bec8" }}>
          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.45 }}>
            🔍
          </div>
          <p style={{ fontSize: 13 }}>
            No prescriptions match your search or filter.
          </p>
        </div>
      ) : (
        filtered.map((p) => <PrescriptionCard key={p.id} prescription={p} />)
      )}
    </div>
  );
};

export default PatientPrescriptions;
