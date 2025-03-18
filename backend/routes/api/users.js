// backend/routes/api/users.js
const express = require('express');
const bcrypt = require('bcryptjs');              // For password hashing
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { setTokenCookie, requireAuth } = require('../../utils/auth');  // Auth utilities
const { User } = require('../../db/models');     // User model
const router = express.Router();

const validateSignup = [
    check('email')
      .exists({ checkFalsy: true })                      // Email must exist and not be falsy
      .isEmail()                                         // Must be valid email format
      .withMessage('Please provide a valid email.'),
    check('username')
      .exists({ checkFalsy: true })                      // Username must exist and not be falsy
      .isLength({ min: 4 })                              // Must be at least 4 characters
      .withMessage('Please provide a username with at least 4 characters.'),
    check('username')
      .not()                                             // Username must NOT...
      .isEmail()                                         // ...be an email
      .withMessage('Username cannot be an email.'),
    check('password')
      .exists({ checkFalsy: true })                      // Password must exist and not be falsy
      .isLength({ min: 6 })                              // Must be at least 6 characters
      .withMessage('Password must be 6 characters or more.'),
    handleValidationErrors                               // Process validation results
  ];
  
  // Sign up
router.post(
    '/',
    validateSignup,
    async (req, res) => {
      const { email, password, username, firstName, lastName } = req.body;  // Extract new fields
      const hashedPassword = bcrypt.hashSync(password);
      const user = await User.create({ 
        email, 
        username, 
        hashedPassword,
        firstName,                                 // Include firstName
        lastName                                   // Include lastName
      });
  
      const safeUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,                 // Include in response
        lastName: user.lastName                    // Include in response
      };
  
      await setTokenCookie(res, safeUser);
  
      return res.json({
        user: safeUser
      });
    }
  );

module.exports = router;
                  // Export the router