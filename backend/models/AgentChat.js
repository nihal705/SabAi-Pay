// backend/models/AgentChat.js
// Agent Chat model for database operations

const db = require('../config/database');

class AgentChat {
    
    // Create new conversation
    static async createConversation(userId, title = 'New Conversation') {
        const query = `
            INSERT INTO agent_conversations (user_id, title, created_at, updated_at)
            VALUES (?, ?, NOW(), NOW())
        `;
        
        const result = await db.executeQuery(query, [userId, title]);
        
        if (result.success) {
            return {
                success: true,
                data: {
                    id: result.data.insertId,
                    user_id: userId,
                    title
                }
            };
        }
        
        return result;
    }
    
    // Get user conversations
    static async getUserConversations(userId) {
        const query = `
            SELECT * FROM agent_conversations 
            WHERE user_id = ? 
            ORDER BY updated_at DESC
        `;
        return await db.executeQuery(query, [userId]);
    }
    
    // Get conversation by ID
    static async getConversation(conversationId, userId) {
        const query = 'SELECT * FROM agent_conversations WHERE id = ? AND user_id = ?';
        return await db.getOne(query, [conversationId, userId]);
    }
    
    // Update conversation title
    static async updateTitle(conversationId, userId, title) {
        const query = `
            UPDATE agent_conversations 
            SET title = ?, updated_at = NOW() 
            WHERE id = ? AND user_id = ?
        `;
        return await db.executeQuery(query, [title, conversationId, userId]);
    }
    
    // Delete conversation
    static async deleteConversation(conversationId, userId) {
        // First delete all messages in this conversation
        await db.executeQuery(
            'DELETE FROM agent_messages WHERE conversation_id = ?',
            [conversationId]
        );
        
        // Then delete the conversation
        const query = 'DELETE FROM agent_conversations WHERE id = ? AND user_id = ?';
        return await db.executeQuery(query, [conversationId, userId]);
    }
    
    // Add message to conversation
    static async addMessage(conversationId, messageData) {
        const { role, content, intent, metadata } = messageData;
        
        const query = `
            INSERT INTO agent_messages 
            (conversation_id, role, content, intent, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        
        const result = await db.executeQuery(query, [
            conversationId,
            role,
            content,
            intent || null,
            metadata ? JSON.stringify(metadata) : null
        ]);
        
        // Update conversation updated_at
        await db.executeQuery(
            'UPDATE agent_conversations SET updated_at = NOW() WHERE id = ?',
            [conversationId]
        );
        
        if (result.success) {
            return {
                success: true,
                data: {
                    id: result.data.insertId,
                    conversation_id: conversationId,
                    role,
                    content,
                    intent,
                    metadata,
                    created_at: new Date().toISOString()
                }
            };
        }
        
        return result;
    }
    
    // Get conversation messages
    static async getMessages(conversationId, userId) {
        // First verify conversation belongs to user
        const conv = await this.getConversation(conversationId, userId);
        if (!conv.success) {
            return { success: false, error: 'Conversation not found' };
        }
        
        const query = `
            SELECT * FROM agent_messages 
            WHERE conversation_id = ? 
            ORDER BY created_at ASC
        `;
        
        const result = await db.executeQuery(query, [conversationId]);
        
        if (result.success) {
            // Parse metadata JSON
            const messages = result.data.map(msg => ({
                ...msg,
                metadata: msg.metadata ? JSON.parse(msg.metadata) : null
            }));
            
            return { success: true, data: messages };
        }
        
        return result;
    }
    
    // Search conversations
    static async searchConversations(userId, searchTerm) {
        const query = `
            SELECT DISTINCT c.* 
            FROM agent_conversations c
            LEFT JOIN agent_messages m ON c.id = m.conversation_id
            WHERE c.user_id = ? 
                AND (c.title LIKE ? OR m.content LIKE ?)
            ORDER BY c.updated_at DESC
        `;
        
        const searchPattern = `%${searchTerm}%`;
        return await db.executeQuery(query, [userId, searchPattern, searchPattern]);
    }
    
    // Get conversation summary
    static async getSummary(conversationId, userId) {
        const query = `
            SELECT 
                COUNT(*) as message_count,
                MIN(created_at) as first_message,
                MAX(created_at) as last_message,
                SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_messages,
                SUM(CASE WHEN role = 'agent' THEN 1 ELSE 0 END) as agent_messages
            FROM agent_messages 
            WHERE conversation_id = ?
        `;
        
        const result = await db.getOne(query, [conversationId]);
        
        // Verify conversation belongs to user
        const conv = await this.getConversation(conversationId, userId);
        if (!conv.success) {
            return { success: false, error: 'Conversation not found' };
        }
        
        return result;
    }
}

module.exports = AgentChat;