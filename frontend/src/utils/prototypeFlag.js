// frontend/src/utils/prototypeFlag.js
// Central flag for prototype-only behavior.
// Set REACT_APP_PROTOTYPE_MODE=true in .env to enable.

export const isPrototypeMode = () => {
  const envValue = process.env.REACT_APP_PROTOTYPE_MODE;
  if (envValue === undefined) return true; // default ON for safety
  return String(envValue).toLowerCase() === "true";
};

export const PROTOTYPE_DISCLAIMER_VERSION = "v1.0-2026-03";
export const PROTOTYPE_DISCLAIMER_KEY = `sabai_disclaimer_accepted_${PROTOTYPE_DISCLAIMER_VERSION}`;

export const hasAcceptedDisclaimer = () => {
  try {
    return localStorage.getItem(PROTOTYPE_DISCLAIMER_KEY) === "true";
  } catch {
    return false;
  }
};

export const markDisclaimerAccepted = () => {
  try {
    localStorage.setItem(PROTOTYPE_DISCLAIMER_KEY, "true");
  } catch {
    // ignore storage errors
  }
};