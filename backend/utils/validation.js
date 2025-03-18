// backend/utils/validation.js
const { validationResult } = require('express-validator');   // Import from express-validator

// middleware for formatting errors from express-validator middleware
// (to customize, see express-validator's documentation)
const handleValidationErrors = (req, _res, next) => {
  const validationErrors = validationResult(req);            // Get validation errors from request

  if (!validationErrors.isEmpty()) {                         // Check if errors exist
    const errors = {};
    validationErrors
      .array()                                              // Convert errors to array
      .forEach(error => errors[error.path] = error.msg);    // Format errors as key-value pairs

    const err = Error("Bad request.");                       // Create error object
    err.errors = errors;                                     // Attach formatted errors
    err.status = 400;                                        // Set HTTP status code to 400 (Bad Request)
    err.title = "Bad request.";                              // Set error title
    next(err);                                               // Pass error to error-handling middleware
  }
  next();                                                    // Proceed if no errors
};

module.exports = {
  handleValidationErrors                                    // Export the middleware
};