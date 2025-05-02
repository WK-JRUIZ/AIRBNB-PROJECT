'use strict';
const { User, Spot, Booking } = require('../models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const demoUser = await User.findOne({ where: { username: 'Demo-lition' } });
    const user1 = await User.findOne({ where: { username: 'FakeUser1' } });
    const user2 = await User.findOne({ where: { username: 'FakeUser2' } });

    console.log(demoUser, user1, user2);

    if (!demoUser || !user1 || !user2) {
      throw new Error('Users not found. Must seed your Users.');
    }
    const spots = await Spot.findAll();
    console.log(spots);

    if (!spots.length) {
      throw new Error('Spots not found. Must seed your Spots.');
    }

    function getDates(startDays, length) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + startDays);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + length);
      return {
        startDate: startDate.toISOString().split('T')[0], 
        endDate: endDate.toISOString().split('T')[0],    
      };
    }

    await Booking.bulkCreate([
      {
        spotId: spots[0].id,
        userId: user1.id,
        ...getDates(10, 5),
      },
      {
        spotId: spots[0].id,
        userId: user2.id,
        ...getDates(20, 5),
      },
      {
        spotId: spots[1].id,
        userId: demoUser.id,
        ...getDates(5, 3),
      },
      {
        spotId: spots[1].id,
        userId: user2.id,
        ...getDates(12, 4),
      },
      {
        spotId: spots[2].id,
        userId: user1.id,
        ...getDates(30, 5),
      },
    ], { validate: true }); 
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Bookings', null, {});
  }
};
