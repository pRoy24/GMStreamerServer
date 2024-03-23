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

  let retPayload = {
    buttons: [
      {
        text: "Preview",
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

  return retPayload;

}
module.exports = {
  listFrameKeys,
  getFrameInitMetadata
};