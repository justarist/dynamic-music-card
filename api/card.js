const axios = require('axios');
const cheerio = require('cheerio');
const Jimp = require('jimp');

const LOGOS = {
    spotify: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.485 17.306c-.215.354-.675.467-1.03.251-2.859-1.748-6.458-2.143-10.697-1.175-.406.093-.812-.162-.905-.568-.093-.406.162-.812.568-.905 4.63-1.059 8.625-.61 11.813 1.34.354.215.467.675.251 1.03zm1.464-3.26c-.271.44-.847.579-1.287.308-3.27-2.008-8.254-2.59-12.122-1.415-.497.151-1.023-.131-1.174-.628-.151-.497.131-1.023.628-1.174 4.414-1.34 9.907-.69 13.648 1.605.44.271.579.847.307 1.287h.001zm.142-3.41c-3.922-2.329-10.395-2.545-14.156-1.404-.602.183-1.24-.165-1.423-.767-.183-.602.165-1.24.767-1.423 4.314-1.309 11.458-1.053 15.965 1.623.541.321.717 1.02.396 1.561-.321.541-1.02.717-1.561.396l.012.014z",
    ytmusic: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 17.75c-3.176 0-5.75-2.574-5.75-5.75s2.574-5.75 5.75-5.75 5.75 2.574 5.75 5.75-2.574 5.75-5.75 5.75zm0-10.5c-2.623 0-4.75 2.127-4.75 4.75s2.127 4.75 4.75 4.75 4.75-2.127 4.75-4.75-2.127-4.75-4.75-4.75zm-1.5 7.25l4-2.5-4-2.5v5z"
};

module.exports = async (req, res) => {
    const { link } = req.query;
    if (!link) return res.status(400).send('No link provided');

    try {
        let data = {};
        
        if (link.includes('spotify.com')) {
            const response = await axios.get(link, { 
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9'
                } 
            });
            const $ = cheerio.load(response.data);
            
            const ogTitle = $('meta[property="og:title"]').attr('content') || "";
            const ogDesc = $('meta[property="og:description"]').attr('content') || "";
            const twitterData1 = $('meta[name="twitter:data1"]').attr('content') || "";
            
            let title = ogTitle;
            let author = "Unknown Artist";

            if (twitterData1 && !twitterData1.includes(':')) {
                author = twitterData1;
            } 
            else if (ogDesc.includes(' · ')) {
                const parts = ogDesc.split(' · ');
                author = (parts[0].toLowerCase() !== title.toLowerCase()) ? parts[0] : parts[1];
            }
            else {
                const pageTitle = $('title').text();
                if (pageTitle.includes(' | Spotify')) {
                    const cleanTitle = pageTitle.replace(' | Spotify', '');
                    if (cleanTitle.includes(' - song by ')) {
                        author = cleanTitle.split(' - song by ')[1];
                    }
                }
            }

            data = {
                title: title,
                author: author.trim(),
                image: $('meta[property="og:image"]').attr('content'),
                platform: 'spotify',
                color: "#1DB954"
            };
        } else {
            const oembed = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(link)}&format=json`);
            data = {
                title: oembed.data.title,
                author: oembed.data.author_name.replace(' - Topic', ''),
                image: oembed.data.thumbnail_url.replace('hqdefault', 'maxresdefault'),
                platform: 'ytmusic',
                color: "#FF0000"
            };
        }

        const imgResp = await axios.get(data.image, { responseType: 'arraybuffer' });
        const image = await Jimp.read(imgResp.data);
        image.cover(240, 240);
        
        const cp = image.clone().resize(1, 1);
        const rgba = Jimp.intToRGBA(cp.getPixelColor(0, 0));
        const bgColor = `rgb(${Math.floor(rgba.r * 0.8)}, ${Math.floor(rgba.g * 0.8)}, ${Math.floor(rgba.b * 0.8)})`;
        const base64 = await image.getBase64Async(Jimp.MIME_JPEG);

        const titleWidth = data.title.length * 14; 
        const authorWidth = data.author.length * 9;
        const containerWidth = 260;

        const svg = `
        <svg width="600" height="300" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
            <rect width="600" height="300" rx="25" fill="${bgColor}"/>
            
            <clipPath id="c"><rect x="30" y="30" width="240" height="240" rx="15"/></clipPath>
            <image href="${base64}" x="30" y="30" width="240" height="240" clip-path="url(#c)"/>
            
            <path d="${LOGOS[data.platform]}" fill="${data.color}" transform="translate(540, 30) scale(1.3)"/>
            
            <svg x="300" y="100" width="${containerWidth}" height="100" viewBox="0 0 ${containerWidth} 100">
                <defs>
                    <clipPath id="textClip"><rect width="${containerWidth}" height="100" /></clipPath>
                </defs>

                <g clip-path="url(#textClip)">
                    <text y="30" font-family="sans-serif" font-size="28" font-weight="bold" fill="white">
                        ${data.title}
                        ${titleWidth > containerWidth ? `
                            <animate attributeName="x" from="0" to="-${titleWidth - containerWidth + 40}" dur="8s" repeatCount="indefinite" begin="1s" />
                        ` : ''}
                    </text>
                </g>
                
                <g clip-path="url(#textClip)">
                    <text y="65" font-family="sans-serif" font-size="18" fill="#ccc">
                        ${data.author}
                        ${authorWidth > containerWidth ? `
                            <animate attributeName="x" from="0" to="-${authorWidth - containerWidth + 40}" dur="8s" repeatCount="indefinite" begin="1s" />
                        ` : ''}
                    </text>
                </g>
            </svg>

            <circle cx="540" cy="240" r="25" fill="white"/>
            <path d="M545 240l-10-7v14z" fill="black"/>
        </svg>`;

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).send(svg);

    } catch (e) {
        res.status(500).send(`Error: ${e.message}`);
    }
};
