// backend/server.js
// Main server file for SabAI Pay - COMPLETE WORKING VERSION with MySQL Database

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * 
 * For licensing inquiries: support@sabai-pay.com
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const WebSocketService = require('./services/websocketService');
const agentPaymentRoutes = require('./routes/agentPaymentRoutes');

// Load environment variables
dotenv.config();

const { getSupabase } = require('./config/supabase');

// Import routes
const authRoutes = require('./routes/authRoutes');
const bankRoutes = require('./routes/bankRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const reserveRoutes = require('./routes/reserveRoutes');
const coinRoutes = require('./routes/coinRoutes');
const billRoutes = require('./routes/billRoutes');
const rechargeRoutes = require('./routes/rechargeRoutes');
const contactRoutes = require('./routes/contactRoutes');
const moneyRequestRoutes = require('./routes/moneyRequestRoutes');
const splitRequestRoutes = require('./routes/splitRequestRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const autoPayRoutes = require('./routes/autoPayRoutes');
const agentRoutes = require('./routes/agentRoutes');
const agentOrderRoutes = require('./routes/agentOrderRoutes');
const merchantRoutes = require('./routes/merchantRoutes');
const mlRoutes = require('./routes/mlRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import services
const geminiService = require('./services/geminiChatService');
const cronService = require('./services/cronService');

// Initialize Express app
const app = express();
app.use('/api/agent/payment', agentPaymentRoutes);
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests. Please try again shortly.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many authentication attempts. Please try again later.' } });

// Create HTTP server
const server = http.createServer(app);
const wsService = new WebSocketService(server);
app.set('wsService', wsService);

app.get('/ws-status', (req, res) => {
    res.json({
        success: true,
        clients: wsService.clients.size,
        totalConnections: Array.from(wsService.clients.values()).reduce((acc, set) => acc + set.size, 0)
    });
});

// ============================================
// Middleware Configuration
// ============================================

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
    });
}

// ============================================
// API Routes
// ============================================

// Auth routes are intentionally stricter than normal authenticated API traffic.
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', apiLimiter);

// Bank routes
app.use('/api/bank', bankRoutes);

// Transaction routes
app.use('/api/transactions', transactionRoutes);

// Reserve Pay routes
app.use('/api/reserve', reserveRoutes);

// Coins routes
app.use('/api/coins', coinRoutes);

// Bills routes
app.use('/api/bills', billRoutes);

// Recharge routes
app.use('/api/recharge', rechargeRoutes);

// Contacts routes
app.use('/api/contacts', contactRoutes);

// Money Request routes
app.use('/api/money-requests', moneyRequestRoutes);

// Split Request routes
app.use('/api/split-requests', splitRequestRoutes);

// Challenges routes
app.use('/api/challenges', challengeRoutes);

// Auto-Pay routes
app.use('/api/auto-pay', autoPayRoutes);

// Agent routes
app.use('/api/agent', agentRoutes);
app.use('/api/agent/order', agentOrderRoutes);

// Merchant routes
app.use('/api/merchant', merchantRoutes);

app.use('/api/ml', mlRoutes);
app.use('/api/notifications', notificationRoutes);

if (process.env.NODE_ENV !== 'production') {
app.get('/debug/merchants', async (req, res) => {
    try {
        const merchantService = require('./services/merchantService');
        const merchants = merchantService.getAllMerchants();
        const sampleData = {};
        
        for (let i = 0; i < Math.min(3, merchants.length); i++) {
            const merchant = merchants[i];
            const data = merchantService.getMerchantData(merchant);
            sampleData[merchant] = {
                productsCount: data?.products?.length || 0,
                menuCount: data?.menu?.length || 0,
                restaurantsCount: data?.restaurants?.length || 0
            };
        }
        
        res.json({
            success: true,
            totalMerchants: merchants.length,
            merchants: merchants.slice(0, 10),
            sampleData: sampleData,
            initialized: merchantService.initialized
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});
}

// ============================================
// Health Check Route
// ============================================
app.get('/health', async (req, res) => {
    let merchantStatus = 'unknown';
    try {
        const merchantService = require('./services/merchantService');
        merchantStatus = merchantService.initialized ? 'loaded' : 'loading';
    } catch (e) {
        merchantStatus = 'unavailable';
    }

    let database = 'unavailable';
    try {
        const { error } = await getSupabase().from('users').select('id', { head: true, count: 'exact' }).limit(1);
        database = error ? 'unhealthy' : 'healthy';
    } catch (error) {
        database = 'unavailable';
    }
    const status = database === 'healthy' ? 200 : 503;
    res.status(status).json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        services: {
            database,
            server: 'running',
            gemini: geminiService.isAvailable ? geminiService.isAvailable() : 'unknown',
            merchantData: merchantStatus
        }
    });
});

// ============================================
// Error Handling Middleware
// ============================================
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// ============================================
// Start Server with Port Fallback
// ============================================
const DEFAULT_PORT = 5000;
const PORT = process.env.PORT || DEFAULT_PORT;

const tryPort = (portToTry) => {
    return new Promise((resolve, reject) => {
        const tempServer = http.createServer();
        tempServer.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`❌ Port ${portToTry} is in use, trying ${portToTry + 1}...`);
                tempServer.close();
                resolve(tryPort(portToTry + 1));
            } else {
                reject(err);
            }
        });
        tempServer.once('listening', () => {
            tempServer.close();
            resolve(portToTry);
        });
        tempServer.listen(portToTry);
    });
};

const startServer = async () => {
    try {
        const availablePort = await tryPort(PORT);
        
        server.listen(availablePort, async () => {
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ███████╗ █████╗ ██████╗  █████╗ ██╗                      ║
║   ██╔════╝██╔══██╗██╔══██╗██╔══██╗██║                      ║
║   ███████╗███████║██████╔╝███████║██║                      ║
║   ╚════██║██╔══██║██╔══██╗██╔══██║██║                      ║
║   ███████║██║  ██║██████╔╝██║  ██║██║                      ║
║   ╚══════╝╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝                      ║
║                                                              ║
║              ██████╗  █████╗ ██╗   ██╗                      ║
║              ██╔══██╗██╔══██╗╚██╗ ██╔╝                      ║
║              ██████╔╝███████║ ╚████╔╝                       ║
║              ██╔═══╝ ██╔══██║  ╚██╔╝                        ║
║              ██║     ██║  ██║   ██║                         ║
║              ╚═╝     ╚═╝  ╚═╝   ╚═╝                         ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📍 Status:    ✅ RUNNING                                    ║
║  📍 Port:      ${availablePort.toString().padEnd(35)}║
║  📍 Env:       ${(process.env.NODE_ENV || 'development').padEnd(35)}║
║  🤖 Gemini:    ${geminiService.isAvailable ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}          ║
║  🗄️  Database:  Supabase                                                  ║
║                                                              ║
║  📁 Test Endpoints:                                          ║
║     • http://localhost:${availablePort}/test                  ║
║     • http://localhost:${availablePort}/test-db               ║
║     • http://localhost:${availablePort}/test-gemini           ║
║     • http://localhost:${availablePort}/health                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
            `);
            
            // Initialize cron jobs
            if (cronService.init) cronService.init();
            
            console.log(`\n📡 Server ready at http://localhost:${availablePort}`);
            console.log(`🔍 Health check: http://localhost:${availablePort}/health`);
            console.log(`🤖 Test Gemini: http://localhost:${availablePort}/test-gemini`);
            console.log(`🗄️  Test DB: http://localhost:${availablePort}/test-db`);
            
            // Initialize Merchant Data (After Server Starts)
            setTimeout(async () => {
                try {
                    console.log('\n📂 Loading merchant data...');
                    const merchantService = require('./services/merchantService');
                    await merchantService.initialize();
                    console.log('✅ Merchant data initialization complete');
                    
                    const merchants = merchantService.getAllMerchants();
                    console.log(`📦 Total merchants loaded: ${merchants.length}`);
                    
                    const sampleMerchants = merchants.slice(0, 5);
                    console.log(`📋 Sample merchants: ${sampleMerchants.join(', ')}${merchants.length > 5 ? '...' : ''}`);
                    
                } catch (error) {
                    console.error('❌ Failed to initialize merchant service:', error.message);
                }
            }, 1000);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n📴 SIGTERM received. Closing server gracefully...');
    if (cronService.stopAll) cronService.stopAll();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n📴 SIGINT received. Closing server gracefully...');
    if (cronService.stopAll) cronService.stopAll();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { app, server };
