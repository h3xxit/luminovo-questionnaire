require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Security middleware - configured to work with embedded YouTube and inline scripts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.youtube.com", "https://s.ytimg.com"],
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
      frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://www.youtube.com"]
    }
  }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', apiLimiter);

// Serve static files (your existing frontend)
app.use(express.static(__dirname));
app.use('/de', express.static(path.join(__dirname, 'de')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { supabase } = require('./api/config/supabase');
    const { data, error } = await supabase
      .from('forms')
      .select('count')
      .limit(1);
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: error ? 'not connected' : 'connected',
      supabase: {
        url: process.env.SUPABASE_URL ? 'configured' : 'not configured',
        error: error?.message
      }
    });
  } catch (err) {
    res.json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      error: err.message
    });
  }
});

// API routes
app.use('/api/forms', require('./api/routes/forms'));
app.use('/api/embed', require('./api/routes/embed'));
app.use('/api/responses', require('./api/routes/responses'));
// app.use('/api/auth', require('./api/routes/auth')); // TODO: Add authentication

// Serve embed.js for external sites
app.get('/embed.js', (req, res) => {
  res.type('application/javascript');
  res.send(`
    // Luminovo Questionnaire Embed Script
    (function() {
      console.log('Luminovo Questionnaire embed script loaded');
      // TODO: Implement embed functionality
    })();
  `);
});

// Public form viewer route
app.get('/view/:formId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public-viewer.html'));
});

// Catch-all route for frontend (for any future SPA routing)
app.get('*', (req, res) => {
  // Don't catch API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
