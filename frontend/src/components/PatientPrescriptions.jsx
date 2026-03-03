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
const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getPatientPrescriptions().then((res) => {
      if (res.success) setPrescriptions(res.data || []);
      else setError("Failed to load prescriptions.");
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
            `}</style>
      {loading ? (
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
      ) : error ? (
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
          {error}
        </div>
      ) : prescriptions.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#b0bec8" }}>
          <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.45 }}>
            💊
          </div>
          <p style={{ fontSize: 13 }}>
            No prescriptions found. Prescriptions issued by your doctor will
            appear here.
          </p>
        </div>
      ) : (
        prescriptions.map((p) => (
          <PrescriptionCard key={p.id} prescription={p} />
        ))
      )}
    </div>
  );
};

export default PatientPrescriptions;
