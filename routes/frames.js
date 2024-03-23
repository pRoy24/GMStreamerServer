require('dotenv').config();

var express = require('express');
var router = express.Router();

const { listFrameKeys, getFrameInitMetadata } = require('../models/Frame');

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
  const FRAME_BASE_URL = process.env.FRAME_BASE_URL;
  res.setHeader('Location', `${FRAME_BASE_URL}/frame_page/preview/${req.body.state}`);
  res.statusCode = 302;
  res.end();

});

router.get('/cast', function(req, res, next) {
  handler();
  res.send('respond with a resource');
});

module.exports = router;

