const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/auth.routes');

const app = express();

// ===== Security middleware =====
app.use(helmet());

// ===== Rate limiting =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit mỗi IP 100 request/15 phút
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// ===== CORS configuration =====
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// ===== Compression =====
app.use(compression());

// ===== Logging =====
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ===== Body parsing =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== API routes =====
app.use('/api/auth', authRoutes);

// ===== Root endpoint =====
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Express Backend API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

module.exports = app;
