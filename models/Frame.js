require('dotenv').config();
const axios = require('axios');
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_URL = process.env.PINATA_HUB_URL;
const USER_FID = process.env.USER_FID;


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


module.exports = {
  listFrameKeys
};