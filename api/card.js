const axios = require('axios');
const cheerio = require('cheerio');
const Jimp = require('jimp');

const LOGOS = {
    spotify: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.485 17.306c-.215.354-.675.467-1.03.251-2.859-1.748-6.458-2.143-10.697-1.175-.406.093-.812-.162-.905-.568-.093-.406.162-.812.568-.905 4.63-1.059 8.625-.61 11.813 1.34.354.215.467.675.251 1.03zm1.464-3.26c-.271.44-.847.579-1.287.308-3.27-2.008-8.254-2.59-12.122-1.415-.497.151-1.023-.131-1.174-.628-.151-.497.131-1.023.628-1.174 4.414-1.34 9.907-.69 13.648 1.605.44.271.579.847.307 1.287h.001zm.142-3.41c-3.922-2.329-10.395-2.545-14.156-1.404-.602.183-1.24-.165-1.423-.767-.183-.602.165-1.24.767-1.423 4.314-1.309 11.458-1.053 15.965 1.623.541.321.717 1.02.396 1.561-.321.541-1.02.717-1.561.396l.012.014z",
    ytmusic: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 17.75c-3.176 0-5.75-2.574-5.75-5.75s2.574-5.75 5.75-5.75 5.75 2.574 5.75 5.75-2.574 5.75-5.75 5.75zm0-10.5c-2.623 0-4.75 2.127-4.75 4.75s2.127 4.75 4.75 4.75 4.75-2.127 4.75-4.75-2.127-4.75-4.75-4.75zm-1.5 7.25l4-2.5-4-2.5v5z",
    yandex: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 16.5h-1.8l-2.4-4.5-2.4 4.5H6l3.9-7.5L6 1.5h1.8l2.4 4.5 2.4-4.5h1.8l-3.9 7.5 3.9 7.5z", // Упрощенный лого Яндекса
    apple: "M17.057 12.002c.01 3.125 2.71 4.168 2.744 4.183-.023.076-.432 1.48-1.43 2.937-.864 1.258-1.758 2.515-3.167 2.54-.14.002-.56-.039-1.201-.303-1.03-.426-1.97-.426-3.045 0-.675.275-1.123.315-1.242.315-1.353.023-2.355-1.36-3.224-2.613-1.776-2.56-3.132-7.22-1.303-10.39.91-1.575 2.53-2.57 4.305-2.597.13-.002.534.037 1.157.302 1.053.45 1.764.45 2.87 0 .54-.233.993-.293 1.16-.302 1.83.03 3.325 1.082 4.102 2.193-3.325 1.428-2.793 6.04-.027 6.13zm-3.076-7.558c.813-1.01 1.362-2.413 1.213-3.812-1.203.048-2.658.803-3.52 1.815-.774.893-1.45 2.317-1.27 3.682 1.343.104 2.712-.628 3.577-1.685z",
    soundcloud: "M8.44 13.91l.14 1.64.01.07c0 .11-.03.22-.09.31-.06.09-.15.15-.26.17l-.09.01H1.67c-.22 0-.43-.09-.59-.24-.16-.16-.24-.37-.24-.59v-1.75c0-.22.08-.43.24-.59s.37-.25.59-.25h6.48c.11 0 .22.04.31.09.11.08.19.18.22.31.03.07.03.14.03.21l-.03.4.21-.05c.19-.05.38-.08.58-.08s.39.03.58.08c.19.05.38.13.53.25.16.11.29.27.38.45.09.18.13.38.13.58s-.04.4-.13.58c-.09.18-.22.33-.38.45-.16.12-.34.2-.53.25-.19.05-.39.08-.58.08s-.39-.03-.58-.08c-.21-.06-.41-.15-.58-.27l-.23-.17zm11.77-5.32c.9 0 1.76.36 2.39 1s1 1.5 1 2.39v2.12c0 .9-.36 1.76-1 2.39s-1.5 1-2.39 1h-9.55c-.9 0-1.76-.36-2.39-1s-1-1.5-1-2.39V9.66c0-1.2.48-2.36 1.33-3.2s2-1.33 3.2-1.33h.11c1.23.01 2.4.52 3.24 1.41l.24.25c.32-.42.75-.76 1.23-1s1.01-.36 1.55-.36c.64 0 1.27.15 1.83.45.56.3 1.05.73 1.41 1.25.21-.09.43-.16.66-.21.23-.05.46-.08.7-.08z"
};

const COLORS = {
    spotify: "#1DB954",
    ytmusic: "#FF0000",
    yandex: "#fed42b",
    apple: "#FC3C44",
    soundcloud: "#f26e1e"
};

module.exports = async (req, res) => {
    const { link } = req.query;
    if (!link) return res.status(400).send('No link provided');

    try {
        let data = { title: "Unknown", author: "Unknown Artist", image: "", platform: "Unknown", color: "#FFFFFF" };

        if (link.includes('spotify.com')) {
            const response = await axios.get(link, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
            });
            const $ = cheerio.load(response.data);
            
            data.title = $('meta[property="og:title"]').attr('content') || "Unknown Title";
            data.image = $('meta[property="og:image"]').attr('content');
            data.platform = 'spotify';
            
            const ogDesc = $('meta[property="og:description"]').attr('content') || "";
            const twitter1 = $('meta[name="twitter:data1"]').attr('content');

            if (twitter1 && !twitter1.includes(':')) {
                data.author = twitter1;
            } else if (ogDesc.includes(' · ')) {
                const parts = ogDesc.split(' · ');
                data.author = (parts[0].toLowerCase() === data.title.toLowerCase()) ? parts[1] : parts[0];
            } else {
                data.author = ogDesc;
            }
        } else if (link.includes('youtube.com') || link.includes('youtu.be')) {
            const oembed = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(link)}&format=json`);
            data.title = oembed.data.title;
            data.author = oembed.data.author_name.replace(' - Topic', '');
            data.image = oembed.data.thumbnail_url.replace('hqdefault', 'maxresdefault');
            data.platform = 'ytmusic';
        } else if (link.includes('music.yandex')) {
            const resp = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(resp.data);
            data.title = $('meta[property="og:title"]').attr('content') || "Трек";
            data.author = $('meta[property="og:description"]').attr('content') || "Артист";
            data.image = $('meta[property="og:image"]').attr('content')?.replace('%%', '400x400');
            data.platform = 'yandex';
        } else if (link.includes('music.apple.com')) {
            const resp = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(resp.data);
            const ogTitle = $('meta[property="og:title"]').attr('content') || "";
            if (ogTitle.includes(' by ')) {
                [data.title, data.author] = ogTitle.split(' by ');
            } else {
                data.title = ogTitle;
                data.author = "Apple Music";
            }
            data.image = $('meta[property="og:image"]').attr('content')?.replace(/\/\d+x\d+/, '/400x400');
            data.platform = 'apple';
        } else if (link.includes('soundcloud.com')) {
            const oembed = await axios.get(`https://soundcloud.com/oembed?url=${encodeURIComponent(link)}&format=json`);
            data.title = oembed.data.title;
            data.author = oembed.data.author_name;
            data.image = oembed.data.thumbnail_url;
            data.platform = 'soundcloud';
        }
        data.color = COLORS[data.platform];

        const imgResp = await axios.get(data.image, { responseType: 'arraybuffer' });
        const image = await Jimp.read(imgResp.data);
        image.cover(240, 240);
        
        const cp = image.clone().resize(1, 1);
        const rgba = Jimp.intToRGBA(cp.getPixelColor(0, 0));
        const bgColor = `rgb(${Math.floor(rgba.r * 0.8)}, ${Math.floor(rgba.g * 0.8)}, ${Math.floor(rgba.b * 0.8)})`;
        const base64 = await image.getBase64Async(Jimp.MIME_JPEG);

        const containerWidth = 260;
        const titleWidth = data.title.length * 14; 
        const authorWidth = data.author.length * 9;

        const svg = `
        <svg width="600" height="300" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
            <rect width="600" height="300" rx="25" fill="${bgColor}"/>
            <clipPath id="c"><rect x="30" y="30" width="240" height="240" rx="15"/></clipPath>
            <image href="${base64}" x="30" y="30" width="240" height="240" clip-path="url(#c)"/>
            <path d="${LOGOS[data.platform]}" fill="${data.color}" transform="translate(540, 30) scale(1.3)"/>
            
            <svg x="300" y="100" width="${containerWidth}" height="100">
                <text y="30" font-family="sans-serif" font-size="28" font-weight="bold" fill="white">
                    ${data.title}
                    ${titleWidth > containerWidth ? `<animate attributeName="x" from="10" to="-${titleWidth - 100}" dur="10s" repeatCount="indefinite" />` : ''}
                </text>
                <text y="65" font-family="sans-serif" font-size="18" fill="#ccc">
                    ${data.author}
                    ${authorWidth > containerWidth ? `<animate attributeName="x" from="10" to="-${authorWidth - 100}" dur="10s" repeatCount="indefinite" />` : ''}
                </text>
            </svg>

            <circle cx="540" cy="240" r="25" fill="white"/>
            <path d="M545 240l-10-7v14z" fill="black"/>
        </svg>`;

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).send(svg);

    } catch (e) {
        console.error("SERVER ERROR:", e.message);
        res.status(200).send(`<svg width="600" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="300" fill="#333"/><text x="50%" y="50%" fill="white" text-anchor="middle" font-family="sans-serif">Error: ${e.message}</text></svg>`);
    }
};
