require('dotenv').config();

var express = require('express');
var router = express.Router();

const { listFrameKeys, getFrameInitMetadata , generatePreviewFrams} = require('../models/Frame');

/* GET users listing. */
router.get('/list', async function(req, res, next) {
  const fk = await listFrameKeys();
  res.send(fk);
});


router.get('/init_metadata', async function(req, res) {
  const { id } = req.query;
  const frame = await getFrameInitMetadata(id);
  res.send(frame);
});


router.post('/frame_preview', async function(req, res) {

  console.log(req.body);
  const { untrustedData: {url}} = req.body;
  console.log(url);
  const playbackId = url.split('/').pop();

  await generatePreviewFrams(req.body);
});

router.get('/cast', function(req, res, next) {
  handler();
  res.send('respond with a resource');
});

module.exports = router;

