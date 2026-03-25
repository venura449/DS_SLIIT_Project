import { useEffect, useState } from "react";
import SymptomChecker from "./SymptomChecker";
import GeminiChat from "./GeminiChat";
import "./styles/SymptomTrackerModal.css";

const SymptomTrackerModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("gemini");

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="symptom-tracker-modal-overlay" onClick={onClose}>
      <div
        className="symptom-tracker-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-brand">
            <img
              src="/src/assets/favicon.png"
              alt="MediConnect"
              className="modal-header-logo"
            />
            <div className="modal-header-titles">
              <span className="modal-header-name">
                Medi<span>Connect</span>
              </span>
              <span className="modal-header-sub">AI Health Assistant</span>
            </div>
          </div>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab${activeTab === "gemini" ? " active" : ""}`}
            onClick={() => setActiveTab("gemini")}
          >
            ✨ Ask AI
          </button>
          <button
            className={`modal-tab${activeTab === "symptoms" ? " active" : ""}`}
            onClick={() => setActiveTab("symptoms")}
          >
            🩺 Symptom Check
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {activeTab === "gemini" ? <GeminiChat /> : <SymptomChecker />}
        </div>
      </div>
    </div>
  );
};

export default SymptomTrackerModal;
