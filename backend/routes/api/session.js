// backend/routes/api/session.js
const express = require('express');
const { Op } = require('sequelize');           // Import Sequelize operators
const bcrypt = require('bcryptjs');            // Import bcrypt for password comparison

const { setTokenCookie, restoreUser } = require('../../utils/auth');  // Import auth utilities
const { User } = require('../../db/models');   // Import User model

const router = express.Router();

// Log in
router.post('/', async (req, res, next) => {   // POST /api/session endpoint
  const { credential, password } = req.body;   // Extract credentials from request body

  // Find the user by either username or email
  const user = await User.unscoped().findOne({  // Use unscoped() to include hashedPassword
    where: {
      [Op.or]: {                              // Use OR operator to match either field
        username: credential,
        email: credential
      }
    }
  });

  // Check if user exists and password is correct
  if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
    const err = new Error('Login failed');     // Create error for failed login
    err.status = 401;                          // Set HTTP status code to 401 Unauthorized
    err.title = 'Login failed';
    err.errors = { credential: 'The provided credentials were invalid.' };
    return next(err);                          // Pass error to error-handling middleware
  }

  // Create a safe user object (without hashedPassword)
  const safeUser = {
    id: user.id,
    email: user.email,
    username: user.username,
  };

  // Set the JWT cookie
  await setTokenCookie(res, safeUser);         // Create and set JWT cookie

  // Return the user information
  return res.json({
    user: safeUser                            // Return user data as JSON
  });
});


// Log out
router.delete('/', (_req, res) => {            // DELETE /api/session endpoint
  res.clearCookie('token');                    // Remove the JWT cookie
  return res.json({ message: 'success' });     // Return success message
});

module.exports = router;