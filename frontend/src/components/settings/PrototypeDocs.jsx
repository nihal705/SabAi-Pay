// frontend/src/components/settings/PrototypeDocs.jsx
// A "how this works" page for curious testers.

import React from "react";
import { motion } from "framer-motion";
import {
  FaRobot, FaShieldAlt, FaFlask, FaCode, FaBook,
  FaExclamationTriangle, FaQuestionCircle,
} from "react-icons/fa";
import PrototypeBanner from "../common/PrototypeBanner";

const PrototypeDocs = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="prototype-docs"
      style={{ maxWidth: 820, margin: "0 auto", padding: "0 16px 40px" }}
    >
      <PrototypeBanner />

      <div style={{ padding: "24px 0" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8 }}>
          About This Prototype
        </h1>
        <p style={{ color: "#6b7280", marginBottom: 24 }}>
          A short guide for testers. Please read before exploring the app.
        </p>

        <Section icon={<FaRobot />} title="What is SabAI Pay?">
          <p>
            SabAI Pay is a research prototype exploring one question:{" "}
            <strong>
              can an AI agent participate in payments without ever having
              authority over money movement?
            </strong>
          </p>
          <p>
            Real-world agentic payment systems are being built right now by
            NPCI (Agent Pay), Mastercard, Visa, OpenAI, and Anthropic. All of
            them face the same open problems: consent, liability, and
            auditability.
          </p>
          <p>
            This prototype demonstrates one possible answer: separate the AI
            (which proposes) from a deterministic policy engine (which
            authorizes) and a payment engine (which executes).
          </p>
        </Section>

        <Section icon={<FaShieldAlt />} title="The Separation Principle">
          <pre style={{
            background: "#f8fafc", padding: 16, borderRadius: 12,
            fontSize: "0.85rem", overflowX: "auto",
          }}>
{`AI proposes  →  Policy authorizes  →  Engine executes
(probabilistic)   (deterministic)      (transactional)`}
          </pre>
          <p>
            Most agentic-payment discussions focus on "how smart is the AI." The
            smarter question is: <strong>how deterministic is the authorization?</strong>
          </p>
        </Section>

        <Section icon={<FaQuestionCircle />} title="What Works Today">
          <ul>
            <li>Register / login with phone + password or OTP</li>
            <li>Add mock bank accounts with simulated balances</li>
            <li>Set per-bank UPI PINs (bcrypt-hashed, never stored plain)</li>
            <li>Pay simulated bills with UPI PIN, Reserve Pay, or SabAI Gems</li>
            <li>Recharge mobile (Airtel / Jio / Vi / BSNL mock plans)</li>
            <li>Send / request money to mock contacts and UPI IDs</li>
            <li>Chat with SabAI Assistant to order from mock merchants</li>
            <li>Set Reserve Pay limits per merchant (monthly + per-transaction)</li>
            <li>Earn 5% SabAI Gems cashback on successful payments</li>
            <li>View transaction history, exports, and analytics</li>
          </ul>
        </Section>

        <Section icon={<FaExclamationTriangle />} title="What Does NOT Work">
          <ul>
            <li>No real UPI. No real bank. No real money.</li>
            <li>No real merchant integrations. All merchant data is mock.</li>
            <li>No real order tracking. Tracking is time-simulated.</li>
            <li>Gemini free tier can hit rate limits — the AI may pause.</li>
            <li>Voice input works in Chrome/Edge, not Firefox.</li>
          </ul>
        </Section>

        <Section icon={<FaCode />} title="Tech Stack">
          <ul>
            <li>Backend: Node.js, Express, Supabase (Postgres)</li>
            <li>AI: Google Gemini (free tier) with function calling</li>
            <li>Frontend: React 18, Framer Motion, Recharts</li>
            <li>Payments sandbox: Razorpay test mode</li>
          </ul>
        </Section>

        <Section icon={<FaBook />} title="Why This Matters">
          <p>
            If the pattern demonstrated here — <em>AI proposes; deterministic
            policy authorizes</em> — is correct, then agentic payments can be
            both intelligent and safe. That is a genuinely open question, and
            this prototype is a small contribution to it.
          </p>
        </Section>

        <div style={{
          marginTop: 32, padding: 16, background: "#fef3c7",
          borderRadius: 12, borderLeft: "4px solid #f59e0b",
          fontSize: "0.85rem", color: "#78350f",
        }}>
          <strong>Reminder:</strong> This is a college prototype. It is not
          affiliated with NPCI, UPI, Razorpay, OpenAI, Anthropic, Mastercard,
          Visa, or any bank. If you find it useful, please reach out — I'd love
          to hear what you think.
        </div>
      </div>
    </motion.div>
  );
};

const Section = ({ icon, title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{
      fontSize: "1.15rem", fontWeight: 700, marginBottom: 10,
      display: "flex", alignItems: "center", gap: 10, color: "#1a1d2e",
    }}>
      <span style={{ color: "#4f46e5" }}>{icon}</span>
      {title}
    </h2>
    <div style={{ color: "#4b5563", lineHeight: 1.7, fontSize: "0.92rem" }}>
      {children}
    </div>
  </div>
);

export default PrototypeDocs;