// backend/routes/api/users.js
const express = require('express');
const bcrypt = require('bcryptjs');              // For password hashing

const { setTokenCookie, requireAuth } = require('../../utils/auth');  // Auth utilities
const { User } = require('../../db/models');     // User model

const router = express.Router();

// Sign up
router.post('/', async (req, res) => {           // POST /api/users endpoint
  const { email, password, username } = req.body;  // Extract user data
  
  // Hash the password
  const hashedPassword = bcrypt.hashSync(password);  // Create secure hash
  
  // Create a new user
  const user = await User.create({ email, username, hashedPassword });  // Save to DB

  // Create a safe user object (without hashedPassword)
  const safeUser = {
    id: user.id,
    email: user.email,
    username: user.username,
  };

  // Set the JWT cookie
  await setTokenCookie(res, safeUser);           // Login the new user automatically

  // Return the user information
  return res.json({
    user: safeUser                              // Return user data
  });
});

module.exports = router;
                  // Export the router