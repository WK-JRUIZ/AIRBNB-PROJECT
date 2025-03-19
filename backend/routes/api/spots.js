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

router.get('/', async (req, res) => {
  try {
    let { page, size } = req.query;
    page = parseInt(page) || 1;
    size = parseInt(size) || 20;
    
    const spots = await Spot.findAll({
      limit: size,
      offset: (page - 1) * size,
      include: [SpotImage, User]
    });

    res.json({ spots, page, size });
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
    const spot = await Spot.findByPk(req.params.id, { include: [SpotImage, User] });
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    res.json(spot);
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
    const { url } = req.body;
    const spot = await Spot.findByPk(req.params.id);
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    if (spot.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const image = await SpotImage.create({ spotId: spot.id, url });
    res.status(201).json(image);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.put('/:id', requireAuth, validateSpot, async (req, res) => {
  try {
    const spot = await Spot.findByPk(req.params.id);
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    if (spot.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await spot.update(req.body);
    res.json(spot);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const spot = await Spot.findByPk(req.params.id);
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    if (spot.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await spot.destroy();
    res.json({ message: 'Spot deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
