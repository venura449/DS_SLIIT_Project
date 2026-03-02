import React from "react";

/**
 * JitsiMeeting — shows an instruction overlay and opens the Jitsi room
 * in a new browser tab (required because meet.jit.si enforces moderator
 * login for embedded iframes).
 *
 * Props:
 *  roomName    (string)  — the Jitsi room name
 *  displayName (string)  — participant display name (shown in instructions)
 *  onClose     (fn)      — called when the user dismisses the overlay
 */
const JitsiMeeting = ({ roomName, displayName, onClose }) => {
  const meetingUrl = `https://meet.jit.si/${roomName}`;

  const handleOpen = () => {
    window.open(meetingUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.headerIcon}>📹</span>
          <div>
            <div style={styles.headerTitle}>Video Consultation Ready</div>
            <div style={styles.headerSub}>
              MediConnect — Powered by Jitsi Meet
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div style={styles.infoBanner}>
          <span style={{ fontSize: 18 }}>ℹ️</span>
          <div>
            <div style={styles.infoTitle}>
              Meeting opens in a new browser tab
            </div>
            <div style={styles.infoBody}>
              For security reasons, Jitsi Meet requires the meeting to run in
              its own browser tab. Please follow the steps below.
            </div>
          </div>
        </div>

        {/* Steps */}
        <div style={styles.stepsTitle}>How to join your consultation:</div>
        <ol style={styles.steps}>
          <li style={styles.step}>
            <span style={styles.stepNum}>1</span>
            <div>
              Click <strong>"Open Meeting"</strong> below — your consultation
              room will open in a new tab.
            </div>
          </li>
          <li style={styles.step}>
            <span style={styles.stepNum}>2</span>
            <div>
              In the new tab, if prompted with{" "}
              <em>"The conference has not yet started"</em>, click{" "}
              <strong>"I am the host"</strong> or
              <strong> "Start meeting"</strong> to begin as moderator.
            </div>
          </li>
          <li style={styles.step}>
            <span style={styles.stepNum}>3</span>
            <div>
              Allow camera &amp; microphone access when the browser asks. Your
              display name will appear as{" "}
              <strong>{displayName || "Participant"}</strong>.
            </div>
          </li>
          <li style={styles.step}>
            <span style={styles.stepNum}>4</span>
            <div>
              Share the meeting link with the other party if needed, or they can
              also click <strong>Join</strong> from their dashboard.
            </div>
          </li>
          <li style={styles.step}>
            <span style={styles.stepNum}>5</span>
            <div>
              When done, hang up in the Jitsi tab and come back here to close
              this panel.
            </div>
          </li>
        </ol>

        {/* Room info */}
        <div style={styles.roomRow}>
          <span style={styles.roomLabel}>Room ID</span>
          <code style={styles.roomCode}>{roomName}</code>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={() => onClose && onClose()}>
            ✕ Cancel
          </button>
          <button style={styles.openBtn} onClick={handleOpen}>
            📹 Open Meeting
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(10,30,50,0.82)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backdropFilter: "blur(4px)",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 520,
    boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
    overflow: "hidden",
  },
  header: {
    background: "linear-gradient(135deg,#0a3d62,#1a6fa0)",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  headerIcon: { fontSize: 28 },
  headerTitle: {
    fontFamily: "'Sora',sans-serif",
    fontWeight: 700,
    fontSize: 17,
    color: "#fff",
  },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  infoBanner: {
    margin: "20px 24px 0",
    background: "#eff6ff",
    border: "1.5px solid #93c5fd",
    borderRadius: 10,
    padding: "12px 14px",
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  infoTitle: {
    fontWeight: 700,
    fontSize: 13,
    color: "#1d4ed8",
    marginBottom: 3,
  },
  infoBody: { fontSize: 12.5, color: "#1e40af", lineHeight: 1.5 },
  stepsTitle: {
    fontFamily: "'Sora',sans-serif",
    fontWeight: 700,
    fontSize: 13,
    color: "#0a3d62",
    margin: "18px 24px 10px",
  },
  steps: {
    listStyle: "none",
    padding: "0 24px",
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  step: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    fontSize: 13,
    color: "#334155",
    lineHeight: 1.5,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#0a3d62,#1a6fa0)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  roomRow: {
    margin: "16px 24px",
    background: "#f8fafc",
    border: "1px solid #e4eaf0",
    borderRadius: 8,
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  roomLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#7a8fa6",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flexShrink: 0,
  },
  roomCode: {
    fontSize: 12,
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "3px 8px",
    borderRadius: 5,
    border: "1px solid #bfdbfe",
    wordBreak: "break-all",
  },
  actions: {
    display: "flex",
    gap: 10,
    padding: "0 24px 24px",
    justifyContent: "flex-end",
  },
  cancelBtn: {
    padding: "10px 20px",
    borderRadius: 8,
    border: "1.5px solid #e4eaf0",
    background: "#f8fafc",
    color: "#3a5068",
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  openBtn: {
    padding: "10px 24px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg,#0a3d62,#1a6fa0)",
    color: "#fff",
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 3px 10px rgba(10,61,98,0.25)",
  },
};

export default JitsiMeeting;
