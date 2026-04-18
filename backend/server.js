// backend/server.js
// Main server file for SabAI Pay - COMPLETE WORKING VERSION with MySQL Database

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const http = require('http');

// Load environment variables
dotenv.config();

// Import database connection
const db = require('./config/database');
const { verifyConfig: verifyRazorpay } = require('./config/razorpay');

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

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import services
const geminiService = require('./services/geminiChatService');
const cronService = require('./services/cronService');

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

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

// Auth routes
app.use('/api/auth', authRoutes);

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

// ============================================
// TEST ROUTES
// ============================================

// Simple test route
app.get('/test', (req, res) => {
    res.json({ success: true, message: 'Server is working!' });
});

// Gemini test route
app.get('/test-gemini', async (req, res) => {
    try {
        const result = await geminiService.processMessage('test-user', 'Say "Hello from Gemini!" in one sentence');
        res.json({ 
            success: true, 
            message: 'Gemini is working!',
            response: result.response
        });
    } catch (error) {
        res.json({ 
            success: false, 
            message: 'Gemini error',
            error: error.message 
        });
    }
});

// Database test route
app.get('/test-db', async (req, res) => {
    try {
        const [result] = await db.pool.execute('SELECT 1 as test');
        res.json({ success: true, message: 'Database connected', data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug merchants route
app.get('/debug-merchants', async (req, res) => {
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

// ============================================
// Health Check Route
// ============================================
app.get('/health', (req, res) => {
    let merchantStatus = 'unknown';
    try {
        const merchantService = require('./services/merchantService');
        merchantStatus = merchantService.initialized ? 'loaded' : 'loading';
    } catch (e) {
        merchantStatus = 'unavailable';
    }

    res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        services: {
            database: db.pool ? 'connected' : 'disconnected',
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
║  🤖 Gemini:    ${geminiService.isAvailable ? '✅ ONLINE' : '❌ OFFLINE'}                    ║
║  🗄️  Database:  ${db.pool ? '✅ CONNECTED' : '❌ DISCONNECTED'}                 ║
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