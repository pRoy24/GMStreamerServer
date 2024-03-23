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
  console.log(responseJson);

  const STREAMER_SERVER = process.env.STREAMER_SERVER;

  let retPayload = {
    buttons: [
      {
        text: "Preview",
        action: "post_redirect",
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

  const returnData = (`<html>
  <head>
    <title>Frame Preview</title>
    <meta name="fc:frame" content="vNext" />
    <meta name="of:accepts:xmtp" content='vNext' />
    <meta name="of:accepts:farcaster" content="vNext" />
    <meta name="of:version" content="vNext" />
    <meta name="fc:frame:image" content="https://imaginewares.s3.us-west-2.amazonaws.com/static/txt2img/generations/generation_15_190f32.png" />
    <meta name="fc:frame:button:1" content="Preview" />
    <meta name="fc:frame:button:1:post" content="https://gm-casts.vercel.app/api/frame_preview" />
    <meta name="fc:frame:button:1:action" content="post_redirect" />
    <meta name="fc:frame:state" content="https://livepeer.com/api/playback/${url}" />
    <meta name="fc:frame:post" content="https://gm-casts.vercel.app/api/frame_preview" />
    <meta name="fc:frame:video" content""/>
  </head>
  <body>
    <h1>Frame Preview</h1>
  </body>
  </html>`);
}
module.exports = {
  listFrameKeys,
  getFrameInitMetadata,
  generatePreviewFrame
};