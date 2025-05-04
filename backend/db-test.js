// db-test.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Get DATABASE_URL from environment variable or use a fallback for testing
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('No DATABASE_URL found. Attempting to connect to local SQLite database.');
  testLocalConnection();
} else {
  console.log('DATABASE_URL found. Attempting to connect to PostgreSQL database.');
  const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
  console.log('Attempting to connect using:', maskedUrl);
  testPostgresConnection(databaseUrl);
}

// Test local SQLite connection
async function testLocalConnection() {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db/development.db',
    logging: console.log
  });
  
  try {
    console.log('Testing local SQLite connection...');
    await sequelize.authenticate();
    console.log('Connection to SQLite has been established successfully.');
    
    // Try to get a list of tables
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Available tables:', tables);
    
  } catch (error) {
    console.error('Unable to connect to the local database:', error);
  } finally {
    await sequelize.close();
  }
}

// Test PostgreSQL connection 
async function testPostgresConnection(url) {
  const sequelize = new Sequelize(url, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: console.log
  });

  try {
    console.log('Testing PostgreSQL connection...');
    await sequelize.authenticate();
    console.log('Connection to PostgreSQL has been established successfully.');
    
    // List schemas to verify schema access
    try {
      const schemas = await sequelize.showAllSchemas();
      console.log('Available schemas:', schemas);
    } catch (err) {
      console.log('Could not fetch schemas:', err.message);
    }
    
 
    try {
      const tables = await sequelize.getQueryInterface().showAllTables();
      console.log('Available tables:', tables);
    } catch (err) {
      console.log('Could not fetch tables:', err.message);
    }
    
  } catch (error) {
    console.error('Unable to connect to the PostgreSQL database:', error);
    console.error('Error details:', error.original ? error.original.message : error.message);
  } finally {
    await sequelize.close();
  }
}