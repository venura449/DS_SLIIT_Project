import { useState, useRef, useEffect } from "react";
import "./styles/GeminiChat.css";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are a helpful AI health assistant for MediConnect, a healthcare platform. 
Your role is to:
- Provide general health information and guidance
- Help patients understand their symptoms and suggest when to seek medical care
- Explain medical conditions, medications, and treatments in simple terms
- Recommend healthy lifestyle choices
- Guide patients on when they should urgently see a doctor

Always be empathetic, clear, and responsible. Always remind users that your advice is informational and they should consult a licensed healthcare professional for medical diagnosis or treatment. Keep responses concise and easy to understand.`;

const formatTime = () => {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const GeminiChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "👋 Hello! I'm your MediConnect AI Assistant powered by Google Gemini. I can help answer health questions, explain symptoms, and guide you on when to seek medical care.\n\nWhat can I help you with today?",
      time: formatTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const conversationHistory = useRef([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError("");

    const userMsg = {
      id: Date.now(),
      role: "user",
      text,
      time: formatTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Build conversation history for Gemini
    conversationHistory.current.push({ role: "user", parts: [{ text }] });

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: conversationHistory.current,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || "Gemini API error");
      }

      const data = await response.json();
      const aiText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I'm sorry, I couldn't generate a response. Please try again.";

      // Add AI response to history
      conversationHistory.current.push({
        role: "model",
        parts: [{ text: aiText }],
      });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: aiText,
          time: formatTime(),
        },
      ]);
    } catch (err) {
      setError(err.message || "Failed to reach AI. Please try again.");
      // Remove the failed user message from history
      conversationHistory.current.pop();
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    conversationHistory.current = [];
    setMessages([
      {
        id: 1,
        role: "assistant",
        text: "Chat cleared! How can I help you today?",
        time: formatTime(),
      },
    ]);
    setError("");
  };

  // Simple markdown-like formatting for the response
  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <div className="gc-container">
      {/* Messages */}
      <div className="gc-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`gc-message ${msg.role === "user" ? "gc-user" : "gc-bot"}`}
          >
            {msg.role === "assistant" && (
              <div className="gc-avatar">
                <img src="/src/assets/favicon.png" alt="AI" />
              </div>
            )}
            <div className="gc-bubble-wrap">
              <div
                className="gc-bubble"
                dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
              />
              <span className="gc-time">{msg.time}</span>
            </div>
            {msg.role === "user" && (
              <div className="gc-avatar gc-user-avatar">👤</div>
            )}
          </div>
        ))}

        {loading && (
          <div className="gc-message gc-bot">
            <div className="gc-avatar">
              <img src="/src/assets/favicon.png" alt="AI" />
            </div>
            <div className="gc-bubble-wrap">
              <div className="gc-bubble gc-typing-bubble">
                <span className="gc-dot" />
                <span className="gc-dot" />
                <span className="gc-dot" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="gc-error">
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="gc-input-area">
        <div className="gc-input-row">
          <textarea
            ref={inputRef}
            className="gc-input"
            placeholder="Ask me anything about your health…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="gc-send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            title="Send (Enter)"
          >
            {loading ? (
              <span className="gc-spinner" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
              </svg>
            )}
          </button>
        </div>
        <div className="gc-footer-row">
          <span className="gc-hint">
            Press Enter to send · Shift+Enter for new line
          </span>
          <button
            className="gc-clear-btn"
            onClick={clearChat}
            title="Clear conversation"
          >
            🗑 Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiChat;
