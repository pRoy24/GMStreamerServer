
var express = require('express');
var router = express.Router();

const { listFrameKeys } = require('../models/Frame');

/* GET users listing. */
router.get('/list', async function(req, res, next) {
  const fk = await listFrameKeys();
  res.send(fk);
});


router.get('/cast', function(req, res, next) {
  handler();
  res.send('respond with a resource');
});

module.exports = router;

