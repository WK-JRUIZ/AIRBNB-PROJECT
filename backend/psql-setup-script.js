// backend/psql-setup-script.js
const { sequelize } = require('./db/models');

console.log('Starting database setup...');

sequelize.showAllSchemas({ logging: false })
  .then(async (data) => {
    console.log('Checking if schema exists...');
    
    if (!data.includes(process.env.SCHEMA)) {
      console.log('Schema not found, creating it now...');
      return sequelize.createSchema(process.env.SCHEMA);
    } else {
      console.log('Schema already exists');
      return Promise.resolve();
    }
  })
  .then(() => {
    console.log('Setup complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error in setup:', err);
    process.exit(1);
  });