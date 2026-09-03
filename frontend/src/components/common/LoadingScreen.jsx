// frontend/src/components/common/LoadingScreen.jsx
import React, { useEffect, useState } from "react";
import "./LoadingScreen.css";
import { useTheme } from "../../context/ThemeContext";

const LoadingScreen = ({ minimumDisplayTime = 2000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { darkMode } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, minimumDisplayTime);

    return () => clearTimeout(timer);
  }, [minimumDisplayTime]);

  if (!isVisible) return null;

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="logo-container">
          <img
            src="/images/merchants/sabailogo.png"
            alt="SabAI Pay"
            className="loading-logo"
          />
        </div>

        <div className="loading-title">
          <div className="logo-wrapper-loading">
            <span className="logo-sab-loading">
              <span className="sa-loading">Sa</span>
              <span className="b-loading">b</span>
            </span>
            <span className="logo-ai-loading">AI</span>
            <span className="logo-pay-loading">Pay</span>
          </div>
        </div>

        <div className="loading-tagline"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
