const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load .env file if it exists

console.log('Starting schema setup...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SCHEMA:', process.env.SCHEMA || 'airbnb_schema');

// Only run in production mode
if (process.env.NODE_ENV === 'production') {
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL found, skipping schema creation');
    process.exit(0);
  }

  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }
    }
  });

  // Set a schema name even if SCHEMA isn't defined
  const schemaName = process.env.SCHEMA || 'airbnb_schema';
  
  sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)
    .then(() => {
      console.log(`Created schema: ${schemaName}`);
      process.exit(0);
    })
    .catch(err => {
      console.error('Error creating schema:', err);
      process.exit(1);
    });
} else {
  console.log('Not in production mode, skipping schema creation');
  process.exit(0);
}