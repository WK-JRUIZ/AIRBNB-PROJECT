// backend/db/migrations/XXXXXXXXXXXXXX-add-first-last-name-to-users.js
'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'firstName', {    // Add firstName column
      type: Sequelize.STRING,
      allowNull: true                                       // Make it optional
    }, options);
    
    await queryInterface.addColumn('Users', 'lastName', {     // Add lastName column
      type: Sequelize.STRING,
      allowNull: true                                       // Make it optional
    }, options);
  },

  async down(queryInterface, Sequelize) {
    options.tableName = "Users";
    await queryInterface.removeColumn(options, 'firstName');   // Remove in down migration
    await queryInterface.removeColumn(options, 'lastName');    // Remove in down migration
  }
};
