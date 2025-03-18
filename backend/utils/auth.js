// backend/utils/auth.js
const jwt = require('jsonwebtoken');              // For creating and verifying JWTs
const { jwtConfig } = require('../config');       // Import JWT configuration
const { User } = require('../db/models');         // Import User model

const { secret, expiresIn } = jwtConfig;          // Extract JWT settings

// Sends a JWT Cookie
const setTokenCookie = (res, user) => {
  // Create the token with user data
  const safeUser = {                              // Create a safe user object without sensitive data
    id: user.id,
    email: user.email,
    username: user.username,
  };
  const token = jwt.sign(
    { data: safeUser },                           // Payload to encode in the JWT
    secret,                                       // Secret key for signing
    { expiresIn: parseInt(expiresIn) }            // Token expiration (604,800 seconds = 1 week)
  );

  const isProduction = process.env.NODE_ENV === "production";

  // Set the token cookie
  res.cookie('token', token, {
    maxAge: expiresIn * 1000,                     // maxAge in milliseconds
    httpOnly: true,                               // Prevents JavaScript access
    secure: isProduction,                         // HTTPS only in production
    sameSite: isProduction && "Lax"               // Cross-site cookie policy
  });

  return token;
};

// Middleware that restores the user from a JWT token
const restoreUser = (req, res, next) => {
  // token parsed from cookies
  const { token } = req.cookies;
  req.user = null;                                // Default to no user

  return jwt.verify(token, secret, null, async (err, jwtPayload) => {
    if (err) {
      return next();                              // Continue if token invalid/missing
    }

    try {
      const { id } = jwtPayload.data;             // Extract user ID from token
      req.user = await User.findByPk(id, {        // Look up user in database
        attributes: {
          include: ['email', 'createdAt', 'updatedAt']  // Include fields normally excluded
        }
      });
    } catch (e) {
      res.clearCookie('token');                   // Clear invalid token
      return next();
    }

    if (!req.user) res.clearCookie('token');      // Clear token if user not found

    return next();
  });
};

// If there is no current user, return an error
const requireAuth = function (req, _res, next) {
  if (req.user) return next();                    // Continue if user exists

  const err = new Error('Authentication required');  // Create error for unauthenticated requests
  err.title = 'Authentication required';
  err.errors = { message: 'Authentication required' };
  err.status = 401;                               // 401 Unauthorized status code
  return next(err);                               // Pass error to error handler
}

module.exports = { setTokenCookie, restoreUser, requireAuth };