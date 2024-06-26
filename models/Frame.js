require('dotenv').config();
const axios = require('axios');
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_URL = process.env.PINATA_HUB_URL;
const USER_FID = process.env.USER_FID;
const { Livepeer } = require("livepeer");
const apiKey = process.env.LIVEPEER_API_KEY;
const default_banner_image = 'https://imaginewares.s3.us-west-2.amazonaws.com/static/txt2img/generations/generation_15_190f32.png';

const livepeer = new Livepeer({ apiKey });

const extractUrls = (text) => {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRegex);
  return urls || [];
};

async function listFrameKeys() {
  const pinataHeaders = {
    'Authorization': `Bearer ${PINATA_API_KEY}`,
  }
  const castListData = await axios.get(`${PINATA_API_URL}/castsByFid?fid=${USER_FID}`, { 'headers': pinataHeaders });

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


async function getActiveFrames() {
  const pinataHeaders = {
    'Authorization': `Bearer ${PINATA_API_KEY}`,
  }
  const castListData = await axios.get(`${PINATA_API_URL}/castsByFid?fid=${USER_FID}`, { 'headers': pinataHeaders });

  const castList = castListData.data.messages;

  const castListContentMap = castList.map((cast) => {
    console.log(cast);
    if (!cast.data.castAddBody) return;
    const messageText = cast.data.castAddBody.text;
    const urls = extractUrls(messageText);

    const embeds = cast.data.castAddBody.embeds;
    let embedUrl;
    if (embeds && embeds.length > 0) {
      const embed = embeds[0];
      embedUrl = embed.url;

    }
    if (urls.length === 0) return;

    const activeURL = urls[0];

    if ((activeURL && !activeURL.includes('gm-casts')) && (embedUrl && !embedUrl.includes('gm-casts'))) {
      return
    }
    if (embedUrl && embedUrl.includes('gm-casts')) {
      const urlParts = embedUrl.split('/');
      const urlKey = urlParts[urlParts.length - 1];
      if (urlKey) {
        return cast;
      }
    } else if (activeURL && activeURL.includes('gm-casts')) {
      const urlParts = activeURL.split('/');
      const urlKey = urlParts[urlParts.length - 1];
      if (urlKey) {
        return cast;
      }
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

    console.log(responseJson.meta.source);
    console.log("*****");
    
    let imageSource = responseJson.meta.source.find((source) => (source.hrn && source.hrn.toLowerCase().includes('thumbnail')));
    if (imageSource) {
      retPayload.image = imageSource.url;
    } else {
      retPayload.image = default_banner_image;
    }

  }

  const videoHLSItem = responseJson.meta.source.find((source) => (source.hrn && source.hrn.toLowerCase().includes('hls')));

  if (videoHLSItem) {
    retPayload.videoHLS = videoHLSItem.url;
    retPayload.videoHLSType = videoHLSItem.type;
  }

  const videoWebRTCItem = responseJson.meta.source.find((source) => (source.hrn && source.hrn.toLowerCase().includes('webrtc')));

  if (videoWebRTCItem) {
    retPayload.videoWebRTC = videoWebRTCItem.url;
    retPayload.videoWebRTCType = videoWebRTCItem.type;
  }
  
  retPayload.state = playbackId;
  retPayload.post_url = `${STREAMER_SERVER}/frames/frame_preview`;

  return retPayload;

}

async function generatePreviewFrame(payload) {
  console.log(payload);
  const { untrustedData: { url } } = payload

  const playbackId = url.split('/').pop();
  const response = await livepeer.playback.get(playbackId);
  const responseJson = JSON.parse(response.rawResponse.data.toString());

  console.log(responseJson.meta.source);


  const thumbailItem = responseJson.meta.source.find((source) => (source.hrn && source.hrn.toLowerCase().includes('thumbnail')));


  const hlsVideoItem = responseJson.meta.source.find((source) => (source.hrn && source.hrn.toLowerCase().includes('hls')));

  let imageURL = default_banner_image;
  if (thumbailItem) {
    imageURL = thumbailItem.url;
  }

  const wrtcVideoItem = responseJson.meta.source.find((source) => (source.hrn && source.hrn.toLowerCase().includes('webrtc')));



  const returnData = (`
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="fc:frame" content="vNext" />
    <meta name="fc:frame:image" content="${imageURL}" />
    <meta name="og:image" content="${imageURL}" />
    <meta name="fc:frame:video_hls" content="${hlsVideoItem.url}" />
    <meta name="fc:frame:video_hls:type" content="${hlsVideoItem.type}" />
    <meta name="fc:frame:video_webrtc" content="${wrtcVideoItem.url}" />
    <meta name="fc:frame:video_webrtc:type" content="${wrtcVideoItem.type}" />

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
  generatePreviewFrame,
  getActiveFrames
};