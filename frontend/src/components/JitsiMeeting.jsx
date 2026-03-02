import React, { useEffect, useRef } from "react";

/**
 * JitsiMeeting — embeds a Jitsi Meet video call using the External API.
 * The Jitsi External API script is loaded dynamically so it never blocks
 * the rest of the app.
 *
 * Props:
 *  roomName  (string)  — the Jitsi room name (e.g. "MediConnect-abc123")
 *  displayName (string) — participant display name
 *  onClose    (fn)     — called when the user hangs up / closes
 */
const JitsiMeeting = ({ roomName, displayName, onClose }) => {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    const JITSI_DOMAIN = "meet.jit.si";

    const loadApi = () => {
      if (window.JitsiMeetExternalAPI) {
        initMeeting();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://${JITSI_DOMAIN}/external_api.js`;
      script.async = true;
      script.onload = initMeeting;
      document.head.appendChild(script);
    };

    const initMeeting = () => {
      if (!containerRef.current || apiRef.current) return;

      apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            "microphone",
            "camera",
            "desktop",
            "fullscreen",
            "forvideoquality",
            "hangup",
            "chat",
            "tileview",
            "settings",
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
        userInfo: {
          displayName: displayName || "Participant",
        },
      });

      apiRef.current.addEventListeners({
        readyToClose: () => {
          cleanup();
          if (onClose) onClose();
        },
        videoConferenceLeft: () => {
          cleanup();
          if (onClose) onClose();
        },
      });
    };

    loadApi();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName]);

  const cleanup = () => {
    if (apiRef.current) {
      try {
        apiRef.current.dispose();
      } catch {
        // ignore dispose errors
      }
      apiRef.current = null;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 44,
          background: "#0a3d62",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: "#fff",
            fontFamily: "'Sora', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          📹 MediConnect — Video Consultation
        </span>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
          Room: {roomName}
        </span>
      </div>

      {/* Jitsi container */}
      <div ref={containerRef} style={{ flex: 1, overflow: "hidden" }} />
    </div>
  );
};

export default JitsiMeeting;
