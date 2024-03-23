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
const FRAME_BASE_URL = process.env.FRAME_BASE_URL;

const privateKeyBytes = hexToBytes(ACCOUNT_PRIVATE_KEY.slice(2));
const ed25519Signer = new NobleEd25519Signer(privateKeyBytes);


async function createNewCast(payload) {

  const { playbackId } = payload

  const frameURL = `${FRAME_BASE_URL}/${playbackId}`

  const dataOptions = {
    fid: FID,
    network: FarcasterNetwork.MAINNET,
  };


  const castAddReq = await makeCastAdd(
    {
      text: `${frameURL}`,
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
  // const hashList = ['0x667dc276648cac484f890488c0db856f67801407', '0x73cca418242ffff9eefa4188ff8dd71e6423ead6'];

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



    if (currentCastData) {
  
      const createdCastHash = currentCastData.hash;

      console.log(createdCastHash);
      const hex = hexToBytes(createdCastHash.slice(2))

      const castRemoveReq = await makeCastRemove({
        targetHash: createdCastHash,
      }, dataOptions, ed25519Signer);

      const messageResponse = await hubClient.submitMessage(castRemoveReq._unsafeUnwrap());
      console.log(messageResponse);
      console.log("EE TTT")

    }


  }

}

module.exports = {

  createNewCast,
  removeAllCasts
};
