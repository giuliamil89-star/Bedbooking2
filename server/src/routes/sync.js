const express = require('express');
const { syncAllFeeds } = require('../icalSync');

const router = express.Router();

router.post('/', async (req, res) => {
  const results = await syncAllFeeds();
  res.json({ results });
});

module.exports = router;
