// backend/routes/api/index.js
const router = require('express').Router();            // Create main API router
const sessionRouter = require('./session.js');         // Import session router
const usersRouter = require('./users.js');             // Import users router
const { restoreUser } = require("../../utils/auth.js"); // Import auth middleware

// Connect restoreUser middleware to the API router
// If current user session is valid, set req.user to the user in the database
// If current user session is not valid, set req.user to null
router.use(restoreUser);                               // Apply restoreUser to all API routes

router.use('/session', sessionRouter);                 // Mount session router at /api/session
router.use('/users', usersRouter);                     // Mount users router at /api/users

router.post('/test', (req, res) => {                   // Test route (can be removed later)
  res.json({ requestBody: req.body });
});

module.exports = router;                               // Export the configured router