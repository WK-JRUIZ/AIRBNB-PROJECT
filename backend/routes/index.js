// backend/routes/index.js
const express = require('express');
const router = express.Router();               // Create main router
const apiRouter = require('./api');            // Import the API router

// Add a XSRF-TOKEN cookie
router.get("/api/csrf/restore", (req, res) => {
  const csrfToken = req.csrfToken();          // Generate new CSRF token
  res.cookie("XSRF-TOKEN", csrfToken);        // Set it as a cookie
  res.status(200).json({
    'XSRF-Token': csrfToken                   // Also include it in the JSON response
  });
});

// Connect the API router - all routes in apiRouter will be prefixed with '/api'
router.use('/api', apiRouter);                // Mount the API router under the /api path



module.exports = router;                      // Export the main router