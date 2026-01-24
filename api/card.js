const fetch = require('node-fetch');
const cheerio = require('cheerio');
const Jimp = require('jimp');

const LOGOS = {
    spotify: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.485 17.306c-.215.354-.675.467-1.03.251-2.859-1.748-6.458-2.143-10.697-1.175-.406.093-.812-.162-.905-.568-.093-.406.162-.812.568-.905 4.63-1.059 8.625-.61 11.813 1.34.354.215.467.675.251 1.03zm1.464-3.26c-.271.44-.847.579-1.287.308-3.27-2.008-8.254-2.59-12.122-1.415-.497.151-1.023-.131-1.174-.628-.151-.497.131-1.023.628-1.174 4.414-1.34 9.907-.69 13.648 1.605.44.271.579.847.307 1.287h.001zm.142-3.41c-3.922-2.329-10.395-2.545-14.156-1.404-.602.183-1.24-.165-1.423-.767-.183-.602.165-1.24.767-1.423 4.314-1.309 11.458-1.053 15.965 1.623.541.321.717 1.02.396 1.561-.321.541-1.02.717-1.561.396l.012.014z",
    ytmusic: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 17.75c-3.176 0-5.75-2.574-5.75-5.75s2.574-5.75 5.75-5.75 5.75 2.574 5.75 5.75-2.574 5.75-5.75 5.75zm0-10.5c-2.623 0-4.75 2.127-4.75 4.75s2.127 4.75 4.75 4.75 4.75-2.127 4.75-4.75-2.127-4.75-4.75-4.75zm-1.5 7.25l4-2.5-4-2.5v5z"
};
const LOGO_COLORS = { spotify: "#1DB954", ytmusic: "#FF0000" };

module.exports = async (req, res) => {
    const { link } = req.query;

    if (!link) {
        return res.status(400).send('Error: Missing "link" parameter provided');
    }

    try {
        let data = { title: 'Unknown', author: 'Unknown Artist', image: '', platform: '' };

        if (link.includes('spotify.com')) {
            data = await fetchSpotifyData(link);
            data.platform = 'spotify';
        } else if (link.includes('youtube.com') || link.includes('youtu.be')) {
            data = await fetchYouTubeData(link);
            data.platform = 'ytmusic';
        } else {
            throw new Error('Unsupported link type');
        }

        const { base64Image, bgColor } = await processImage(data.image);
        const svg = generateSVG(data, base64Image, bgColor);

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); 
        res.status(200).send(svg);

    } catch (e) {
        console.error(e);
        res.status(500).send('Internal Server Error during card generation');
    }
};

async function fetchYouTubeData(url) {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) throw new Error('YT oEmbed fetch failed');
    const json = await response.json();
    return {
        title: json.title,
        author: json.author_name.replace(' - Topic', ''),
        image: json.thumbnail_url.replace('hqdefault', 'maxresdefault')
    };
}

async function fetchSpotifyData(url) {
    constproxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const json = await response.json();
    
    const $ = cheerio.load(json.contents);
    const title = $('meta[property="og:title"]').attr('content') || 'Unknown Title';
    const description = $('meta[property="og:description"]').attr('content') || '';
    const image = $('meta[property="og:image"]').attr('content') || '';
    
    let author = description.includes(' · ') ? description.split(' · ')[1] : description;

    return { title, author, image };
}

async function processImage(imageUrl) {
    const imgResp = await fetch(imageUrl);
    const buffer = await imgResp.buffer();

    const image = await Jimp.read(buffer);
    
    image.resize(240, 240).quality(80);

    const pixel = image.clone().resize(1, 1);
    const colorHex = pixel.getPixelColor(0, 0);
    const rgba = Jimp.intToRGBA(colorHex);

    const r = Math.floor(rgba.r * 0.7);
    const g = Math.floor(rgba.g * 0.7);
    const b = Math.floor(rgba.b * 0.7);
    const bgColor = `rgb(${r},${g},${b})`;

    const base64Image = await image.getBase64Async(Jimp.MIME_JPEG);
    
    return { base64Image, bgColor };
}

function generateSVG(data, base64Image, bgColor) {
    const escape = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const title = escape(data.title);
    const author = escape(data.author);
    const logoPath = LOGOS[data.platform];
    const logoColor = LOGO_COLORS[data.platform];

    return `
<svg width="600" height="300" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
        <clipPath id="round-corner">
            <rect x="30" y="30" width="240" height="240" rx="12" ry="12"/>
        </clipPath>
        <style>
            .title { fill: white; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 32px; font-weight: bold; }
            .author { fill: rgba(255,255,255,0.7); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 18px; }
        </style>
    </defs>

    <rect width="600" height="300" rx="24" ry="24" fill="${bgColor}" />

    <rect x="30" y="30" width="240" height="240" rx="12" ry="12" fill="#000"/>
    <image x="30" y="30" width="240" height="240" clip-path="url(#round-corner)" xlink:href="${base64Image}" preserveAspectRatio="xMidYMid slice" />

    <svg x="538" y="30" width="32" height="32" viewBox="0 0 24 24" fill="${logoColor}">
        <path d="${logoPath}"/>
    </svg>

    <text x="300" y="140" class="title">${title}</text>
    <text x="300" y="170" class="author">${author}</text>

    <circle cx="542" cy="242" r="28" fill="white" />
    <path d="M546 242L536 232V252L546 242Z" fill="black" transform="translate(4, 0)"/>
</svg>
    `.trim();
}
