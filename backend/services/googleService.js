// backend/services/googleService.js
// Google OAuth integration service

const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

class GoogleService {
    constructor() {
        this.client = null;
        this.init();
    }

    init() {
        try {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            
            if (!clientId || !clientSecret) {
                console.warn('⚠️ Google OAuth credentials not found');
                console.log('💡 To enable Google Sign-In, add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env');
                return;
            }
            
            this.client = new OAuth2Client({
                clientId,
                clientSecret,
                redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
            });
            
            console.log('✅ Google OAuth service initialized');
            
        } catch (error) {
            console.error('❌ Google OAuth init failed:', error.message);
        }
    }

    // Verify Google ID token
    async verifyToken(idToken) {
        try {
            if (!this.client) {
                // Demo mode - accept any token
                console.log('🔑 [DEMO] Verifying Google token:', idToken);
                return {
                    success: true,
                    data: {
                        email: 'demo@gmail.com',
                        name: 'Demo User',
                        picture: null,
                        sub: 'google_demo_id_123'
                    }
                };
            }

            const ticket = await this.client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            
            return {
                success: true,
                data: {
                    email: payload.email,
                    name: payload.name,
                    picture: payload.picture,
                    sub: payload.sub,
                    email_verified: payload.email_verified
                }
            };

        } catch (error) {
            console.error('❌ Google token verification failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Get Google Auth URL
    getAuthUrl() {
        if (!this.client) {
            return '/auth/google/callback?code=demo_code';
        }

        const url = this.client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ],
            prompt: 'select_account'
        });

        return url;
    }

    // Get user info from Google
    async getUserInfo(accessToken) {
        try {
            const response = await axios.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );

            return {
                success: true,
                data: {
                    email: response.data.email,
                    name: response.data.name,
                    picture: response.data.picture,
                    google_id: response.data.id
                }
            };

        } catch (error) {
            console.error('❌ Failed to get Google user info:', error);
            return { success: false, error: error.message };
        }
    }

    // Exchange code for tokens
    async getTokens(code) {
        try {
            if (!this.client) {
                // Demo mode
                return {
                    success: true,
                    data: {
                        access_token: 'demo_access_token',
                        id_token: 'demo_id_token',
                        refresh_token: 'demo_refresh_token'
                    }
                };
            }

            const { tokens } = await this.client.getToken(code);
            
            return {
                success: true,
                data: tokens
            };

        } catch (error) {
            console.error('❌ Failed to get Google tokens:', error);
            return { success: false, error: error.message };
        }
    }

    // Refresh access token
    async refreshToken(refreshToken) {
        try {
            if (!this.client || !refreshToken) {
                return { success: false, error: 'No refresh token' };
            }

            this.client.setCredentials({ refresh_token: refreshToken });
            const { credentials } = await this.client.refreshAccessToken();

            return {
                success: true,
                data: credentials
            };

        } catch (error) {
            console.error('❌ Failed to refresh Google token:', error);
            return { success: false, error: error.message };
        }
    }

    // Revoke token
    async revokeToken(token) {
        try {
            if (!token) return { success: true };

            await axios.post('https://oauth2.googleapis.com/revoke', null, {
                params: { token }
            });

            return { success: true };

        } catch (error) {
            console.error('❌ Failed to revoke Google token:', error);
            return { success: false, error: error.message };
        }
    }

    // Get available Google accounts (for account picker)
    async getAvailableAccounts(accessToken) {
        try {
            // In a real implementation, you'd use the Google People API
            // For now, return the current user's info
            const userInfo = await this.getUserInfo(accessToken);
            
            if (!userInfo.success) {
                return { success: false, data: [] };
            }

            return {
                success: true,
                data: [{
                    email: userInfo.data.email,
                    name: userInfo.data.name,
                    picture: userInfo.data.picture,
                    google_id: userInfo.data.google_id,
                    is_default: true
                }]
            };

        } catch (error) {
            console.error('❌ Failed to get Google accounts:', error);
            return { success: false, data: [] };
        }
    }

    // Check if service is available
    isAvailable() {
        return this.client !== null;
    }
}

module.exports = new GoogleService();