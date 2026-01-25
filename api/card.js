const axios = require('axios');
const cheerio = require('cheerio');
const Jimp = require('jimp');

const LOGOS = {
    spotify: "spotify",
    ytmusic: "youtubemusic",
    yandex: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NDgiIGhlaWdodD0iNDQ1IiB2aWV3Qm94PSIwIDAgNDQ4IDQ0NSIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTQ0Mi45NzMgMTczLjQ5OUw0NDEuNzU2IDE2NC41MjhMMzY4LjI2MSAxNDcuMzcwTDQwNi4yMjUgOTEuMDMyNUw0MDEuNzM5IDg0LjkyNDhMMzQyLjUzOCAxMTMuODkyTDM0OS4wNzYgMzUuMTAwMkwzNDIuNTM4IDMxLjg1NjNMMzA1Ljc5IDk1LjExMjhMMjYyLjUyOSAwSDI1NC4zNjlMMjY0Ljk2MiA5My4wODUzTDE1Ni43NzMgNi45NDQwMkwxNDcuMzk2IDkuNDAyM0wyMzAuNjczIDExMy44OTJMNjUuMzM0NiA1OC43OTYxTDU3LjU3OTYgNjcuMzYyTDIwNS4zNTUgMTUxLjA0NUwyLjA1Mjc5IDE2OC4yMDJMMCAxODAuNDQzTDIxMS40ODggMjAzLjMwM0wzNC43MjAxIDM0Ny44MzRMNDIuODgwNiAzNTguODU5TDI1Mi4zMTYgMjQ0LjUzNkwyMTEuMDgzIDQ0NUgyMjMuNzI5TDMwNC41NzQgMjU2LjM5NkwzNTMuNTYyIDQwMy43NjdMMzYyLjEyOCAzOTcuMjI4TDM0My43NTQgMjQ5LjQ1Mkw0MTguNDY2IDMzMy45NDZMNDIyLjk3NyAzMjUuMzgwTDM2Ny40NSAyMjAuODY1TDQ0Ni4yNDIgMjQ4LjY0MUw0NDcuMDUzIDI0MC4wNTBMMzgxLjMzOCAxODcuMzg3TDQ0Mi45NzMgMTczLjQ5OVoiIGZpbGw9IiNGRkJDM0QiLz48L3N2Zz4=",
    apple: "apple",
    soundcloud: "soundcloud"
};

const COLORS = {
    spotify: "1DB954",
    ytmusic: "FF0000",
    yandex: "FFBC0D",
    apple: "FB2A41",
    soundcloud: "FD5908"
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
            const match = link.match(/album\/(\d+)\/track\/(\d+)/);
            
            if (match) {
                const albumId = match[1];
                const trackId = match[2];
                const apiUrl = `https://music.yandex.ru/handlers/track.jsx?track=${trackId}:${albumId}`;
                
                try {
                    const resp = await axios.get(apiUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }
                    });
                    
                    const trackData = resp.data.track;
                    
                    if (trackData) {
                        data.title = trackData.title;
                        data.author = trackData.artists ? trackData.artists.map(a => a.name).join(', ') : "Артист";
                        
                        if (trackData.coverUri) {
                            data.image = "https://" + trackData.coverUri.replace('%%', '400x400');
                        }
                    }
                } catch (err) {
                    console.error("Yandex API Error:", err.message);
                    data.title = "Yandex Music";
                }
            } else {
                data.title = "Yandex Music";
                data.author = "Playlist/Artist";
            }
            
            data.platform = 'yandex';
        } else if (link.includes('music.apple.com')) {
            const resp = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(resp.data);
            
            const ogTitle = $('meta[property="og:title"]').attr('content') || "";
            
            if (ogTitle.includes(' by ')) {
                const lastByIndex = ogTitle.lastIndexOf(' by ');
                data.title = ogTitle.substring(0, lastByIndex);
                data.author = ogTitle.substring(lastByIndex + 4);
            } else {
                data.title = ogTitle;
                data.author = "Apple Music";
            }
            
            data.author = data.author.split(' on ')[0].trim();
            
            const rawImg = $('meta[property="og:image"]').attr('content');
            if (rawImg) {
                data.image = rawImg.replace(/\/\d+x\d+[^/]*\.jpg/, '/600x600bb.jpg').replace('/{w}x{h}bb', '/600x600bb'); 
            }
            
            data.platform = 'apple';
        } else if (link.includes('soundcloud.com')) {
            const oembed = await axios.get(`https://soundcloud.com/oembed?url=${encodeURIComponent(link)}&format=json`);
            data.title = oembed.data.title;
            data.author = oembed.data.author_name;
            data.image = oembed.data.thumbnail_url;
            data.platform = 'soundcloud';
            data.title = data.title.split(' by ')[0].trim();
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

        let logoBase64 = "";
        try {
            if (LOGOS[data.platform].startsWith('data:')) {
                logoBase64 = LOGOS[data.platform];
            } else {
                const logoUrl = `https://cdn.simpleicons.org/${LOGOS[data.platform]}/${COLORS[data.platform]}`;
                const logoResp = await axios.get(logoUrl, { responseType: 'arraybuffer' });
                logoBase64 = `data:image/svg+xml;base64,${Buffer.from(logoResp.data).toString('base64')}`;
            }
        } catch (err) {
            console.error("Logo load error:", err.message);
        }

        const svg = `
        <svg width="600" height="300" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
            <rect width="600" height="300" rx="25" fill="${bgColor}"/>
            <clipPath id="c"><rect x="30" y="30" width="240" height="240" rx="15"/></clipPath>
            <image href="${base64}" x="30" y="30" width="240" height="240" clip-path="url(#c)"/>
            <image href="${logoBase64}" x="540" y="30" width="30" height="30" />
            
            <svg x="300" y="100" width="${containerWidth}" height="100">
                <defs>
                    <clipPath id="textClip"><rect width="${containerWidth}" height="100" /></clipPath>
                </defs>

                <g clip-path="url(#textClip)">
                    <text x="0" y="30" font-family="sans-serif" font-size="28" font-weight="bold" fill="white">
                        ${data.title}
                        ${titleWidth + 40 > containerWidth ? `
                            <animate attributeName="x" from="0" to="-${titleWidth - containerWidth + 40}" dur="10s" repeatCount="indefinite" />
                        ` : ''}
                    </text>
                    
                    <text x="0" y="65" font-family="sans-serif" font-size="18" fill="#ccc">
                        ${data.author}
                        ${authorWidth + 40 > containerWidth ? `
                            <animate attributeName="x" from="0" to="-${authorWidth - containerWidth + 40}" dur="10s" repeatCount="indefinite" />
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
        console.error("SERVER ERROR:", e.message);
        res.status(200).send(`<svg width="600" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="300" fill="#333"/><text x="50%" y="50%" fill="white" text-anchor="middle" font-family="sans-serif">Error: ${e.message}</text></svg>`);
    }
};
