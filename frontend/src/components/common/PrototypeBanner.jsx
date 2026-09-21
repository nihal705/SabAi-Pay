// frontend/src/components/common/PrototypeBanner.jsx
// Persistent non-dismissible banner. Place at the top of pages.

import React from "react";
import { isPrototypeMode } from "../../utils/prototypeFlag";
import "./PrototypeBanner.css";

const PrototypeBanner = () => {
  if (!isPrototypeMode()) return null;

  return (
    <div className="prototype-banner" role="alert">
      <span className="pb-text">
        <span className="pb-tag">PROTOTYPE</span>
        All payments are simulated. Money is fake. Do not use real data.
      </span>
    </div>
  );
};

export default PrototypeBanner;