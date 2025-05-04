const express = require('express');
const { ReviewImage, Review } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const router = express.Router();

router.delete('/:imageId', requireAuth, async (req, res) => {
  const imageId = req.params.imageId;
  const userId = req.user.id;
  const reviewImage = await ReviewImage.findByPk(imageId);

  if (!reviewImage) {
    res.status(404).json({ message: "Review Image couldn't be found" });
    return;
  }
  const review = await Review.findByPk(reviewImage.reviewId);

  if (review.userId !== userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }   await reviewImage.destroy();
  res.json({ message: "Successfully deleted" });
});

module.exports = router;