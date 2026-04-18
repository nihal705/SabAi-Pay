import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer,
  loading = false
}) => {
  const sizes = {
    small: 'modal-small',
    medium: 'modal-medium',
    large: 'modal-large',
    full: 'modal-full'
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
            className={`modal-container ${sizes[size]}`}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <h2 className="modal-title">{title}</h2>
              {showCloseButton && (
                <button
                  className="modal-close-btn"
                  onClick={onClose}
                  disabled={loading}
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Modal Content */}
            <div className="modal-content">
              {children}
            </div>

            {/* Modal Footer */}
            {footer && (
              <div className="modal-footer">
                {footer}
              </div>
            )}

            {/* Loading Overlay */}
            {loading && (
              <div className="modal-loading-overlay">
                <div className="loading-spinner"></div>
                <p>Processing...</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Confirmation Modal Component
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  loading = false
}) => {
  const types = {
    info: {
      icon: 'ℹ️',
      confirmVariant: 'primary',
      iconClass: 'info-icon'
    },
    warning: {
      icon: '⚠️',
      confirmVariant: 'warning',
      iconClass: 'warning-icon'
    },
    danger: {
      icon: '❗',
      confirmVariant: 'danger',
      iconClass: 'danger-icon'
    },
    success: {
      icon: '✅',
      confirmVariant: 'success',
      iconClass: 'success-icon'
    }
  };

  const currentType = types[type] || types.info;

  const footer = (
    <div className="confirm-modal-footer">
      <Button
        variant="secondary"
        onClick={onClose}
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button
        variant={currentType.confirmVariant}
        onClick={onConfirm}
        loading={loading}
      >
        {confirmText}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      footer={footer}
      closeOnOverlayClick={!loading}
    >
      <div className="confirm-modal-content">
        <div className={`confirm-icon ${currentType.iconClass}`}>
          {currentType.icon}
        </div>
        <p className="confirm-message">{message}</p>
      </div>
    </Modal>
  );
};

// Success Modal Component
export const SuccessModal = ({
  isOpen,
  onClose,
  title = 'Success!',
  message,
  buttonText = 'Done'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      footer={
        <Button variant="success" onClick={onClose} fullWidth>
          {buttonText}
        </Button>
      }
    >
      <div className="success-modal-content">
        <div className="success-icon">✅</div>
        <p className="success-message">{message}</p>
      </div>
    </Modal>
  );
};

// Error Modal Component
export const ErrorModal = ({
  isOpen,
  onClose,
  title = 'Error',
  message,
  errorDetails,
  buttonText = 'Close'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="medium"
      footer={
        <Button variant="danger" onClick={onClose} fullWidth>
          {buttonText}
        </Button>
      }
    >
      <div className="error-modal-content">
        <div className="error-icon">❌</div>
        <p className="error-message">{message}</p>
        {errorDetails && (
          <details className="error-details">
            <summary>Technical Details</summary>
            <pre>{errorDetails}</pre>
          </details>
        )}
      </div>
    </Modal>
  );
};

export default Modal;