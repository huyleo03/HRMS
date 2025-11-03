const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
// ❌ REMOVED: Global rate limiter - sử dụng specific limiters trong routes thay vì global
// const rateLimit = require('express-rate-limit');
require('dotenv').config();
const routes = require('./src/routes');


// Import routes


const app = express();

// ⭐ Trust proxy - QUAN TRỌNG cho việc lấy IP thật từ proxy/load balancer
// Render, Heroku, AWS đều dùng reverse proxy
app.set('trust proxy', true);

// Security middleware
app.use(helmet());

// ❌ REMOVED: Global rate limiting đã bị xóa để tránh chồng chéo với specific limiters
// Mỗi route sẽ có rate limiter riêng phù hợp với mục đích sử dụng

// CORS configuration - Hỗ trợ nhiều origins
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

// Log để debug
console.log('🌐 Allowed Origins:', allowedOrigins);
console.log('🔑 Environment:', process.env.NODE_ENV);

app.use(cors({
  origin: function (origin, callback) {
    console.log('📥 Request from origin:', origin);
    
    // Cho phép requests không có origin (mobile apps, postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      console.log('✅ CORS allowed for:', origin);
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      console.log(`   Allowed origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition']
}));

// Handle preflight requests
app.options('*', cors());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
routes(app);


// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Express Backend API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// 404 handler - must be after all other routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler - must be last
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  
  // Default error status and message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error stack in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});


module.exports = app;