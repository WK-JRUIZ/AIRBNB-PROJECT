'use strict';

const express = require('express');
const { Review, ReviewImage, User, Spot, SpotImage } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { Op } = require('sequelize');

const router = express.Router();

const validateReview = [
  check('review')
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage('Type a review'),
  check('stars')
    .exists({ checkFalsy: true })
    .isInt({ min: 1, max: 5 })
    .withMessage('Stars must be a number from 1 to 5'),
  handleValidationErrors
];

router.get('/current', requireAuth, async (req, res) => {
  const userId = req.user.id;

  const reviews = await Review.findAll({
    where: { userId },
    include: [
      { model: User, attributes: ['id', 'firstName', 'lastName'] },
      {
        model: Spot,
        attributes: ['id', 'ownerId', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'price'],
        include: [
          { model: SpotImage, attributes: ['id', 'url'], where: { preview: true }, required: false }
        ]
      },
      { model: ReviewImage, attributes: ['id', 'url'] }
    ]
  });

  const formattedReviews = reviews.map(review => {
    const spot = review.Spot ? {
      ...review.Spot.toJSON(),
      previewImage: review.Spot.SpotImages.length ? review.Spot.SpotImages[0].url : null
    } : null;

    return {
      id: review.id,
      userId: review.userId,
      spotId: review.spotId,
      review: review.review,
      stars: review.stars,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      User: review.User,
      Spot: spot,
      ReviewImages: review.ReviewImages
    };
  });

  return res.json({ Reviews: formattedReviews });
});

router.post('/:reviewId/images', requireAuth, async (req, res) => {
  const { reviewId } = req.params;
  const { url } = req.body;
  const userId = req.user.id;

  const review = await Review.findByPk(reviewId);
  if (!review) {
    return res.status(404).json({ message: "Review couldn't be found" });
  }

  if (review.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const imageCount = await ReviewImage.count({ where: { reviewId } });
  if (imageCount >= 10) {
    return res.status(403).json({ message: 'Maximum number of images for this resource was reached' });
  }

  const newImage = await ReviewImage.create({ reviewId, url });
  return res.status(201).json({ id: newImage.id, url: newImage.url });
});

module.exports = router;