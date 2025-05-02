const express = require('express');
const router = express.Router();
const apiRouter = require('./api');

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Airbnb Project API!' });
});

router.use('/api', apiRouter);

module.exports = router;        