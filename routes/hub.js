var express = require('express');
var router = express.Router();

const { setupHubbleValues , } = require('../models/Hubble');
const { removeAllCasts, createNewCast } = require('../models/Cast');
/* GET users listing. */
router.get('/setup', function(req, res, next) {
  setupHubbleValues();

  
  res.send('respond with a resource');
});


router.post('/cast', function(req, res, next) {
  createNewCast(req.body);
  res.send('respond with a resource');
});

router.get('/remove_all', async function(req, res){ 
  //removeAllCasts();
})

module.exports = router;
