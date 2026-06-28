const app = require('./app');
const connectDB = require('./config/database');
const { initFirebase } = require('./config/firebase');
const config = require('./config');

const start = async () => {
  await connectDB();
  initFirebase();

  app.listen(config.port, () => {
    const { getAllowedOrigins, getAllowedDomainSuffixes } = require('./config/cors');
    console.log(`DigiTracker API running on port ${config.port} [${config.env}]`);
    console.log(`Health check: http://localhost:${config.port}/api/v1/health`);
    if (config.env === 'production') {
      console.log('[CORS] Origins:', getAllowedOrigins().join(', ') || '(none)');
      console.log('[CORS] Domain suffixes:', getAllowedDomainSuffixes().join(', ') || '(none)');
      console.log('[CORS] APP_URL:', config.appUrl);
    }
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
