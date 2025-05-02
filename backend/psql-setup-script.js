// backend/psql-setup-script.js
const { sequelize } = require('./db/models');

console.log('Starting setup...');
console.log('Schema name is:', process.env.SCHEMA);

sequelize.showAllSchemas({ logging: false })
  .then((data) => {
    console.log('Found schemas:', data);
    
    if (!data.includes(process.env.SCHEMA)) {
      console.log('Need to create schema');
      return sequelize.createSchema(process.env.SCHEMA);
    } else {
      console.log('Schema already exists');
      return Promise.resolve();
    }
  })
  .then(() => {
    console.log('All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.log('Got an error:', err);
    process.exit(1);
  });