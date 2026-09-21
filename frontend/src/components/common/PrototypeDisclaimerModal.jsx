// frontend/src/components/common/PrototypeDisclaimerModal.jsx
// Blocking modal shown once per browser (per disclaimer version).
// Must be acknowledged before the app is usable.

import React, { useState, useEffect } from "react";
import {
  isPrototypeMode,
  hasAcceptedDisclaimer,
  markDisclaimerAccepted,
} from "../../utils/prototypeFlag";
import "./PrototypeDisclaimerModal.css";

const COUNTDOWN_SECONDS = 5;

const PrototypeDisclaimerModal = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (!isPrototypeMode()) return;
    if (!hasAcceptedDisclaimer()) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, secondsLeft]);

  const handleAccept = () => {
    if (!agreed || secondsLeft > 0) return;
    markDisclaimerAccepted();
    setOpen(false);
  };

  // Render children regardless; overlay blocks interaction when open.
  return (
    <>
      {children}
      {open && (
        <div className="pdm-overlay" role="dialog" aria-modal="true">
          <div className="pdm-modal">
            <div className="pdm-header">
              <h2>
                SabAI Pay — Prototype Disclaimer
              </h2>
              <p>Please read fully before continuing.</p>
            </div>

            <div className="pdm-body">
              <div className="pdm-highlight">
                <strong>This is a prototype.</strong> It is not a real payment
                service. No money moves. No real UPI. No real bank. Ever.
              </div>

              <h3>What this IS</h3>
              <ul>
                <li>A student research prototype demonstrating how AI-agent payments could work.</li>
                <li>A demo of policy-controlled agentic payment architecture.</li>
                <li>A learning tool for understanding Agent Pay + Reserve Pay concepts.</li>
              </ul>

              <h3>What this is NOT</h3>
              <ul>
                <li>Not affiliated with, endorsed by, or connected to NPCI, UPI, Razorpay, OpenAI, Anthropic, Mastercard, Visa, Google, or any bank.</li>
                <li>Not regulated by RBI or any financial authority.</li>
                <li>Not safe for real money, real UPI IDs, or real bank accounts.</li>
              </ul>

              <h3>About money in this app</h3>
              <ul>
                <li>All balances, wallets, and bank accounts are simulated.</li>
                <li>We strongly recommend using dummy data only (e.g., <code>9876543210@sbi</code>, <code>1234567890</code>, <code>IFSC0000001</code>).</li>
                <li>If you do enter real data, it will only be stored as text in our database. No transaction will occur. But we recommend you don't.</li>
              </ul>

              <h3>About the AI</h3>
              <ul>
                <li>Powered by Google Gemini's free tier. May hit rate limits and pause.</li>
                <li>Responses are non-deterministic. Same input can give different outputs.</li>
                <li>Do not rely on AI output for anything real.</li>
              </ul>

              <h3>Risks</h3>
              <ul>
                <li>Data may be deleted at any time without notice.</li>
                <li>The app may be taken offline for maintenance or permanently.</li>
                <li>This is a college prototype. The developer is not liable for any outcome.</li>
              </ul>

              <h3>Purpose</h3>
              <p>
                Learning how Agent Pay works, portfolio demonstration, and
                research into policy-controlled agentic payments.
              </p>

              <div className="pdm-accept-row" onClick={() => setAgreed(!agreed)}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span>
                  I understand this is a prototype, that all money is fake, that
                  this is not a real payment app, and that I use it at my own
                  risk. I will not hold the developer liable for any outcome.
                </span>
              </div>
            </div>

            <div className="pdm-footer">
              <span className="pdm-timer">
                {secondsLeft > 0
                  ? `Please read — buttons unlock in ${secondsLeft}s`
                  : "You may now continue"}
              </span>
              <button
                className="pdm-btn secondary"
                onClick={() => window.location.assign("https://www.google.com")}
              >
                Exit
              </button>
              <button
                className="pdm-btn primary"
                onClick={handleAccept}
                disabled={!agreed || secondsLeft > 0}
              >
                I Understand — Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PrototypeDisclaimerModal;