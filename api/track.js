const axios = require('axios');
const cheerio = require('cheerio');
const {
    LOGOS,
    escapeHtml,
    validateLink,
    fetchImageAsBase64,
    extractDominantColor,
    normalizeText
} = require('./utils');
const { title } = require('node:process');

module.exports = async (req, res) => {
    const { link } = req.query;

    if (!link) return res.status(400).send('No link provided');
    if (!validateLink(link)) return res.status(400).send('Invalid URL');

    try {
        let data = { title: "Title", author: "Artist", image: "", platform: "platform" };

        if (link.includes('spotify.com')) {
            const response = await axios.get(link, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
            });
            const $ = cheerio.load(response.data);

            data.title = normalizeText($('meta[property="og:title"]').attr('content')) || "Unknown Title";
            data.image = $('meta[property="og:image"]').attr('content');
            data.platform = 'spotify';

            const ogDesc = $('meta[property="og:description"]').attr('content') || "";
            const twitter1 = $('meta[name="twitter:data1"]').attr('content');

            if (twitter1 && !twitter1.includes(':')) {
                data.author = normalizeText(twitter1);
            } else if (ogDesc.includes(' · ')) {
                const parts = ogDesc.split(' · ');
                data.author = normalizeText((parts[0].toLowerCase() === data.title.toLowerCase()) ? parts[1] : parts[0]);
            } else {
                data.author = normalizeText(ogDesc);
            }
        } else if (link.includes('youtube.com') || link.includes('youtu.be')) {
            const oembed = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(link)}&format=json`);
            data.title = normalizeText(oembed.data.title);
            data.author = normalizeText(oembed.data.author_name).replace(' - Topic', '');
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
                        data.title = normalizeText(trackData.title);
                        data.author = normalizeText(trackData.artists ? trackData.artists.map(a => a.name).join(', ') : "Артист");

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
                data.title = normalizeText(ogTitle.substring(0, lastByIndex));
                data.author = normalizeText(ogTitle.substring(lastByIndex + 4));
            } else {
                data.title = normalizeText(ogTitle);
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
            data.title = normalizeText(oembed.data.title);
            data.author = normalizeText(oembed.data.author_name);
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
        if (data.author.length > 19) {
            data.author += "ㅤㅤㅤ";
        }

        const containerWidth = 270;
        const titleLength = data.title.length;
        const authorLength = data.author.length;
        const logoBase64 = LOGOS[data.platform];

        const escapedTitle = escapeHtml(normalizeText(data.title));
        const escapedAuthor = escapeHtml(normalizeText(data.author));

        const titleWidth = titleLength * 20.5;
        const authorWidth = authorLength * 11.5;

        const svg = `
        <svg width="600" height="300" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
            <rect width="600" height="300" rx="25" fill="${bgColor}"/>
            <clipPath id="c"><rect x="30" y="30" width="240" height="240" rx="15"/></clipPath>
            <image href="${base64Image}" x="30" y="30" width="240" height="240" clip-path="url(#c)"/>
            <image href="${logoBase64}" x="540" y="30" width="30" height="30" />

            <svg x="300" y="100" width="${containerWidth}" height="100">
            <defs>
                <clipPath id="titleClip">
                    <rect width="${containerWidth}" height="40"/>
                </clipPath>
                <clipPath id="authorClip">
                    <rect y="40" width="${containerWidth}" height="40"/>
                </clipPath>
            </defs>

            <g clip-path="url(#titleClip)">
            <g>
                <text x="0" y="30" font-family="sans-serif" font-size="36" font-weight="bold" fill="#fff">
                    ${escapedTitle}
                </text>

                ${titleLength > 13 ? `
                <text x="${titleWidth}" y="30" font-family="sans-serif" font-size="36" font-weight="bold" fill="#fff">
                    ${escapedTitle}
                </text>
                
                <animateTransform attributeName="transform" type="translate" from="0 0" to="-${titleWidth} 0" dur="${0.2 * titleLength}s" repeatCount="indefinite" />
                ` : ''}
            </g>
            </g>

            <g clip-path="url(#authorClip)">
            <g>
                <text x="0" y="65" font-family="sans-serif" font-size="24" fill="#ccc">
                    ${escapedAuthor}
                </text>

                ${authorLength > 24 ? `
                <text x="${authorWidth}" y="65" font-family="sans-serif" font-size="24" fill="#ccc">
                    ${escapedAuthor}
                </text>
                
                <animateTransform attributeName="transform" type="translate" from="0 0" to="-${authorWidth} 0" dur="${0.2 * authorLength}s" repeatCount="indefinite" />
                ` : ''}
            </g>
            </g>
        </svg>

            <circle cx="540" cy="240" r="25" fill="white"/>
            <path d="M545 240l-10-7v14z" fill="black"/>
        </svg>`;

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.status(200).send(svg);

    } catch (e) {
        console.error("SERVER ERROR:", e.message);
        res.status(200).send(`<svg width="600" height="300" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="300" fill="#333"/><text x="50%" y="50%" fill="white" text-anchor="middle" font-family="sans-serif">Error: ${escapeHtml(e.message)}</text></svg>`);
    }
};
