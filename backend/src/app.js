const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');
const { isOriginAllowed } = require('./config/cors');
const routes = require('./routes');
const { errorHandler } = require('./utils/helpers');

const app = express();

if (config.env === 'production') {
  app.set('trust proxy', 1);
}

const corsOptions = {
  origin(origin, callback) {
    if (config.env === 'development') {
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, origin || true);
      }
    }
    if (isOriginAllowed(origin)) {
      return callback(null, origin || true);
    }
    if (config.env === 'production' && origin) {
      console.warn(`[CORS] Blocked origin: ${origin}`);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
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
