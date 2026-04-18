import { VALIDATION, ERROR_MESSAGES } from './constants';

// Validate phone number (Indian)
export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length !== 10) {
    return { isValid: false, error: 'Phone number must be 10 digits' };
  }
  
  if (!VALIDATION.PHONE_REGEX.test(cleaned)) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_PHONE };
  }
  
  return { isValid: true };
};

// Validate email
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: true }; // Email is optional
  }
  
  if (!VALIDATION.EMAIL_REGEX.test(email)) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_EMAIL };
  }
  
  return { isValid: true };
};

// Validate UPI ID
export const validateUpiId = (vpa) => {
  if (!vpa) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  if (!VALIDATION.UPI_ID_REGEX.test(vpa)) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_UPI };
  }
  
  return { isValid: true };
};

// Validate IFSC code
export const validateIfsc = (ifsc) => {
  if (!ifsc) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  const cleaned = ifsc.toUpperCase().replace(/\s/g, '');
  
  if (!VALIDATION.IFSC_REGEX.test(cleaned)) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_IFSC };
  }
  
  return { isValid: true, cleaned };
};

// Validate account number
export const validateAccountNumber = (accountNumber) => {
  if (!accountNumber) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  const cleaned = accountNumber.replace(/\D/g, '');
  
  if (cleaned.length < 9 || cleaned.length > 18) {
    return { isValid: false, error: 'Account number must be 9-18 digits' };
  }
  
  return { isValid: true, cleaned };
};

// Validate UPI PIN
export const validateUpiPin = (pin) => {
  if (!pin) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  const cleaned = pin.replace(/\D/g, '');
  
  if (cleaned.length !== 4) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_PIN };
  }
  
  return { isValid: true, cleaned };
};

// Validate password
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    return { 
      isValid: false, 
      error: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters` 
    };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  return { isValid: true };
};

// Validate confirm password
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORD_MISMATCH };
  }
  
  return { isValid: true };
};

// Validate amount
export const validateAmount = (amount, min = 1, max = 100000) => {
  if (!amount && amount !== 0) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  const num = Number(amount);
  
  if (isNaN(num) || num <= 0) {
    return { isValid: false, error: 'Enter a valid amount' };
  }
  
  if (num < min) {
    return { isValid: false, error: `Minimum amount is ₹${min}` };
  }
  
  if (num > max) {
    return { isValid: false, error: `Maximum amount is ₹${max.toLocaleString()}` };
  }
  
  return { isValid: true, cleaned: num };
};

// Validate name
export const validateName = (name) => {
  if (!name) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  if (!VALIDATION.NAME_REGEX.test(name)) {
    return { isValid: false, error: 'Name can only contain letters and spaces' };
  }
  
  if (name.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (name.length > 50) {
    return { isValid: false, error: 'Name cannot exceed 50 characters' };
  }
  
  return { isValid: true };
};

// Validate date
export const validateDate = (date, minDate = null, maxDate = null) => {
  if (!date) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }
  
  if (minDate && d < new Date(minDate)) {
    return { isValid: false, error: `Date must be after ${new Date(minDate).toLocaleDateString()}` };
  }
  
  if (maxDate && d > new Date(maxDate)) {
    return { isValid: false, error: `Date must be before ${new Date(maxDate).toLocaleDateString()}` };
  }
  
  return { isValid: true, cleaned: d };
};

// Validate PAN card
export const validatePan = (pan) => {
  if (!pan) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const cleaned = pan.toUpperCase().replace(/\s/g, '');
  
  if (!panRegex.test(cleaned)) {
    return { isValid: false, error: 'Enter a valid PAN number' };
  }
  
  return { isValid: true, cleaned };
};

// Validate Aadhaar
export const validateAadhaar = (aadhaar) => {
  if (!aadhaar) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  const cleaned = aadhaar.replace(/\D/g, '');
  
  if (cleaned.length !== 12) {
    return { isValid: false, error: 'Aadhaar must be 12 digits' };
  }
  
  // Basic validation - check if all digits are same
  if (/^(\d)\1+$/.test(cleaned)) {
    return { isValid: false, error: 'Invalid Aadhaar number' };
  }
  
  return { isValid: true, cleaned };
};

// Validate GST
export const validateGst = (gst) => {
  if (!gst) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
  const cleaned = gst.toUpperCase().replace(/\s/g, '');
  
  if (!gstRegex.test(cleaned)) {
    return { isValid: false, error: 'Enter a valid GST number' };
  }
  
  return { isValid: true, cleaned };
};

// Validate URL
export const validateUrl = (url) => {
  if (!url) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Enter a valid URL' };
  }
};

// Validate pincode
export const validatePincode = (pincode) => {
  if (!pincode) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  const cleaned = pincode.replace(/\D/g, '');
  
  if (cleaned.length !== 6) {
    return { isValid: false, error: 'Pincode must be 6 digits' };
  }
  
  return { isValid: true, cleaned };
};

// Validate checkbox (terms acceptance)
export const validateTerms = (accepted) => {
  if (!accepted) {
    return { isValid: false, error: 'You must accept the terms and conditions' };
  }
  
  return { isValid: true };
};

// Validate file
export const validateFile = (file, allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  if (!file) {
    return { isValid: false, error: 'Please select a file' };
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `File type must be ${allowedTypes.join(', ')}` 
    };
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return { 
      isValid: false, 
      error: `File size must be less than ${maxSizeMB}MB` 
    };
  }
  
  return { isValid: true };
};

// Validate image
export const validateImage = (file, maxWidth = 2000, maxHeight = 2000) => {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ isValid: false, error: 'Please select an image' });
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      if (img.width > maxWidth || img.height > maxHeight) {
        resolve({ 
          isValid: false, 
          error: `Image dimensions must be ${maxWidth}x${maxHeight} or less` 
        });
      } else {
        resolve({ isValid: true });
      }
    };
    img.onerror = () => {
      resolve({ isValid: false, error: 'Invalid image file' });
    };
    img.src = URL.createObjectURL(file);
  });
};

// Validate search query
export const validateSearchQuery = (query, minLength = 2) => {
  if (!query) {
    return { isValid: false, error: 'Please enter a search term' };
  }
  
  const cleaned = query.trim();
  
  if (cleaned.length < minLength) {
    return { isValid: false, error: `Search term must be at least ${minLength} characters` };
  }
  
  return { isValid: true, cleaned };
};

// Validate OTP
export const validateOtp = (otp) => {
  if (!otp) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  const cleaned = otp.replace(/\D/g, '');
  
  if (cleaned.length !== 6) {
    return { isValid: false, error: 'OTP must be 6 digits' };
  }
  
  return { isValid: true, cleaned };
};

// Validate month/year (for card expiry)
export const validateExpiryMonthYear = (month, year) => {
  if (!month || !year) {
    return { isValid: false, error: 'Expiry date is required' };
  }
  
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  
  const m = parseInt(month);
  const y = parseInt(year);
  
  if (m < 1 || m > 12) {
    return { isValid: false, error: 'Invalid month' };
  }
  
  if (y < currentYear || (y === currentYear && m < currentMonth)) {
    return { isValid: false, error: 'Card has expired' };
  }
  
  if (y > currentYear + 10) {
    return { isValid: false, error: 'Invalid expiry year' };
  }
  
  return { isValid: true };
};

// Validate CVV
export const validateCvv = (cvv) => {
  if (!cvv) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  const cleaned = cvv.replace(/\D/g, '');
  
  if (cleaned.length !== 3 && cleaned.length !== 4) {
    return { isValid: false, error: 'CVV must be 3 or 4 digits' };
  }
  
  return { isValid: true, cleaned };
};

// Validate range
export const validateRange = (value, min, max) => {
  if (value === null || value === undefined) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
  }
  
  if (value < min) {
    return { isValid: false, error: `Value must be at least ${min}` };
  }
  
  if (value > max) {
    return { isValid: false, error: `Value cannot exceed ${max}` };
  }
  
  return { isValid: true };
};

export default {
  validatePhone,
  validateEmail,
  validateUpiId,
  validateIfsc,
  validateAccountNumber,
  validateUpiPin,
  validatePassword,
  validateConfirmPassword,
  validateAmount,
  validateName,
  validateDate,
  validatePan,
  validateAadhaar,
  validateGst,
  validateUrl,
  validatePincode,
  validateTerms,
  validateFile,
  validateImage,
  validateSearchQuery,
  validateOtp,
  validateExpiryMonthYear,
  validateCvv,
  validateRange
};