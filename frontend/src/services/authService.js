import { apiService } from './api';

class AuthService {
  constructor() {
    this.baseUrl = '/auth';
  }

  // User registration
  async register(userData) {
    try {
      const response = await apiService.post(`${this.baseUrl}/register`, userData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  // User login
  async login(phoneNumber, password) {
    try {
      const response = await apiService.post(`${this.baseUrl}/login`, {
        phone_number: phoneNumber,
        password
      });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  // Verify OTP
  async verifyOTP(phoneNumber, otp) {
    try {
      const response = await apiService.post(`${this.baseUrl}/verify-otp`, {
        phone_number: phoneNumber,
        otp
      });
      
      if (response.success) {
        // Store token
        localStorage.setItem('token', response.data.token);
      }
      
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Verification failed'
      };
    }
  }

  // Resend OTP
  async resendOTP(phoneNumber) {
    try {
      const response = await apiService.post(`${this.baseUrl}/resend-otp`, {
        phone_number: phoneNumber
      });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to resend OTP'
      };
    }
  }

  // Get current user profile
  async getProfile() {
    try {
      const response = await apiService.get(`${this.baseUrl}/profile`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch profile'
      };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiService.put(`${this.baseUrl}/profile`, profileData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to update profile'
      };
    }
  }

  // Upload profile picture
  async uploadProfilePicture(file) {
    try {
      const response = await apiService.upload(`${this.baseUrl}/profile/picture`, file, 'profile_pic');
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to upload picture'
      };
    }
  }

  // Set UPI PIN
  async setUpiPin(pin, confirmPin) {
    try {
      const response = await apiService.post(`${this.baseUrl}/set-pin`, {
        pin,
        confirm_pin: confirmPin
      });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to set UPI PIN'
      };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword, confirmPassword) {
    try {
      const response = await apiService.post(`${this.baseUrl}/change-password`, {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to change password'
      };
    }
  }

  // Update monthly limit
  async updateMonthlyLimit(limit) {
    try {
      const response = await apiService.put(`${this.baseUrl}/monthly-limit`, {
        monthly_limit: limit
      });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to update limit'
      };
    }
  }

  // Get user notifications
  async getNotifications(page = 1, limit = 20) {
    try {
      const response = await apiService.get(`${this.baseUrl}/notifications`, {
        page,
        limit
      });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch notifications'
      };
    }
  }

  // Mark notification as read
  async markNotificationRead(notificationId) {
    try {
      const response = await apiService.put(`${this.baseUrl}/notifications/${notificationId}/read`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to mark notification as read'
      };
    }
  }

  // Mark all notifications as read
  async markAllNotificationsRead() {
    try {
      const response = await apiService.put(`${this.baseUrl}/notifications/read-all`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to mark all as read'
      };
    }
  }

  // Get user stats
  async getUserStats() {
    try {
      const response = await apiService.get(`${this.baseUrl}/stats`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch stats'
      };
    }
  }

  // Delete account
  async deleteAccount() {
    try {
      const response = await apiService.delete(`${this.baseUrl}/account`);
      
      if (response.success) {
        localStorage.removeItem('token');
      }
      
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to delete account'
      };
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      const response = await apiService.post(`${this.baseUrl}/refresh-token`);
      
      if (response.success) {
        localStorage.setItem('token', response.data.token);
      }
      
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to refresh token'
      };
    }
  }

  // Logout
  logout() {
    localStorage.removeItem('token');
    // Clear any other stored data
    localStorage.removeItem('login_phone');
    localStorage.removeItem('login_otp');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  // Get stored token
  getToken() {
    return localStorage.getItem('token');
  }
}

export default new AuthService();