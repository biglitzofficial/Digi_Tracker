const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');
const routes = require('./routes');
const { errorHandler } = require('./utils/helpers');

const app = express();

function isOriginAllowed(origin) {
  if (!origin) return true;

  const allowed = config.cors.origin;
  if (allowed.includes(origin)) return true;

  const domain = config.cors.allowedDomain;
  if (domain) {
    try {
      const { hostname, protocol } = new URL(origin);
      if (protocol !== 'http:' && protocol !== 'https:') return false;
      if (hostname === domain || hostname.endsWith(`.${domain}`)) return true;
    } catch {
      return false;
    }
  }

  return false;
}

const corsOptions = {
  origin(origin, callback) {
    // Allow Flutter web / Vite dev servers on any localhost port in development
    if (config.env === 'development') {
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
    }
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/reports', express.static(path.join(__dirname, '../reports')));

app.use('/api/v1', routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
