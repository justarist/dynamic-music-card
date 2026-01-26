const axios = require('axios');
const cheerio = require('cheerio');
const Jimp = require('jimp');

const LOGOS = {
    spotify: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDBDNS40IDAgMCA1LjQgMCAxMnM1LjQgMTIgMTIgMTIgMTItNS40IDEyLTEyUzE4LjY2IDAgMTIgMHptNS41MjEgMTcuMzRjLS4yNC4zNTktLjY2LjQ4LTEuMDIxLjI0LTIuODItMS43NC02LjM2LTIuMTAxLTEwLjU2MS0xLjE0MS0uNDE4LjEyMi0uNzc5LS4xNzktLjg5OS0uNTM5LS4xMi0uNDIxLjE4LS43OC41NC0uOSA0LjU2LTEuMDIxIDguNTItLjYgMTEuNjQgMS4zMi40Mi4xOC40NzkuNjU5LjMwMSAxLjAyem0xLjQ0LTMuM2MtLjMwMS40Mi0uODQxLjYtMS4yNjIuMy0zLjIzOS0xLjk4LTguMTU5LTIuNTgtMTEuOTM5LTEuMzgtLjQ3OS4xMi0xLjAyLS4xMi0xLjE0LS42LS4xMi0uNDguMTItMS4wMjEuNi0xLjE0MUM5LjYgOS45IDE1IDEwLjU2MSAxOC43MiAxMi44NGMuMzYxLjE4MS41NC43OC4yNDEgMS4yek0xOS4wOCA3Ljk4QzE1LjI0IDguNCA4LjgyIDguMTYgNS4xNiA5LjMwMWMtLjYuMTc5LTEuMi0uMTgxLTEuMzgtLjcyMS0uMTgtLjYwMS4xOC0xLjIuNzItMS4zODEgNC4yNi0xLjI2IDExLjI4LTEuMDIgMTUuNzIxIDEuNjIxLjUzOS4zLjcxOSAxLjAyLjQxOSAxLjU2LS4yOTkuNDIxLTEuMDIuNTk5LTEuNTU5LjN6IiBmaWxsPSIjMURCODU0Ii8+PC9zdmc+",
    ytmusic: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDBDNS4zNzYgMCAwIDUuMzc2IDAgMTJzNS4zNzYgMTIgMTIgMTIgMTItNS4zNzYgMTItMTJTMTguNjI0IDAgMTIgMHptMCAxOS4xMDRjLTMuOTI0IDAtNy4xMDQtMy4xOC03LjEwNC03LjEwNFM4LjA3NiA0Ljg5NiAxMiA0Ljg5NnM3LjEwNCAzLjE4IDcuMTA0IDcuMTA0LTMuMTggNy4xMDQtNy4xMDQgNy4xMDR6bTAtMTMuMzMyYy0zLjQzMiAwLTYuMjI4IDIuNzk2LTYuMjI4IDYuMjI4UzguNTY4IDE4LjIyOCAxMiAxOC4yMjhzNi4yMjgtMi43OTYgNi4yMjgtNi4yMjhTMTUuNDMyIDUuNzcyIDEyIDUuNzcyeE05LjY4NCAxNS41NFY4LjQ2TDE1LjgxNiAxMmwtNi4xMzIgMy41NHoiIGZpbGw9IiNGRjAwMDAiLz48L3N2Zz4=",
    yandex: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NDgiIGhlaWdodD0iNDQ1IiB2aWV3Qm94PSIwIDAgNDQ4IDQ0NSIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTQ0Mi45NzMgMTczLjQ5OUw0NDEuNzU2IDE2NC41MjhMMzY4LjI2MSAxNDcuMzcwTDQwNi4yMjUgOTEuMDMyNUw0MDEuNzM5IDg0LjkyNDhMMzQyLjUzOCAxMTMuODkyTDM0OS4wNzYgMzUuMTAwMkwzNDIuNTM4IDMxLjg1NjNMMzA1Ljc5IDk1LjExMjhMMjYyLjUyOSAwSDI1NC4zNjlMMjY0Ljk2MiA5My4wODUzTDE1Ni43NzMgNi45NDQwMkwxNDcuMzk2IDkuNDAyM0wyMzAuNjczIDExMy44OTJMNjUuMzM0NiA1OC43OTYxTDU3LjU3OTYgNjcuMzYyTDIwNS4zNTUgMTUxLjA0NUwyLjA1Mjc5IDE2OC4yMDJMMCAxODAuNDQzTDIxMS40ODggMjAzLjMwM0wzNC43MjAxIDM0Ny44MzRMNDIuODgwNiAzNTguODU5TDI1Mi4zMTYgMjQ0LjUzNkwyMTEuMDgzIDQ0NUgyMjMuNzI5TDMwNC41NzQgMjU2LjM5NkwzNTMuNTYyIDQwMy43NjdMMzYyLjEyOCAzOTcuMjI4TDM0My43NTQgMjQ5LjQ1Mkw0MTguNDY2IDMzMy45NDZMNDIyLjk3NyAzMjUuMzgwTDM2Ny40NSAyMjAuODY1TDQ0Ni4yNDIgMjQ4LjY0MUw0NDcuMDUzIDI0MC4wNTBMMzgxLjMzOCAxODcuMzg3TDQ0Mi45NzMgMTczLjQ5OVoiIGZpbGw9IiNGRkJDM0QiLz48L3N2Zz4=",
    apple: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyLjE1MiA2Ljg5NmMtLjk0OCAwLTIuNDE1LTEuMDc4LTMuOTYtMS4wNC0yLjA0LjAyNy0zLjkxIDEuMTgzLTQuOTYxIDMuMDE0LTIuMTE3IDMuNjc1LS41NDYgOS4xMDMgMS41MTkgMTIuMDkwIDEuMDEzIDEuNDU0IDIuMjA4IDMuMDkwIDMuNzkyIDMuMDM5IDEuNTItLjA2NSAyLjA5LS45ODcgMy45MzUtLjk4NyAxLjgzMSAwIDIuMzUuOTg3IDMuOTYuOTQ4IDEuNjM3LS4wMjYgMi42NzYtMS40OCAzLjY3Ni0yLjk0OCAxLjE1Ni0xLjY4OCAxLjYzNi0zLjMyNSAxLjY2Mi0zLjQxNS0uMDM5LS4wMTMtMy4xODItMS4yMjEtMy4yMi00Ljg1Ny0uMDI2LTMuMDQgMi40OC00LjQ5NCAyLjU5Ny00LjU1OS0xLjQyOS0yLjA5LTMuNjIzLTIuMzI0LTQuMzktMi4zNzYtMi0uMTU2LTMuNjc1IDEuMDktNC42MSAxLjA5ek0xNS41MyAzLjgzYy44NDMtMS4wMTIgMS40LTIuNDI3IDEuMjQ1LTMuODMtMS4yMDcuMDUyLTIuNjYyLjgwNS0zLjUzMiAxLjgxOC0uNzguODk2LTEuNDU0IDIuMzM4LTEuMjczIDMuNzE0IDEuMzM4LjEwNCAyLjcxNS0uNjg4IDMuNTU5LTEuNzAxIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==",
    soundcloud: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTIzLjk5OSAxNC4xNjVjLS4wNTIgMS43OTYtMS42MTIgMy4xNjktMy40IDMuMTY5aC04LjE4YS42OC42OCAwIDAgMS0uNjc1LS42ODNWNy44NjJhLjc0Ny43NDcgMCAwIDEgLjQ1Mi0uNzI0cy43NS0uNTEzIDIuMzMzLS41MTNhNS4zNjQgNS4zNjQgMCAwIDEgMi43NjMuNzU1IDUuNDMzIDUuNDMzIDAgMCAxIDIuNTcgMy41NGMuMjgyLS4wOC41NzQtLjEyMS44NjgtLjEyLjg4NCAwIDEuNzMuMzU4IDIuMzQ3Ljk5MnMuOTQ4IDEuNDkgLjkyMiAyLjM3M1pNMTAuNzIxIDguNDIxYy4yNDcgMi45OC40MjcgNS42OTcgMCA4LjY3MmEuMjY0LjI2NCAwIDAgMS0uNTMgMGMtLjM5NS0yLjk0Ni0uMjItNS43MTggMC04LjY3MmEuMjY0LjI2NCAwIDAgMSAuNTMgMHpNOS4wNzIgOS40NDhjLjI4NSAyLjY1OS4zNyA0Ljk4Ni0uMDA2IDcuNjU1YS4yNzcuMjc3IDAgMCAxLS41NSAwYy0uMzMxLTIuNjMtLjI1Ni01LjAyIDAtNy42NTVhLjI3Ny4yNzcgMCAwIDEgLjU1NiAwem0tMS42NjMtLjI1N2MuMjcgMi43MjYuMzkgNS4xNzEgMCA3LjkwNGEuMjY2LjI2NiAwIDAgMS0uNTMyIDBjLS4zOC0yLjY5LS4yNTctNS4yMSAwLTcuOTA0YS4yNjYuMjY2IDAgMCAxIC41MzIgMHptLTEuNjQ3Ljc3YTI2LjEwOCAyNi4xMDggMCAwIDEtLjAwOCA3LjE0N2EuMjcyLjI3MiAwIDAgMS0uNTQyIDAgMjcuOTU1IDI3Ljk1NSAwIDAgMSAwLTcuMTQ3YS4yNzUuMjc1IDAgMCAxIC41NSAwem0tMS42NyAxLjc2OWMuNDIxIDEuODY1LjIyOCAzLjUtLjAyOSA1LjM4OGEuMjU3LjI1NyAwIDAgMS0uNTE0IDBjLS4yMS0xLjg1OC0uMzk4LTMuNTQ5IDAtNS4zODlhLjI3Mi4yNzIgMCAwIDEgLjU0MyAwem0tMS42NTUtLjI3M2MuMzg4IDEuODk3LjI2IDMuNTA4LS4wMSA1LjQxMi0uMDI2LjI4LS41MTQuMjgzLS41NCAwLS4yNDQtMS44NzgtLjM0Ny0zLjU0LS4wMS01LjQxMmEuMjgzLjI4MyAwIDAgMSAuNTYgMHptLTEuNjY4LjkxMWMuNCAxLjI2OC4yNTcgMi4yOTItLjAyNiAzLjU3MmEuMjU3LjI1NyAwIDAgMS0uNTE0IDBjLS4yNDEtMS4yNjItLjM1NC0yLjMxMi0uMDIzLTMuNTcyYS4yODMuMjgzIDAgMCAxIC41NjMgMHoiIGZpbGw9IiNGRDU5MDgiLz48L3N2Zz4="
};

const formatTime = (ms) => {
    if (!ms) return "--:--";
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

module.exports = async (req, res) => {
    const { link } = req.query;
    if (!link) return res.status(400).send('No link provided');

    try {
        let data = { title: "Album", author: "Artist", image: "", tracks: [], platform: "platform" };

        if (link.includes('spotify.com')) {
            const resp = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' } });
            const $ = cheerio.load(resp.data);
            data.title = $('meta[property="og:title"]').attr('content') || "Spotify Album";
            data.author = $('meta[property="og:description"]').attr('content')?.split(' · ')[0] || "Artist";
            data.image = $('meta[property="og:image"]').attr('content');
            data.tracks = [{ title: "View full tracklist on Spotify", duration: "--" }];
            data.platform = 'spotify';
        } else if (link.includes('youtube.com') || link.includes('youtu.be')) {
            const resp = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0' } });
            const $ = cheerio.load(resp.data);
            data.title = $('meta[property="og:title"]').attr('content') || "YouTube Album";
            data.author = $('link[itemprop="name"]').attr('content') || "YouTube Artist";
            data.image = $('meta[property="og:image"]').attr('content');
            data.tracks = [{ title: "View tracks on YouTube Music", duration: "--" }];
            data.platform = 'ytmusic';
        } else if (link.includes('music.yandex')) {
            const id = link.match(/album\/(\d+)/)?.[1];
            const resp = await axios.get(`https://music.yandex.ru/handlers/album.jsx?album=${id}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            data.title = resp.data.title;
            data.author = resp.data.artists[0].name;
            data.image = "https://" + resp.data.cover.uri.replace('%%', '400x400');
            data.tracks = resp.data.volumes[0].map(t => ({ title: t.title, duration: formatTime(t.durationMs) }));
            data.platform = 'yandex';
        } else if (link.includes('music.apple.com')) {
            const resp = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(resp.data);
            data.title = $('meta[property="og:title"]').attr('content')?.split(' by ')[0] || "Album";
            data.author = $('meta[name="apple:title"]').attr('content')?.split(' by ')[1] || "Artist";
            data.image = $('meta[property="og:image"]').attr('content')?.replace(/{w}x{h}/, '600x600');
            
            const jsonLd = JSON.parse($('script[type="application/ld+json"]').html());
            const albumObj = Array.isArray(jsonLd) ? jsonLd.find(x => x['@type'] === 'MusicAlbum') : jsonLd;
            data.tracks = albumObj.track.map(t => ({ title: t.name, duration: t.duration.replace('PT', '').replace('M', ':').replace('S', '') }));
            data.platform = 'apple';
        } else if (link.includes('soundcloud.com')) {
            const oembed = await axios.get(`https://soundcloud.com/oembed?url=${encodeURIComponent(link)}&format=json`);
            data.title = oembed.data.title;
            data.author = oembed.data.author_name;
            data.image = oembed.data.thumbnail_url;
            data.tracks = [{ title: "Listen full album on SoundCloud", duration: "--" }];
            data.platform = 'soundcloud';
        }
        
        const imgResp = await axios.get(data.image, { responseType: 'arraybuffer' });
        const image = await Jimp.read(imgResp.data);
        const cp = image.clone().resize(1, 1);
        const rgba = Jimp.intToRGBA(cp.getPixelColor(0, 0));
        
        const bgColor = `rgb(${Math.floor(rgba.r * 0.7)}, ${Math.floor(rgba.g * 0.7)}, ${Math.floor(rgba.b * 0.7)})`;
        const listBg = `rgb(${Math.floor(rgba.r * 0.9)}, ${Math.floor(rgba.g * 0.9)}, ${Math.floor(rgba.b * 0.9)})`;
        const base64 = await image.resize(220, 220).getBase64Async(Jimp.MIME_JPEG);

        const trackHeight = 70;
        const tracksSvg = data.tracks.map((t, i) => `
            <g transform="translate(0, ${i * trackHeight})">
                <rect width="560" height="60" rx="12" fill="rgba(255,255,255,0.07)" x="20"/>
                <text x="40" y="38" font-family="sans-serif" font-size="20" font-weight="bold" fill="white">${t.title.substring(0, 45)}</text>
                <text x="540" y="38" font-family="sans-serif" font-size="18" fill="rgba(255,255,255,0.5)" text-anchor="end">${t.duration}</text>
            </g>`).join('');

        const scrollDist = data.tracks.length * trackHeight;
        const animDur = Math.max(data.tracks.length * 3, 10);

        const svg = `
        <svg width="600" height="900" viewBox="0 0 600 900" xmlns="http://www.w3.org/2000/svg">
            <rect width="600" height="900" fill="${bgColor}"/>
            <rect width="600" height="600" y="300" fill="${listBg}"/>
            
            <clipPath id="r"><rect x="40" y="40" width="220" height="220" rx="20"/></clipPath>
            <image href="${base64}" x="40" y="40" width="220" height="220" clip-path="url(#r)"/>
            <image href="${LOGOS[data.platform]}" x="540" y="30" width="30" height="30" />
            
            <text x="280" y="130" font-family="sans-serif" font-size="32" font-weight="bold" fill="white">${data.title.substring(0, 22)}</text>
            <text x="280" y="175" font-family="sans-serif" font-size="22" fill="rgba(255,255,255,0.6)">${data.author.substring(0, 30)}</text>

            <svg x="0" y="320" width="600" height="560">
                <g>
                    ${tracksSvg}
                    ${data.tracks.length > 5 ? `<animateTransform attributeName="transform" type="translate" from="0 0" to="0 -${scrollDist}" dur="${animDur}s" repeatCount="indefinite" />` : ''}
                </g>
                ${data.tracks.length > 5 ? `<g transform="translate(0, ${scrollDist})">
                    ${tracksSvg}
                    <animateTransform attributeName="transform" type="translate" from="0 0" to="0 -${scrollDist}" dur="${animDur}s" repeatCount="indefinite" />
                </g>` : ''}
            </svg>
            
            <g transform="translate(540, 230)">
                <circle cx="15" cy="15" r="15" fill="white"/>
                <svg width="20" height="20" x="5" y="5" viewBox="0 0 24 24">
                    <path d="M7 7h8.586L5.293 17.293l1.414 1.414L17 8.414V17h2V5H7v2z" fill="black"/>
                </svg>
            </g>
        </svg>`;

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).send(svg);

    } catch (e) {
        console.error("SERVER ERROR:", e.message);
        res.status(200).send(`<svg width="600" height="900" viewBox="0 0 600 900" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="900" fill="#333"/><text x="50%" y="50%" fill="white" text-anchor="middle" font-family="sans-serif">Error: ${e.message}</text></svg>`);
    }
};
