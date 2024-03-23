require('dotenv').config();
const axios = require('axios');
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_URL = process.env.PINATA_HUB_URL;
const USER_FID = process.env.USER_FID;
const { Livepeer } = require("livepeer");
const apiKey = process.env.LIVEPEER_API_KEY;
const default_banner_image = 'https://imaginewares.s3.us-west-2.amazonaws.com/static/txt2img/generations/generation_15_190f32.png';

const livepeer = new Livepeer({apiKey});

const extractUrls = (text) => {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRegex);
  return urls || [];
};

async function listFrameKeys() {
  const pinataHeaders = {
    'Authorization': `Bearer ${PINATA_API_KEY}`,
  }
  const castListData = await axios.get(`${PINATA_API_URL}/castsByFid?fid=${USER_FID}`, {'headers': pinataHeaders});

  const castList = castListData.data.messages;

  const castListContentMap = castList.map((cast) => {
    console.log(cast);
    if (!cast.data.castAddBody) return;
    const messageText = cast.data.castAddBody.text;
    const urls = extractUrls(messageText);

    if (urls.length === 0) return;

    const activeURL = urls[0];

    if (!activeURL.includes('gm-casts')) {
      return
    }

    const urlParts = activeURL.split('/');
    const urlKey = urlParts[urlParts.length - 1];
    if (urlKey) {
      return urlKey;
    } else {
      return;
    }
  }).filter(Boolean);

  return castListContentMap;

}


async function getFrameInitMetadata(id) {
  const playbackId = id;
  const response = await livepeer.playback.get(playbackId);
  const responseJson = JSON.parse(response.rawResponse.data.toString());

  const STREAMER_SERVER = process.env.STREAMER_SERVER;

  let retPayload = {
    buttons: [
      {
        text: "Preview",
        action: "post",
        post_url: `${STREAMER_SERVER}/frames/frame_preview`
      }
    ],
  }
  if (responseJson.meta.source) {
    let imageSource = responseJson.meta.source.find((source) => (source.hrm && source.hrn.toLowerCase().contains('thumbnail')));
    if (imageSource) {
      retPayload.image = imageSource.uri;
    } else {
      retPayload.image = default_banner_image;
    }

  }
  retPayload.state = playbackId;
  retPayload.post_url = `${STREAMER_SERVER}/frames/frame_preview`;

  return retPayload;

}

async function generatePreviewFrame(payload) {
  console.log(payload);
  const { untrustedData: {url}} = payload

  const playbackId = url.split('/').pop();
  const response = await livepeer.playback.get(playbackId);
  const responseJson = JSON.parse(response.rawResponse.data.toString());

  console.log(responseJson.meta.source);

  const thumbailItem = responseJson.meta.source.find((source) => (source.hrm && source.hrn.toLowerCase().contains('thumbnail')));

  console.log(thumbailItem);

  const videoItem = responseJson.meta.source.find((source) => (source.hrm && source.hrn.toLowerCase().contains('hls')));

  console.log(videoItem);

  const returnData = (`
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="fc:frame" content="vNext" />
    <meta name="fc:frame:image" content="https://imaginewares.s3.us-west-2.amazonaws.com/static/txt2img/generations/generation_15_190f32.png" />
    <meta name="og:image" content="https://imaginewares.s3.us-west-2.amazonaws.com/static/txt2img/generations/generation_15_190f32.png" />

  </head>
  <body>
    <h1>Frame Preview</h1>
  </body>
  </html>`);
  return returnData;
}
module.exports = {
  listFrameKeys,
  getFrameInitMetadata,
  generatePreviewFrame
};