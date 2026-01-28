const axios = require('axios');
const cheerio = require('cheerio');
const {
    LOGOS,
    escapeHtml,
    validateLink,
    fetchImageAsBase64,
    extractDominantColor,
    formatTime
} = require('./utils');

module.exports = async (req, res) => {
    const { link } = req.query;

    if (!link) return res.status(400).send('No link provided');
    if (!validateLink(link)) return res.status(400).send('Invalid URL');

    try {
        let data = { title: "Album", author: "Artist", image: "", tracks: [], platform: "platform" };

        if (link.includes('spotify.com')) {
            const resp = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' } });
            const $ = cheerio.load(resp.data);
            data.title = $('meta[property="og:title"]').attr('content') || "Spotify Album";
            data.author = $('meta[property="og:description"]').attr('content')?.split(' · ')[0] || "Artist";
            data.image = $('meta[property="og:image"]').attr('content');
            const tracks = [];
            $('meta[property="music:song"]').each((_, el) => {
                const url = $(el).attr('content');
                if (url) {
                    const title = url.split('/').pop();
                    tracks.push({ title, duration: "--" });
                }
            });
            data.tracks = tracks.length ? tracks : [{ title: "View full tracklist on Spotify", duration: "--" }];
            data.platform = 'spotify';
        } else if (link.includes('youtube.com') || link.includes('youtu.be')) {
            const resp = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0' } });
            const $ = cheerio.load(resp.data);
            data.title = $('meta[property="og:title"]').attr('content') || "YouTube Album";
            data.author = $('link[itemprop="name"]').attr('content') || "YouTube Artist";
            data.image = $('meta[property="og:image"]').attr('content');
            const tracks = [];
            $('ytd-playlist-video-renderer').each((_, el) => {
                const title = $(el).find('#video-title').text().trim();
                if (title) tracks.push({ title, duration: "--" });
            });
            data.tracks = tracks.length ? tracks : [{ title: "View tracks on YouTube Music", duration: "--" }];
            data.platform = 'ytmusic';
        } else if (link.includes('music.yandex')) {
            const id = link.match(/album\/(\d+)/)?.[1];
            if (id) {
                const resp = await axios.get(`https://music.yandex.ru/handlers/album.jsx?album=${id}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                data.title = resp.data.title;
                data.author = resp.data.artists[0].name;
                data.image = "https://" + resp.data.cover.uri.replace('%%', '400x400');
                data.tracks = resp.data.volumes[0]?.map(t => ({ title: t.title, duration: formatTime(t.durationMs) })) || [];
            } else {
                data.tracks = [{ title: "Invalid Yandex album link", duration: "--" }];
            }
            data.platform = 'yandex';
        } else if (link.includes('music.apple.com')) {
            const resp = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(resp.data);
            data.title = $('meta[property="og:title"]').attr('content')?.split(' by ')[0] || "Album";
            data.author = $('meta[name="apple:title"]').attr('content')?.split(' by ')[1] || "Artist";
            data.image = $('meta[property="og:image"]').attr('content')?.replace(/{w}x{h}/, '600x600');

            const jsonLdText = $('script[type="application/ld+json"]').first().html();
            if (jsonLdText) {
                try {
                    const jsonLd = JSON.parse(jsonLdText);
                    const albumObj = Array.isArray(jsonLd) ? jsonLd.find(x => x['@type'] === 'MusicAlbum') : jsonLd;
                    if (albumObj && albumObj.track) {
                        data.tracks = albumObj.track.map(t => ({
                            title: t.name || 'Unknown Track',
                            duration: t.duration ? t.duration.replace('PT', '').replace('M', ':').replace('S', '') : '--:--'
                        }));
                    }
                } catch (e) {
                    console.warn('Failed to parse JSON-LD:', e.message);
                }
            }
            if (!data.tracks.length) {
                data.tracks = [{ title: "View full tracklist on Apple Music", duration: "--" }];
            }
            data.platform = 'apple';
        } else if (link.includes('soundcloud.com')) {
            const oembed = await axios.get(`https://soundcloud.com/oembed?url=${encodeURIComponent(link)}&format=json`);
            data.title = oembed.data.title;
            data.author = oembed.data.author_name;
            data.image = oembed.data.thumbnail_url;
            data.tracks = [{ title: "Listen full album on SoundCloud", duration: "--" }];
            data.platform = 'soundcloud';
        }

        if (!data.image) {
            data.image = 'https://placehold.co/600x600?text=No+Image';
        }

        const [base64Image, bgColor] = await Promise.all([
            fetchImageAsBase64(data.image),
            extractDominantColor(data.image)
        ]);

        const escapedTitle = escapeHtml(data.title);
        const escapedAuthor = escapeHtml(data.author);

        const trackHeight = 70;
        const maxTracks = 100;
        const visibleTracks = data.tracks.slice(0, maxTracks);
        const tracksSvg = visibleTracks.map((t, i) => {
            const escTitle = escapeHtml(t.title.substring(0, 45));
            const escDuration = escapeHtml(t.duration);
            return `
            <g transform="translate(0, ${i * trackHeight})">
                <rect width="560" height="60" rx="12" fill="rgba(255,255,255,0.07)" x="20"/>
                <text x="40" y="38" font-family="sans-serif" font-size="20" font-weight="bold" fill="white">${escTitle}</text>
                <text x="540" y="38" font-family="sans-serif" font-size="18" fill="rgba(255,255,255,0.5)" text-anchor="end">${escDuration}</text>
            </g>`;
        }).join('');

        let anim = '';
        let listHeight = 300;
        const totalTrackHeight = visibleTracks.length * trackHeight;

        if (totalTrackHeight > 300) {
            const scrollDistance = totalTrackHeight - 300;
            const animDuration = Math.max(scrollDistance / 50, 10);
            anim = `<animateTransform attributeName="transform" type="translate" from="0 0" to="0 -${scrollDistance}" dur="${animDuration}s" repeatCount="indefinite" />`;
        } else {
            listHeight = Math.max(totalTrackHeight, 100);
        }

        const svg = `
        <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
            <rect width="600" height="600" rx="25" fill="${bgColor}"/>
            
            <defs><clipPath id="imgClip"><rect x="30" y="30" width="240" height="240" rx="15"/></clipPath></defs>
            <image href="${base64Image}" x="40" y="40" width="220" height="220" clip-path="url(#imgClip)"/>
            <image href="${LOGOS[data.platform]}" x="540" y="30" width="30" height="30" />
            
            <text x="280" y="130" font-family="sans-serif" font-size="32" font-weight="bold" fill="white">${escapedTitle.substring(0, 22)}</text>
            <text x="280" y="175" font-family="sans-serif" font-size="22" fill="rgba(255,255,255,0.6)">${escapedAuthor.substring(0, 30)}</text>

            <svg x="0" y="300" width="600" height="${listHeight}">
                <g>
                    ${tracksSvg}
                    ${anim}
                </g>
            </svg>
            
            <g transform="translate(540, 230)">
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
        res.status(200).send(`<svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="600" fill="#333"/><text x="50%" y="50%" fill="white" text-anchor="middle" font-family="sans-serif">Error: ${escapeHtml(e.message)}</text></svg>`);
    }
};
