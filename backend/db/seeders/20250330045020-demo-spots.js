'use strict';

const { User, Spot, SpotImage } = require('../models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const options = process.env.NODE_ENV === 'production' ? {
      schema: process.env.SCHEMA
    } : {};

    const demoUser = await User.findOne({ where: { username: 'Demo-lition' } });
    if (!demoUser) throw new Error('Demo user not found');

    const spots = await Spot.bulkCreate([
      {
        ownerId: demoUser.id,
        address: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        lat: 37.7749,
        lng: -122.4194,
        name: 'App Academy',
        description: 'Modern coding bootcamp in the heart of SF',
        price: 200.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ownerId: demoUser.id,
        address: '456 Sunshine Blvd',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        lat: 34.0522,
        lng: -118.2437,
        name: 'Sunny Retreat',
        description: 'Bright and airy retreat near the beach',
        price: 150.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ownerId: demoUser.id,
        address: '789 Peak Road',
        city: 'Denver',
        state: 'CO',
        country: 'USA',
        lat: 39.7392,
        lng: -104.9903,
        name: 'Mountain View',
        description: 'Cozy cabin with stunning mountain views',
        price: 175.00,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { ...options, validate: true });

    await SpotImage.bulkCreate([
      {
        spotId: spots[0].id,
        url: 'https://example.com/app-academy-preview.jpg',
        preview: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        spotId: spots[0].id,
        url: 'https://example.com/app-academy-interior.jpg',
        preview: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        spotId: spots[1].id,
        url: 'https://example.com/sunny-retreat-preview.jpg',
        preview: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        spotId: spots[2].id,
        url: 'https://example.com/mountain-view-preview.jpg',
        preview: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { ...options, validate: true });
  },

  async down(queryInterface, Sequelize) {
    const options = process.env.NODE_ENV === 'production' ? {
      schema: process.env.SCHEMA
    } : {};

    await queryInterface.bulkDelete('SpotImages', null, options);
    await queryInterface.bulkDelete('Spots', null, options);
  }
};
