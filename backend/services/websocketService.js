// backend/services/websocketService.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketService {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Map(); // userId -> Set of WebSocket connections
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            // Get token from query params
            const url = new URL(req.url, 'http://localhost');
            const token = url.searchParams.get('token');
            
            if (!token) {
                ws.close(1008, 'Unauthorized');
                return;
            }

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const userId = decoded.id;

                // Store connection
                if (!this.clients.has(userId)) {
                    this.clients.set(userId, new Set());
                }
                this.clients.get(userId).add(ws);

                // Send welcome message
                ws.send(JSON.stringify({
                    type: 'connected',
                    message: 'Connected to SabAI Pay WebSocket',
                    timestamp: new Date().toISOString()
                }));

                // Handle incoming messages
                ws.on('message', (message) => {
                    try {
                        const data = JSON.parse(message);
                        this.handleMessage(userId, data);
                    } catch (error) {
                        console.error('WebSocket message error:', error);
                    }
                });

                // Handle disconnection
                ws.on('close', () => {
                    this.clients.get(userId)?.delete(ws);
                    if (this.clients.get(userId)?.size === 0) {
                        this.clients.delete(userId);
                    }
                });

            } catch (error) {
                console.error('WebSocket auth error:', error);
                ws.close(1008, 'Unauthorized');
            }
        });
    }

    handleMessage(userId, data) {
        switch (data.type) {
            case 'ping':
                this.sendToUser(userId, { type: 'pong', timestamp: Date.now() });
                break;
            case 'get_balance':
                this.sendBalanceUpdate(userId);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    // Send real-time balance update
    async sendBalanceUpdate(userId) {
        try {
            const dbService = require('./databaseService');
            const balance = await dbService.getUserBalance(userId);
            
            this.sendToUser(userId, {
                type: 'balance_update',
                data: balance,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Balance update error:', error);
        }
    }

    // Send notification to user
    sendNotification(userId, notification) {
        this.sendToUser(userId, {
            type: 'notification',
            data: notification,
            timestamp: new Date().toISOString()
        });
    }

    // Send transaction update
    sendTransactionUpdate(userId, transaction) {
        this.sendToUser(userId, {
            type: 'transaction_update',
            data: transaction,
            timestamp: new Date().toISOString()
        });
    }

    // Send to specific user
    sendToUser(userId, data) {
        const userConnections = this.clients.get(userId);
        if (userConnections) {
            const message = JSON.stringify(data);
            userConnections.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(message);
                }
            });
        }
    }

    // Broadcast to all users
    broadcast(data) {
        const message = JSON.stringify(data);
        this.wss.clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
}

module.exports = WebSocketService;