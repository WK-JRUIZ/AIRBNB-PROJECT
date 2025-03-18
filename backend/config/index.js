// backend/config/index.js

module.exports = {
    environment: process.env.NODE_ENV || 'development',  // Default to development if not specified
    port: process.env.PORT || 8000,                      // Server port, fallback to 8000
    dbFile: process.env.DB_FILE,                         // Database file location for SQLite
    jwtConfig: {
      secret: process.env.JWT_SECRET,                    // Secret key for JWT signing
      expiresIn: process.env.JWT_EXPIRES_IN              // JWT expiration time in seconds
    }
  };
  