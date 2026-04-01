import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useState } from "react";

const PaymentForm = ({ clientSecret, onSuccess, onCancel, amount = 0 }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [cardError, setCardError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCardChange = (event) => {
    // Show card validation errors
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
  };

  const getErrorIcon = (errorType) => {
    const errorMap = {
      card_error: "💳",
      validation_error: "⚠️",
      api_error: "🔗",
      rate_limit_error: "⏱️",
      authentication_error: "🔐",
      invalid_request_error: "❌",
    };
    return errorMap[errorType] || "❌";
  };

  const getErrorTitle = (errorType) => {
    const titleMap = {
      card_error: "Card Error",
      validation_error: "Invalid Input",
      api_error: "Connection Error",
      rate_limit_error: "Too Many Attempts",
      authentication_error: "Authentication Failed",
      invalid_request_error: "Request Failed",
    };
    return titleMap[errorType] || "Payment Error";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (!stripe || !elements) {
      setError({
        type: "api_error",
        message: "Payment system not loaded. Please refresh the page.",
      });
      setLoading(false);
      return;
    }

    if (cardError) {
      setError({
        type: "validation_error",
        message: cardError,
      });
      setLoading(false);
      return;
    }

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
        },
      });

      if (result.error) {
        // Handle payment error from Stripe
        setError({
          type: result.error.type || "card_error",
          message: result.error.message,
          code: result.error.code,
        });
        setLoading(false);
      } else if (
        result.paymentIntent &&
        result.paymentIntent.status === "succeeded"
      ) {
        // Payment succeeded
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else if (result.paymentIntent) {
        // Payment intent exists but not succeeded
        setError({
          type: "invalid_request_error",
          message: `Payment could not be completed. Status: ${result.paymentIntent.status}`,
        });
        setLoading(false);
      }
    } catch (err) {
      setError({
        type: "api_error",
        message: err.message || "An unexpected error occurred during payment",
      });
      setLoading(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        fontSize: "15px",
        color: "#1e293b",
        fontFamily: "'Sora', 'DM Sans', sans-serif",
        fontSmoothing: "antialiased",
        "::placeholder": {
          color: "#94a3b8",
        },
        padding: "0",
      },
      invalid: {
        color: "#dc2626",
        iconColor: "#dc2626",
      },
      complete: {
        color: "#0a3d62",
        iconColor: "#10b981",
      },
    },
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 61, 98, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(2px)",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(10, 61, 98, 0.3)",
          width: "100%",
          maxWidth: "440px",
          padding: "0",
          overflow: "hidden",
          animation: "slideUp 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0a3d62 0%, #1a6fa0 100%)",
            padding: "32px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              margin: "0 auto 16px",
              backgroundColor: "rgba(255,255,255,0.18)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(6px)",
            }}
          >
            <img
              src="/src/assets/favicon.png"
              alt="MediConnect"
              style={{
                width: "40px",
                height: "40px",
                objectFit: "contain",
              }}
            />
          </div>
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: "24px",
              fontWeight: "700",
              color: "#ffffff",
              fontFamily: "'Sora', sans-serif",
              letterSpacing: "-0.3px",
            }}
          >
            Secure Payment
          </h2>
          <p
            style={{
              margin: "0",
              fontSize: "13px",
              color: "rgba(255,255,255,0.85)",
              fontWeight: "400",
            }}
          >
            Complete your appointment booking
          </p>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Amount Display */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              padding: "16px",
              borderRadius: "10px",
              border: "1px solid #e4eaf0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ color: "#7a8fa6", fontSize: "14px", fontWeight: "500" }}
            >
              Amount to Pay
            </span>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#0a3d62",
              }}
            >
              LKR {parseFloat(amount).toFixed(2)}
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                backgroundColor: "#fff5f5",
                border: "1.5px solid #fc8181",
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                gap: "12px",
                animation: "shake 0.3s ease-out",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {getErrorIcon(error.type)}
              </span>
              <div style={{ flex: 1 }}>
                <h4
                  style={{
                    margin: "0 0 4px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#c53030",
                  }}
                >
                  {getErrorTitle(error.type)}
                </h4>
                <p
                  style={{
                    margin: "0",
                    fontSize: "12px",
                    color: "#9b2c2c",
                    lineHeight: "1.4",
                  }}
                >
                  {error.message}
                  {error.code && (
                    <span
                      style={{
                        display: "block",
                        marginTop: "4px",
                        opacity: 0.7,
                      }}
                    >
                      Code: {error.code}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Card Error */}
          {cardError && !error && (
            <div
              style={{
                backgroundColor: "#fef3c7",
                border: "1.5px solid #fbd38d",
                borderRadius: "10px",
                padding: "12px 14px",
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "16px" }}>⚠️</span>
              <p
                style={{
                  margin: "0",
                  fontSize: "12px",
                  color: "#92400e",
                }}
              >
                {cardError}
              </p>
            </div>
          )}

          {/* Card Input */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "600",
                color: "#3a5068",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Card Details
            </label>
            <div
              style={{
                padding: "14px 16px",
                border: cardError
                  ? "1.5px solid #dc2626"
                  : "1.5px solid #dde5ee",
                borderRadius: "9px",
                backgroundColor: "#fafdff",
                transition: "all 0.2s",
              }}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
  
                    {/* Card Number */}
                    <div>
                        <label className="label">Card Number</label>
                        <div className="inputBox">
                        <CardNumberElement options={cardStyle} onChange={handleCardChange} />
                        </div>
                    </div>

                    {/* Expiry + CVC row */}
                    <div style={{ display: "flex", gap: "12px" }}>
                        
                        <div style={{ flex: 1 }}>
                        <label className="label">Expiry Date</label>
                        <div className="inputBox">
                            <CardExpiryElement options={cardStyle} onChange={handleCardChange} />
                        </div>
                        </div>

                        <div style={{ flex: 1 }}>
                        <label className="label">CVC</label>
                        <div className="inputBox">
                            <CardCvcElement options={cardStyle} onChange={handleCardChange} />
                        </div>
                        </div>

                    </div>
                </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div
              style={{
                backgroundColor: "#f0fdf4",
                border: "1.5px solid #86efac",
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                gap: "12px",
                alignItems: "center",
                animation: "scaleIn 0.4s ease-out",
              }}
            >
              <span style={{ fontSize: "20px" }}>✓</span>
              <div>
                <h4
                  style={{
                    margin: "0 0 2px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#166534",
                  }}
                >
                  Payment Successful
                </h4>
                <p
                  style={{
                    margin: "0",
                    fontSize: "12px",
                    color: "#15803d",
                  }}
                >
                  Your appointment has been confirmed
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "8px",
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              disabled={loading || success}
              style={{
                flex: 1,
                padding: "12px 16px",
                backgroundColor: "#f0f4f8",
                color: "#0a3d62",
                border: "1.5px solid #dde5ee",
                borderRadius: "9px",
                fontFamily: "'Sora', sans-serif",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loading || success ? "not-allowed" : "pointer",
                opacity: loading || success ? 0.6 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!loading && !success) {
                  e.target.style.backgroundColor = "#e4eaf0";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && !success) {
                  e.target.style.backgroundColor = "#f0f4f8";
                }
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || loading || success || cardError}
              style={{
                flex: 1,
                padding: "12px 16px",
                background:
                  !stripe || loading || success || cardError
                    ? "#cbd5e1"
                    : "linear-gradient(135deg, #0a3d62 0%, #1a6fa0 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "9px",
                fontFamily: "'Sora', sans-serif",
                fontSize: "14px",
                fontWeight: "700",
                cursor:
                  !stripe || loading || success || cardError
                    ? "not-allowed"
                    : "pointer",
                letterSpacing: "0.3px",
                transition: "all 0.2s",
                boxShadow:
                  !stripe || loading || success || cardError
                    ? "none"
                    : "0 4px 12px rgba(10, 61, 98, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!loading && stripe && !success && !cardError) {
                  e.target.style.boxShadow = "0 6px 16px rgba(10, 61, 98, 0.4)";
                  e.target.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && stripe && !success && !cardError) {
                  e.target.style.boxShadow = "0 4px 12px rgba(10, 61, 98, 0.3)";
                  e.target.style.transform = "translateY(0)";
                }
              }}
            >
              {loading
                ? "Processing..."
                : success
                  ? "Completed"
                  : `Pay LKR ${parseFloat(amount).toFixed(2)}`}
            </button>
          </div>

          {/* Stripe Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginTop: "8px",
              padding: "12px",
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            <span>🔒</span>
            <span>
              Secured by <strong style={{ color: "#0a3d62" }}>Stripe</strong>
            </span>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentForm;
