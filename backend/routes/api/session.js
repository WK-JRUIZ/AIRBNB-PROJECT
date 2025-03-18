// backend/routes/api/session.js
const express = require('express');
const { Op } = require('sequelize');           // Import Sequelize operators
const bcrypt = require('bcryptjs');            // Import bcrypt for password comparison
const { check } = require('express-validator');                    // Import check function
const { handleValidationErrors } = require('../../utils/validation');  // Import validation handle
const { setTokenCookie, restoreUser } = require('../../utils/auth');  // Import auth utilities
const { User } = require('../../db/models');   // Import User model
const router = express.Router();


const validateLogin = [                                           // Create array of middleware
  check('credential')                                             // Validate credential field
    .exists({ checkFalsy: true })                                // Must exist and not be falsy
    .notEmpty()                                                  // Must not be empty
    .withMessage('Please provide a valid email or username.'),   // Error message
  check('password')                                              // Validate password field
    .exists({ checkFalsy: true })                                // Must exist and not be falsy
    .withMessage('Please provide a password.'),                  // Error message
  handleValidationErrors                                         // Process validation results
];

// Log in
router.post(
  '/', 
  validateLogin,
  async (req, res, next) => {   // POST /api/session endpoint
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

  const safeUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,                 // Include firstName
    lastName: user.lastName                    // Include lastName
  };

  await setTokenCookie(res, safeUser);

  return res.json({
    user: safeUser
  });
}
);


// Log out
router.delete('/', (_req, res) => {            // DELETE /api/session endpoint
  res.clearCookie('token');                    // Remove the JWT cookie
  return res.json({ message: 'success' });     // Return success message
});

// Restore session user
router.get(
  '/',
  (req, res) => {
    const { user } = req;
    if (user) {
      const safeUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,               // Include firstName
        lastName: user.lastName                  // Include lastName
      };
      return res.json({
        user: safeUser
      });
    } else return res.json({ user: null });
  }
);

module.exports = router;