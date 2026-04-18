import { apiService } from './api';

class AgentService {
  constructor() {
    this.baseUrl = '/agent';
  }

  // Send message to AI agent
  async sendMessage(message, conversationId = null) {
    try {
      const response = await apiService.post(`${this.baseUrl}/chat`, {
        message,
        conversation_id: conversationId
      });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to send message'
      };
    }
  }

  // Get smart suggestions
  async getSuggestions() {
    try {
      const response = await apiService.get(`${this.baseUrl}/suggestions`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get suggestions'
      };
    }
  }

  // Analyze spending
  async analyzeSpending(period = 'month') {
    try {
      const response = await apiService.get(`${this.baseUrl}/analyze-spending`, { period });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to analyze spending'
      };
    }
  }

  // Process order from agent
  async processOrder(orderData) {
    try {
      const response = await apiService.post(`${this.baseUrl}/process-order`, orderData);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to process order'
      };
    }
  }

  // Approve agent transaction
  async approveTransaction(agentTxnId, action) {
    try {
      const response = await apiService.post(`${this.baseUrl}/approve/${agentTxnId}`, {
        action
      });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to approve transaction'
      };
    }
  }

  // Get pending approvals
  async getPendingApprovals() {
    try {
      const response = await apiService.get(`${this.baseUrl}/pending-approvals`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch pending approvals'
      };
    }
  }

  // Get agent transaction history
  async getAgentHistory(page = 1, limit = 20) {
    try {
      const response = await apiService.get(`${this.baseUrl}/history`, { page, limit });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch agent history'
      };
    }
  }

  // Check AI status
  async getAIStatus() {
    try {
      const response = await apiService.get(`${this.baseUrl}/status`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to check AI status'
      };
    }
  }

  // Get conversation history
  async getConversationHistory(conversationId) {
    try {
      const response = await apiService.get(`${this.baseUrl}/conversation/${conversationId}`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch conversation'
      };
    }
  }

  // Clear conversation
  async clearConversation(conversationId) {
    try {
      const response = await apiService.delete(`${this.baseUrl}/conversation/${conversationId}`);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to clear conversation'
      };
    }
  }

  // Rate conversation
  async rateConversation(conversationId, rating, feedback = '') {
    try {
      const response = await apiService.post(`${this.baseUrl}/conversation/${conversationId}/rate`, {
        rating,
        feedback
      });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to submit rating'
      };
    }
  }

  // Get quick replies based on context
  async getQuickReplies(context) {
    try {
      const response = await apiService.post(`${this.baseUrl}/quick-replies`, { context });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get quick replies'
      };
    }
  }

  // Voice to text conversion (mock)
  async voiceToText(audioBlob) {
    try {
      const response = await apiService.upload(`${this.baseUrl}/voice-to-text`, audioBlob, 'audio');
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Voice processing failed'
      };
    }
  }

  // Get intent from text
  async detectIntent(text) {
    try {
      const response = await apiService.post(`${this.baseUrl}/detect-intent`, { text });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Intent detection failed'
      };
    }
  }

  // Extract order details from text
  async extractOrderDetails(text) {
    try {
      const response = await apiService.post(`${this.baseUrl}/extract-order`, { text });
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to extract order details'
      };
    }
  }
}

export default new AgentService();