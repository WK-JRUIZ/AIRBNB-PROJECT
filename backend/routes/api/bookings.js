const express = require('express');
const { Booking, Spot, User, SpotImage } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { Op } = require('sequelize');
const { requireAuth } = require('../../utils/auth');

const router = express.Router();

const validateBooking = [
  check('startDate')
    .exists({ checkFalsy: true })
    .withMessage('Start date is required.')
    .isDate()
    .withMessage('Start date must be a valid date.')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Start date cannot be in the past.');
      }
      return true;
    }),
  check('endDate')
    .exists({ checkFalsy: true })
    .withMessage('End date is required.')
    .isDate()
    .withMessage('End date must be a valid date.')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after the start date.');
      }
      return true;
    }),
  handleValidationErrors,
];

router.get('/current', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const bookings = await Booking.findAll({
    where: { userId },
    include: [
      {
        model: Spot,
        include: [
          {
            model: SpotImage,
            attributes: ['url'],
            where: { preview: true },
            required: false,
          },
        ],
      },
    ],
  });

  const bookingsList = bookings.map((booking) => ({
    id: booking.id,
    spotId: booking.spotId,
    userId: booking.userId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    spot: booking.Spot,
  }));

  return res.json({ bookings: bookingsList });
});

router.put('/:bookingId', requireAuth, validateBooking, async (req, res) => {
  const { bookingId } = req.params;
  const { startDate, endDate } = req.body;
  const booking = await Booking.findByPk(bookingId);
    if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }
    if (booking.userId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
    if (new Date(booking.startDate) < new Date()) {
    return res.status(403).json({ message: 'Booking has already started' });
  }
    const conflictingBookings = await Booking.findAll({
    where: {
      spotId: booking.spotId,
      [Op.or]: [
        { startDate: { [Op.lte]: endDate }, endDate: { [Op.gte]: startDate } },
        { startDate: { [Op.gte]: startDate, [Op.lte]: endDate } },
      ],
    },
  });

  if (conflictingBookings.length > 0) {
    return res.status(403).json({ message: 'Booking conflicts with another booking' });
  }

  booking.startDate = startDate;
  booking.endDate = endDate;
  await booking.save();

  return res.json(booking);
});

router.delete('/:bookingId', requireAuth, async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findByPk(bookingId, { include: Spot });

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  if (booking.userId !== req.user.id && booking.Spot.userId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (new Date(booking.startDate) < new Date()) {
    return res.status(403).json({ message: 'Booking has already started' });
  }

  await booking.destroy();
  return res.json({ message: 'Successfully deleted booking' });
});

module.exports = router;