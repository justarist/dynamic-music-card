const axios = require('axios');
const cheerio = require('cheerio');
const {
    LOGOS,
    escapeHtml,
    validateLink,
    fetchImageAsBase64,
    extractDominantColor
} = require('./utils');

module.exports = async (req, res) => {
    const { link } = req.query;

    if (!link) return res.status(400).send('No link provided');
    if (!validateLink(link)) return res.status(400).send('Invalid URL');

    try {
        let data = { title: "Artist", image: "", platform: "platform" };

        if (link.includes('spotify.com')) {
            const resp = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' } });
            const $ = cheerio.load(resp.data);
            data.title = $('meta[property="og:title"]').attr('content') || "Spotify Artist";
            data.image = $('meta[property="og:image"]').attr('content');
            data.platform = 'spotify';
        } else if (link.includes('youtube.com') || link.includes('youtu.be')) {
            const resp = await axios.get(link, { 
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' } 
            });
            const $ = cheerio.load(resp.data);
            data.title = $('meta[property="og:title"]').attr('content') || $('title').text().replace(' - YouTube Music', '').replace(' - YouTube', '');
            data.image = $('meta[property="og:image"]').attr('content');
            data.platform = 'ytmusic';
        } else if (link.includes('music.yandex')) {
            const artistId = link.match(/artist\/(\d+)/)?.[1];
            if (artistId) {
                const apiUrl = `https://music.yandex.ru/handlers/artist.jsx?artist=${artistId}`;
                const resp = await axios.get(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                data.title = resp.data.artist.name;
                if (resp.data.artist.cover) {
                    data.image = "https://" + resp.data.artist.cover.uri.replace('%%', '400x400');
                }
            }
            data.platform = 'yandex';
        } else if (link.includes('music.apple.com')) {
            const resp = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(resp.data);
            data.title = $('meta[property="og:title"]').attr('content')?.replace(' on Apple Music', '') || "Apple Artist";
            let rawImage = $('meta[property="og:image"]').attr('content');
            if (rawImage) {
                data.image = rawImage.replace(/\/(\d+)x(\d+)bb/, '/1000x1000bb').replace(/{w}x{h}/, '1000x1000');
            }
            data.platform = 'apple';
        } else if (link.includes('soundcloud.com')) {
            const oembed = await axios.get(`https://soundcloud.com/oembed?url=${encodeURIComponent(link)}&format=json`);
            data.title = oembed.data.author_name || oembed.data.title;
            data.image = oembed.data.thumbnail_url;
            data.platform = 'soundcloud';
            data.title = data.title.split(' by ')[0].trim();
        }

        if (!data.image) {
            data.image = 'https://placehold.co/600x600?text=No+Image';
        }

        const [base64Image, bgColor] = await Promise.all([
            fetchImageAsBase64(data.image),
            extractDominantColor(data.image)
        ]);

        if (data.title.length > 19) {
            data.title += "ㅤㅤㅤ";
        }

        const titleLength = data.title.length;
        const logoBase64 = LOGOS[data.platform];
        const containerWidth = 390;

        const escapedTitle = escapeHtml(data.title);

        const svg = `
        <svg width="600" height="150" viewBox="0 0 600 150" xmlns="http://www.w3.org/2000/svg">
            <rect width="600" height="150" rx="25" fill="${bgColor}"/>
            
            <defs>
                <clipPath id="circleClip">
                    <circle cx="75" cy="75" r="55" />
                </clipPath>
            </defs>
            <image href="${base64Image}" x="20" y="20" width="110" height="110" clip-path="url(#circleClip)"/>
            
            <image href="${logoBase64}" x="550" y="20" width="30" height="30" />

            <svg x="160" y="55" width="${containerWidth}" height="50">
                <defs>
                <clipPath id="textClip">
                    <rect width="${containerWidth}" height="50" />
                </clipPath>
                </defs>

                <g clip-path="url(#textClip)">
                <g>
                    <text x="0" y="32" font-family="sans-serif" font-size="36" font-weight="bold" fill="white">
                    ${escapedTitle}
                    </text>

                    <text x="${titleLength * 20.5}" y="32" font-family="sans-serif" font-size="36" font-weight="bold" fill="white">
                    ${escapedTitle}
                    </text>

                    ${titleLength > 19 ? `
                    <animateTransform attributeName="transform" type="translate" from="0 0" to="-${titleLength * 20.5} 0" dur="${0.15 * titleLength}s" repeatCount="indefinite" />
                    ` : ''}
                </g>
                </g>
            </svg>

            <g transform="translate(550, 100)">
                <circle cx="15" cy="15" r="15" fill="white"/>
                <svg width="20" height="20" x="5" y="5" viewBox="0 0 24 24">
                    <path d="M7 7h8.586L5.293 17.293l1.414 1.414L17 8.414V17h2V5H7v2z" fill="black"/>
                </svg>
            </g>
        </svg>`;

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.status(200).send(svg);

    } catch (e) {
        console.error("SERVER ERROR:", e.message);
        res.status(200).send(`<svg width="600" height="150" viewBox="0 0 600 150" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="150" fill="#333"/><text x="50%" y="50%" fill="white" text-anchor="middle" font-family="sans-serif">Error: ${escapeHtml(e.message)}</text></svg>`);
    }
};
