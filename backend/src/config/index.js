require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean) || ['http://localhost:5173'],
    // Optional: allow any subdomain, e.g. CORS_ALLOWED_DOMAIN=biglitz.in
    allowedDomain: process.env.CORS_ALLOWED_DOMAIN?.trim() || null,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'digi-tracker-8b0be',
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  },
  rewards: {
    dailyEntry: 10,
    streakBonus7: 50,
    streakBonus30: 200,
    accuracyBonus: 5,
  },
};
