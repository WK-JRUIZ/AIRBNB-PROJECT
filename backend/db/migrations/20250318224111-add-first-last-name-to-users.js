// backend/db/migrations/XXXXXXXXXXXXXX-add-first-last-name-to-users.js
'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA || 'airbnb_schema';  
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'firstName', {   
      type: Sequelize.STRING,
      allowNull: true                                      
    }, options);
    
    await queryInterface.addColumn('Users', 'lastName', {     
      type: Sequelize.STRING,
      allowNull: true                                      
    }, options);
  },

  async down(queryInterface, Sequelize) {
    options.tableName = "Users";
    await queryInterface.removeColumn(options, 'firstName');   
    await queryInterface.removeColumn(options, 'lastName');    
  }
};
