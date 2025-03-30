'use strict';

const express = require('express');
const { Spot, SpotImage, User, Review, Booking } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { check, validationResult } = require('express-validator');
const { Op } = require('sequelize');

const router = express.Router();

const validateSpot = [
  check('address').notEmpty().withMessage('Address is required'),
  check('city').notEmpty().withMessage('City is required'),
  check('state').notEmpty().withMessage('State is required'),
  check('country').notEmpty().withMessage('Country is required'),
  check('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  check('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  check('name').notEmpty().withMessage('Name is required'),
  check('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

const validateQueryFilters = [
  check('page').optional().isInt({ min: 1 }).withMessage('Page must be greater than or equal to 1'),
  check('size').optional().isInt({ min: 1, max: 20 }).withMessage('Size must be between 1 and 20'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

router.get('/', validateQueryFilters, async (req, res) => {
  try {
    let { page, size } = req.query;
    page = parseInt(page) || 1;
    size = parseInt(size) || 20;

    if (size > 20) size = 20;

    const spots = await Spot.findAll({
      limit: size,
      offset: (page - 1) * size,
      include: [
        { model: SpotImage, attributes: ['url'], where: { preview: true }, required: false },
        { model: Review, attributes: [] }
      ],
      attributes: {
        include: [
          [sequelize.fn('AVG', sequelize.col('Reviews.stars')), 'avgRating']
        ]
      },
      group: ['Spot.id'],
      subQuery: false
    });

    const formattedSpots = spots.map(spot => ({
      ...spot.toJSON(),
      lat: parseFloat(spot.lat),
      lng: parseFloat(spot.lng),
      price: parseFloat(spot.price),
      avgRating: spot.avgRating ? parseFloat(spot.avgRating) : null
    }));

    res.json({ Spots: formattedSpots, page, size });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/current', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const spots = await Spot.findAll({ where: { ownerId: userId } });
    res.json(spots);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const spot = await Spot.findByPk(req.params.id, { 
      include: [
        { model: SpotImage, attributes: ['id', 'url', 'preview'] },
        { model: User, as: 'Owner', attributes: ['id', 'firstName', 'lastName'] },
        { model: Review, attributes: [] }
      ],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('Reviews.id')), 'numReviews'],
          [sequelize.fn('AVG', sequelize.col('Reviews.stars')), 'avgStarRating']
        ]
      },
      group: ['Spot.id', 'SpotImages.id', 'Owner.id']
    });
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    
    const formattedSpot = {
      ...spot.toJSON(),
      lat: parseFloat(spot.lat),
      lng: parseFloat(spot.lng),
      price: parseFloat(spot.price),
      avgStarRating: spot.avgStarRating ? parseFloat(spot.avgStarRating) : null
    };
    res.json(formattedSpot);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/', requireAuth, validateSpot, async (req, res) => {
  try {
    const spot = await Spot.create({ ...req.body, ownerId: req.user.id });
    res.status(201).json(spot);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

router.post('/:id/images', requireAuth, async (req, res) => {
  try {
    const spotId = req.params.id;
    const { url, preview } = req.body;
    const spot = await Spot.findByPk(spotId);
    if (!spot) return res.status(404).json({ message: 'Spot couldn\'t be found' });
    if (spot.ownerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    const image = await SpotImage.create({ spotId, url, preview });
    const formattedResponse = {
      id: image.id,
      url: image.url,
      preview: image.preview
    };
    res.status(201).json(formattedResponse);
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

 straddrouter.put('/:id', requireAuth, validateSpot, async (req, res) => {
  try {
    const spotId = req.params.id;
    const { address, city, state, country, lat, lng, name, description, price } = req.body;
    const spot = await Spot.findByPk(spotId);
    if (!spot) return res.status(404).json({ message: 'Spot couldn\'t be found' });
    if (spot.ownerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await spot.update({ address, city, state, country, lat, lng, name, description, price });
    const formattedResponse = {
      id: spot.id,
      ownerId: spot.ownerId,
      address: spot.address,
      city: spot.city,
      state: spot.state,
      country: spot.country,
      lat: parseFloat(spot.lat),
      lng: parseFloat(spot.lng),
      name: spot.name,
      description: spot.description,
      price: parseFloat(spot.price),
      createdAt: spot.createdAt,
      updatedAt: spot.updatedAt
    };
    res.json(formattedResponse);
  } catch (err) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Bad Request', errors: errors.array() });
    }
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const spotId = req.params.id;
    const spot = await Spot.findByPk(spotId);
    if (!spot) return res.status(404).json({ message: 'Spot couldn\'t be found' });
    if (spot.ownerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await spot.destroy();
    res.json({ message: 'Successfully deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/:spotId/bookings', requireAuth, async (req, res) => {
  try {
    const { spotId } = req.params;
    const userId = req.user.id;

    const spot = await Spot.findByPk(spotId);
    if (!spot) return res.status(404).json({ error: 'Spot not found' });

    const bookings = await Booking.findAll({
      where: { spotId },
      include: {
        model: User,
        attributes: ['id', 'firstName', 'lastName'],
      },
    });

    if (spot.ownerId === userId) {
      return res.json(bookings);
    } else {
      const limitedBookings = bookings.map(booking => ({
        spotId: booking.spotId,
        startDate: booking.startDate,
        endDate: booking.endDate,
      }));
      return res.json(limitedBookings);
    }
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/:spotId/bookings', requireAuth, [
  check('startDate').isDate().withMessage('Start date is required and must be a valid date'),
  check('endDate').isDate().withMessage('End date is required and must be a valid date'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
], async (req, res) => {
  try {
    const { spotId } = req.params;
    const { startDate, endDate } = req.body;
    const userId = req.user.id;

    const spot = await Spot.findByPk(spotId);
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    if (spot.ownerId === userId) return res.status(403).json({ error: 'You cannot book your own spot' });

    const existingBookings = await Booking.findAll({
      where: {
        spotId,
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
          { [Op.and]: [
            { startDate: { [Op.lte]: startDate } },
            { endDate: { [Op.gte]: endDate } }
          ]}
        ]
      }
    });

    if (existingBookings.length > 0) {
      return res.status(403).json({ error: 'Booking conflicts with an existing reservation' });
    }

    const newBooking = await Booking.create({
      spotId,
      userId,
      startDate,
      endDate,
    });

    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;