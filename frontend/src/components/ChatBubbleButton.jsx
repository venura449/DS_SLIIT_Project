import { useState } from "react";
import "./styles/ChatBubbleButton.css";
import SymptomTrackerModal from "./SymptomTrackerModal";

const ChatBubbleButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat Bubble Button */}
      <button
        className={`chat-bubble-btn${isOpen ? " open" : ""}`}
        onClick={handleToggle}
        title="Ask MediConnect AI"
        aria-label="Open MediConnect AI Assistant"
      >
        <img
          src="/src/assets/favicon.png"
          alt="MediConnect"
          className="bubble-logo"
        />
        <div className="bubble-label">
          <span className="bubble-brand">MediConnect</span>
          <span className="bubble-text">Ask AI</span>
        </div>
      </button>

      {/* Modal Overlay */}
      {isOpen && <SymptomTrackerModal onClose={() => setIsOpen(false)} />}
    </>
  );
};

export default ChatBubbleButton;
