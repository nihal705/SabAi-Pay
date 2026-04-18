import { apiService } from './api';

class PaymentService {
  constructor() {
    this.baseUrl = '/upi';
  }

  // Get balance
  async getBalance() {
    try {
      const response = await apiService.get(`${this.baseUrl}/balance`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch balance'
      };
    }
  }

  // Send money
  async sendMoney(paymentData) {
    try {
      const response = await apiService.post(`${this.baseUrl}/send`, paymentData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Payment failed'
      };
    }
  }

  // Verify payment
  async verifyPayment(verificationData) {
    try {
      const response = await apiService.post(`${this.baseUrl}/verify-payment`, verificationData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Payment verification failed'
      };
    }
  }

  // Request money
  async requestMoney(requestData) {
    try {
      const response = await apiService.post(`${this.baseUrl}/request`, requestData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Request failed'
      };
    }
  }

  // Get transaction history
  async getTransactions(filters = {}) {
    try {
      const response = await apiService.get('/transactions', filters);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch transactions'
      };
    }
  }

  // Get single transaction
  async getTransaction(transactionId) {
    try {
      const response = await apiService.get(`/transactions/${transactionId}`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch transaction'
      };
    }
  }

  // Get pending requests
  async getPendingRequests() {
    try {
      const response = await apiService.get(`${this.baseUrl}/pending-requests`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch pending requests'
      };
    }
  }

  // Get bank accounts
  async getBankAccounts() {
    try {
      const response = await apiService.get(`${this.baseUrl}/bank-accounts`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch bank accounts'
      };
    }
  }

  // Add bank account
  async addBankAccount(accountData) {
    try {
      const response = await apiService.post(`${this.baseUrl}/bank-accounts`, accountData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to add bank account'
      };
    }
  }

  // Set primary account
  async setPrimaryAccount(accountId) {
    try {
      const response = await apiService.put(`${this.baseUrl}/bank-accounts/${accountId}/primary`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to set primary account'
      };
    }
  }

  // Delete bank account
  async deleteBankAccount(accountId) {
    try {
      const response = await apiService.delete(`${this.baseUrl}/bank-accounts/${accountId}`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to delete bank account'
      };
    }
  }

  // Get contacts
  async getContacts() {
    try {
      const response = await apiService.get(`${this.baseUrl}/contacts`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch contacts'
      };
    }
  }

  // Toggle favorite contact
  async toggleFavoriteContact(contactId) {
    try {
      const response = await apiService.put(`${this.baseUrl}/contacts/${contactId}/favorite`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to toggle favorite'
      };
    }
  }

  // Pay bill
  async payBill(billData) {
    try {
      const response = await apiService.post(`${this.baseUrl}/pay-bill`, billData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Bill payment failed'
      };
    }
  }

  // Mobile recharge
  async mobileRecharge(rechargeData) {
    try {
      const response = await apiService.post(`${this.baseUrl}/recharge`, rechargeData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Recharge failed'
      };
    }
  }

  // Verify UPI ID
  async verifyUPIId(vpa) {
    try {
      const response = await apiService.post(`${this.baseUrl}/verify`, { vpa });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'UPI ID verification failed'
      };
    }
  }

  // Download receipt
  async downloadReceipt(transactionId) {
    try {
      await apiService.download(
        `/transactions/${transactionId}/receipt`,
        `receipt-${transactionId}.pdf`
      );
      return {
        success: true,
        message: 'Receipt downloaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to download receipt'
      };
    }
  }

  // Get transaction stats
  async getTransactionStats(period = 'month') {
    try {
      const response = await apiService.get('/transactions/stats', { period });
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

  // Search transactions
  async searchTransactions(query) {
    try {
      const response = await apiService.get('/transactions/search', { q: query });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Search failed'
      };
    }
  }

  // Get recurring bills
  async getRecurringBills() {
    try {
      const response = await apiService.get('/transactions/bills/recurring');
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch recurring bills'
      };
    }
  }

  // Add recurring bill
  async addRecurringBill(billData) {
    try {
      const response = await apiService.post('/transactions/bills/recurring', billData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to add recurring bill'
      };
    }
  }

  // Delete recurring bill
  async deleteRecurringBill(billId) {
    try {
      const response = await apiService.delete(`/transactions/bills/recurring/${billId}`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to delete recurring bill'
      };
    }
  }
}

export default new PaymentService();