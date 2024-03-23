var express = require('express');
var router = express.Router();
require('dotenv').config();
const { spawn } = require('child_process');


/* GET home page. */
router.get('/start_stream', function(req, res, next) {
  const streamKey = req.query.streamKey;
  const RMTP_URL = process.env.RMTP_URL;

  // Specify the path to your video file
  const pwd = process.cwd();

  const pathToVideo = `${pwd}/resources/3.mp4`;

  const rtmpUrl = `${RMTP_URL}${streamKey}`;

  // Spawn an ffmpeg process to stream video to Livepeer
  const ffmpegProcess = spawn('ffmpeg', [
    '-re',
    '-i', pathToVideo,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-maxrate', '3000k',
    '-bufsize', '6000k',
    '-pix_fmt', 'yuv420p',
    '-g', '50',
    '-c:a', 'aac',
    '-b:a', '160k',
    '-ar', '44100',
    '-f', 'flv',
    rtmpUrl
  ]);

  ffmpegProcess.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`ffmpeg process exited with code ${code}`);
  });


});

module.exports = router;
