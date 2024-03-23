require('dotenv').config();
const axios = require('axios');
const {
  makeCastAdd,
  makeCastRemove,
  makeLinkAdd,
  makeLinkRemove,
  makeReactionAdd,
  makeReactionRemove,
  getSSLHubRpcClient,
  makeUserDataAdd,
  NobleEd25519Signer,
  FarcasterNetwork,
} = require('@farcaster/hub-nodejs');

const { hexToBytes } = require("@noble/hashes/utils");

const ACCOUNT_PRIVATE_KEY = process.env.ACC_PRIVATE_KEY; // Your account key's private key
const FID = process.env.USER_FID; // Your fid

const hubRpcEndpoint = 'hub-grpc.pinata.cloud';
const hubClient = getSSLHubRpcClient(hubRpcEndpoint);

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_URL = process.env.PINATA_HUB_URL;
const USER_FID = process.env.USER_FID;

const privateKeyBytes = hexToBytes(ACCOUNT_PRIVATE_KEY.slice(2));
const ed25519Signer = new NobleEd25519Signer(privateKeyBytes);


async function createNewCast(req) {

  const dataOptions = {
    fid: FID,
    network: FarcasterNetwork.MAINNET,
  };


  const castAddReq = await makeCastAdd(
    {
      text: "This is a cast with no mentions",
      embeds: [],
      embedsDeprecated: [],
      mentions: [],
      mentionsPositions: [],
    },
    dataOptions,
    ed25519Signer,
  );


  const cast = castAddReq._unsafeUnwrap();


  const messageResponse = await hubClient.submitMessage(cast);


  return (messageResponse);

}


async function removeAllCasts() {

  const dataOptions = {
    fid: FID,
    network: FarcasterNetwork.MAINNET,
  };


  const pinataHeaders = {
    'Authorization': `Bearer ${PINATA_API_KEY}`,
  }
  const castListData = await axios.get(`${PINATA_API_URL}/castsByFid?fid=${USER_FID}`, { 'headers': pinataHeaders });

  const castList = castListData.data.messages;





  for (let i = 0; i < castList.length; i++) {
    const currentCastData = castList[i];

    const ed25519Signer = new NobleEd25519Signer(privateKeyBytes);


  //  const createdCastReq = await makeCastAdd(castAddBody, dataOptions, ed25519Signer);
   // const createdCast = createdCastReq._unsafeUnwrap();

    if (currentCastData) {
  
      const createdCastHash = currentCastData.hash;

      console.log(createdCastHash);

      const castRemoveReq = await makeCastRemove({
        targetHash: createdCastHash,
      }, dataOptions, ed25519Signer);

      const messageResponse = await hubClient.submitMessage(castRemoveReq._unsafeUnwrap());

    }


  }

}

module.exports = {

  createNewCast,
  removeAllCasts
};
