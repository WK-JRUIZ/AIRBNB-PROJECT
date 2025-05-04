'use strict';

const express = require('express');
const { Spot, SpotImage, User, Review, Booking, ReviewImage } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { check, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { handleValidationErrors } = require('../../utils/validation');
const { sequelize } = require('../../db/models');

const router = express.Router();

const validateSpot = [
  check('address').notEmpty().withMessage('Street address is required'),
  check('city').notEmpty().withMessage('City is required'),
  check('state').notEmpty().withMessage('State is required'),
  check('country').notEmpty().withMessage('Country is required'),
  check('lat')
    .exists({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be within -90 and 90'),
  check('lng')
    .exists({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be within -180 and 180'),
  check('name')
    .exists({ checkFalsy: true })
    .isLength({ max: 50 })
    .withMessage('Name must be less than 50 characters'),
  check('description')
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage('Description is required'),
  check('price')
    .exists({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Price per day must be a positive number'),
  handleValidationErrors
];

const validateQueryFilters = [
  check('page').optional().isInt({ min: 1 }).withMessage('Page must be greater than or equal to 1'),
  check('size').optional().isInt({ min: 1, max: 20 }).withMessage('Size must be between 1 and 20'),
  handleValidationErrors 
];

const validateReview = [
  check('review')
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage('Review text is required'),
  check('stars')
    .exists({ checkFalsy: true })
    .isInt({ min: 1, max: 5 })
    .withMessage('Stars must be an integer from 1 to 5'),
    handleValidationErrors 
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
    if (!spot) return res.status(404).json({ error: 'Spot couldn\'t be found' });
    
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
    const formattedSpot = {
      id: spot.id,
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
    res.status(201).json(formattedSpot);
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
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

 router.put('/:id', requireAuth, validateSpot, async (req, res) => {
  try {
    const spotId = req.params.id;
    const { address, city, state, country, lat, lng, name, description, price } = req.body;
    const spot = await Spot.findByPk(spotId);
    if (!spot) return res.status(404).json({ message: 'Spot couldn\'t be found' });
    if (spot.ownerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await spot.update({ address, city, state, country, lat, lng, name, description, price });
    const formattedResponse = {
      id: spot.id,
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

router.post('/:spotId/bookings', requireAuth, async (req, res) => {
  try {
    const spotId = req.params.spotId;
    const { startDate, endDate } = req.body;
    const userId = req.user.id;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const spot = await Spot.findOne({ where: { id: spotId } });
    
    if (!spot) {
      return res.status(404).json({ error: 'Spot not found' });
    }
    
    if (spot.ownerId === userId) {
      return res.status(403).json({ 
        error: "Booking your own place? That's just staying home with a cleaning fee!" 
      });
    }

    const allBookings = await Booking.findAll({ where: { spotId } });
    
    const bookingStart = new Date(startDate);
    const bookingEnd = new Date(endDate);
    
    const hasConflict = allBookings.some(booking => {
      const existingStart = new Date(booking.startDate);
      const existingEnd = new Date(booking.endDate);
      
      return (
        (bookingStart >= existingStart && bookingStart <= existingEnd) ||
        (bookingEnd >= existingStart && bookingEnd <= existingEnd) ||
        (bookingStart <= existingStart && bookingEnd >= existingEnd)
      );
    });
    
    if (hasConflict) {
      return res.status(403).json({ error: 'Sorry, these dates are already booked' });
    }

    const booking = await Booking.create({
      spotId,
      userId,
      startDate,
      endDate
    });

    return res.status(201).json(booking);
    
  } catch (err) {
    console.log('Error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});
router.get('/:spotId/reviews', async (req, res) => {
  try {
    const spotId = req.params.spotId;

    const spot = await Spot.findByPk(spotId);
    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }
    
    const reviews = await Review.findAll({
      where: { spotId },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: ReviewImage,
          attributes: ['id', 'url']
        }
      ]
    });
    
    console.log('Found reviews:', reviews); 
    return res.json({ Reviews: reviews });
  } catch (err) {
    console.error('Error details:', err); 
    res.status(500).json({ message: 'Something went wrong' });
  }
});



router.post('/:spotId/reviews', requireAuth, validateReview, async (req, res) => {
  try {
    const spotId = req.params.spotId;
    const userId = req.user.id;
    const { review, stars } = req.body;

    const spot = await Spot.findByPk(spotId);
    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    const existingReview = await Review.findOne({ where: { spotId, userId } });
    if (existingReview) {
      return res.status(500).json({ message: "User already has a review for this spot" });
    }
  
    const newReview = await Review.create({ 
      spotId: parseInt(spotId), 
      userId, 
      review, 
      stars 
    });
    
    res.status(201).json(newReview);
  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});



module.exports = router;