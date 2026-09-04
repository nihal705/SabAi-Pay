// frontend/src/components/chat/VoiceInputButton.jsx
// Voice-to-text input using Web Speech API

import React, { useState, useRef, useEffect } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import toast from "react-hot-toast";
import "./VoiceInputButton.css";

const VoiceInputButton = ({
  onTranscript,
  disabled = false,
  className = "",
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      console.warn("Speech recognition not supported in this browser");
    }
  }, []);

  const startListening = () => {
    if (disabled || !isSupported) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input not supported in this browser");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
        toast.info("Listening... Speak now", {
          id: "voice-listening",
          duration: 3000,
        });
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const displayText = finalTranscript || interimTranscript;
        setTranscript(displayText);

        if (finalTranscript) {
          // Clear any existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          // Send final transcript
          onTranscript(finalTranscript);

          // Stop listening after final result
          recognition.stop();
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        if (event.error === "not-allowed") {
          toast.error(
            "Microphone access denied. Please allow microphone permissions.",
          );
        } else if (event.error === "no-speech") {
          toast.error("No speech detected. Please try again.");
        } else if (event.error === "audio-capture") {
          toast.error("No microphone found. Please connect a microphone.");
        } else {
          toast.error(`Voice error: ${event.error}`);
        }

        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setIsListening(false);
        // If we have an interim transcript and no final, use it after 2 seconds
        if (transcript && !transcript.includes("...")) {
          // Already handled in onresult
        } else if (transcript) {
          // If we only have interim, use it after a timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            if (transcript && !transcript.includes("...")) {
              onTranscript(transcript);
              setTranscript("");
            }
            timeoutRef.current = null;
          }, 2000);
        }
        toast.dismiss("voice-listening");
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error("Voice input error:", error);
      toast.error("Failed to start voice input");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setIsListening(false);
    toast.dismiss("voice-listening");
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      className={`voice-input-btn ${isListening ? "listening" : ""} ${className}`}
      onClick={toggleListening}
      disabled={disabled}
      title={isListening ? "Stop listening" : "Start voice input"}
    >
      {isListening ? (
        <div className="voice-pulse">
          <FaMicrophoneSlash className="voice-icon" />
          <span className="voice-dot"></span>
          <span className="voice-dot"></span>
          <span className="voice-dot"></span>
        </div>
      ) : (
        <FaMicrophone className="voice-icon" />
      )}
    </button>
  );
};

export default VoiceInputButton;
