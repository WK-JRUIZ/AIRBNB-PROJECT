const express = require('express');
require('express-async-errors');                    // Automatically catches errors in async route handlers
const morgan = require('morgan');                   // HTTP request logger
const cors = require('cors');                       // Cross-Origin Resource Sharing
const csurf = require('csurf');                     // CSRF protection
const helmet = require('helmet');                   // Security headers
const cookieParser = require('cookie-parser');      // Parse cookies from requests
const { ValidationError } = require('sequelize');   // Import Sequelize validation error
const path = require('path');                       // For serving static files

const { environment } = require('./config');        // Import environment configuration
const isProduction = environment === 'production';  // Check if we're in production
const routes = require('./routes');                 // Import routes

const app = express();                              // Create Express application

// Connect morgan middleware for logging
app.use(morgan('dev'));                             // Log HTTP requests

// Parse cookies and JSON bodies
app.use(cookieParser());                            // Parse Cookie header and populate req.cookies
app.use(express.json());                            // Parse JSON request bodies

// Serve static files (e.g., React frontend)
app.use(express.static(path.join(__dirname, 'public'))); // Serve frontend from 'public' folder

// Security middleware
if (!isProduction) {
  // Enable CORS in development with specific origin
  app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // Allow frontend on port 3000
}

// Helmet helps set security headers
app.use(
  helmet.crossOriginResourcePolicy({
    policy: 'cross-origin'                          // Allow loading resources from different origins
  })
);

// Set the _csrf token and create req.csrfToken method
app.use(
  csurf({
    cookie: {
      secure: isProduction,                         // HTTPS only in production
      sameSite: isProduction ? 'Lax' : 'Strict',    // Stricter in development
      httpOnly: true                                // Prevents JavaScript access to the cookie
    }
  })
);

// Connect routes
app.use(routes);                                    // Use defined routes (e.g., /api)

// Serve frontend for non-API routes (SPA support)
// if (!isProduction) {
  // app.get('*', (req, res) => {
    // res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve index.html for all non-API routes
  // });
//}

// --- ERROR HANDLING MIDDLEWARE BELOW ---

// Catch unhandled requests and forward to error handler
app.use((_req, _res, next) => {                     // 404 Not Found handler
  const err = new Error('The requested resource couldn\'t be found.');
  err.title = 'Resource Not Found';
  err.errors = { message: 'The requested resource couldn\'t be found.' };
  err.status = 404;
  next(err);
});

// Process Sequelize errors
app.use((err, _req, _res, next) => {                // Sequelize error handler
  if (err instanceof ValidationError) {
    let errors = {};
    for (let error of err.errors) {
      errors[error.path] = error.message;
    }
    err.title = 'Validation error';
    err.errors = errors;
  }
  next(err);
});

// Error formatter
app.use((err, _req, res, _next) => {                // General error formatter
  res.status(err.status || 500);
  console.error(err);
  res.json({
    title: err.title || 'Server Error',
    message: err.message,
    errors: err.errors,
    stack: isProduction ? null : err.stack          // Only include stack in development
  });
});

module.exports = app;