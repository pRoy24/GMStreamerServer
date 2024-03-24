

const axios = require('axios');
const cheerio = require('cheerio');

async function extractMeta(url) {
    try {
        const response = await axios.get(url);
        const html = response.data; // Axios stores the response body in `data`
        const $ = cheerio.load(html);

        const metaTags = {
            'fc:frame:video': $('meta[property="fc:frame:video"]').attr('content'),
            'fc:frame:video:type': $('meta[property="fc:frame:video:type"]').attr('content'),
            'fc:frame:image': $('meta[property="fc:frame:image"]').attr('content'),
            'og:image': $('meta[property="og:image"]').attr('content'),
        };

        console.log(metaTags);
        return metaTags;
    } catch (error) {
        console.error("Error fetching or parsing HTML:", error);
        throw error;
    }
}



module.exports = {
  extractMeta
}