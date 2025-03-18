// backend/db/migrations/XXXXXXXXXXXXXX-create-user.js
'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,                           // id cannot be null
        autoIncrement: true,                        // auto-increment the id
        primaryKey: true,                           // define id as the primary key
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING(30),                 // restrict to 30 characters
        allowNull: false,                           // username is required
        unique: true                                // username must be unique
      },
      email: {
        type: Sequelize.STRING(256),                // restrict to 256 characters (RFC 5321 limit)
        allowNull: false,                           // email is required
        unique: true                                // email must be unique
      },
      hashedPassword: {
        type: Sequelize.STRING.BINARY,              // binary string for hashed password
        allowNull: false                            // password is required
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')  // auto-set creation date
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')  // auto-set update date
      }
    }, options);
  },

  async down(queryInterface, Sequelize) {
    options.tableName = "Users";
    return queryInterface.dropTable(options);      // for undoing the migration
  }
};