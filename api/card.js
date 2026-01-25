const axios = require('axios');
const cheerio = require('cheerio');
const Jimp = require('jimp');

const LOGOS = {
    spotify: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.485 17.306c-.215.354-.675.467-1.03.251-2.859-1.748-6.458-2.143-10.697-1.175-.406.093-.812-.162-.905-.568-.093-.406.162-.812.568-.905 4.63-1.059 8.625-.61 11.813 1.34.354.215.467.675.251 1.03zm1.464-3.26c-.271.44-.847.579-1.287.308-3.27-2.008-8.254-2.59-12.122-1.415-.497.151-1.023-.131-1.174-.628-.151-.497.131-1.023.628-1.174 4.414-1.34 9.907-.69 13.648 1.605.44.271.579.847.307 1.287h.001zm.142-3.41c-3.922-2.329-10.395-2.545-14.156-1.404-.602.183-1.24-.165-1.423-.767-.183-.602.165-1.24.767-1.423 4.314-1.309 11.458-1.053 15.965 1.623.541.321.717 1.02.396 1.561-.321.541-1.02.717-1.561.396l.012.014z",
    ytmusic: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 17.75c-3.176 0-5.75-2.574-5.75-5.75s2.574-5.75 5.75-5.75 5.75 2.574 5.75 5.75-2.574 5.75-5.75 5.75zm0-10.5c-2.623 0-4.75 2.127-4.75 4.75s2.127 4.75 4.75 4.75 4.75-2.127 4.75-4.75-2.127-4.75-4.75-4.75zm-1.5 7.25l4-2.5-4-2.5v5z",
    yandex: "M220.86 445C342.838 445 441.72 345.383 441.72 222.5C441.72 99.6166 342.838 0 220.86 0C98.8825 0 0 99.6166 0 222.5C0 345.383 98.8825 445 220.86 445ZM388.708 178.197L387.278 171.452L330.975 161.518L363.753 116.785L359.979 112.401L311.802 135.794L317.888 73.7995L312.958 70.8868L283.65 121.169L250.842 46.3281H245.06L252.881 118.533L170.161 51.571L163.192 53.6252L226.769 134.629L100.802 92.2262L94.9892 98.6648L207.595 163.572L52.3207 176.725L50.5859 186.383L211.947 204.197L77.2767 317.087L83.0895 324.967L243.295 236.666L211.673 392.235H221.26L282.767 245.741L320.232 360.348L326.897 355.075L311.528 238.72L369.839 305.681L373.613 299.519L328.936 216.491L391.326 239.885L391.904 232.864L335.905 191.044L388.708 178.197Z",
    apple: "M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z",
    soundcloud: "M-238.4,398.1c-0.8,0-1.4,0.6-1.5,1.5l-2.3,28l2.3,27.1c0.1,0.8,0.7,1.5,1.5,1.5c0.8,0,1.4-0.6,1.5-1.5l2.6-27.1l-2.6-28C-237,398.7-237.7,398.1-238.4,398.1zM-228.2,399.9c-0.9,0-1.7,0.7-1.7,1.7l-2.1,26l2.1,27.3c0.1,1,0.8,1.7,1.7,1.7c0.9,0,1.6-0.7,1.7-1.7l2.4-27.3l-2.4-26C-226.6,400.6-227.3,399.9-228.2,399.9zM-258.6,403.5c-0.5,0-1,0.4-1.1,1l-2.5,23l2.5,22.5c0.1,0.6,0.5,1,1.1,1c0.5,0,1-0.4,1.1-1l2.9-22.5l-2.9-23C-257.7,404-258.1,403.5-258.6,403.5zM-268.1,412.3c-0.5,0-1,0.4-1,1l-1.9,14.3l1.9,14c0.1,0.6,0.5,1,1,1s0.9-0.4,1-1l2.2-14l-2.2-14.2C-267.2,412.8-267.6,412.3-268.1,412.3zM-207.5,373.5c-1.2,0-2.1,0.9-2.2,2.1l-1.9,52l1.9,27.2c0.1,1.2,1,2.1,2.2,2.1s2.1-0.9,2.2-2.1l2.1-27.2l-2.1-52C-205.4,374.4-206.4,373.5-207.5,373.5zM-248.6,399c-0.7,0-1.2,0.5-1.3,1.3l-2.4,27.3l2.4,26.3c0.1,0.7,0.6,1.3,1.3,1.3c0.7,0,1.2-0.5,1.3-1.2l2.7-26.3l-2.7-27.3C-247.4,399.6-247.9,399-248.6,399zM-217.9,383.4c-1,0-1.9,0.8-1.9,1.9l-2,42.3l2,27.3c0.1,1.1,0.9,1.9,1.9,1.9s1.9-0.8,1.9-1.9l2.3-27.3l-2.3-42.3C-216,384.2-216.9,383.4-217.9,383.4zM-154.4,359.3c-1.8,0-3.2,1.4-3.2,3.2l-1.2,65l1.2,26.1c0,1.8,1.5,3.2,3.2,3.2c1.8,0,3.2-1.5,3.2-3.2l1.4-26.1l-1.4-65C-151.1,360.8-152.6,359.3-154.4,359.3zM-197.1,368.9c-1.3,0-2.3,1-2.4,2.4l-1.8,56.3l1.8,26.9c0,1.3,1.1,2.3,2.4,2.3s2.3-1,2.4-2.4l2-26.9l-2-56.3C-194.7,370-195.8,368.9-197.1,368.9zM-46.5,394c-4.3,0-8.4,0.9-12.2,2.4C-61.2,368-85,345.8-114,345.8c-7.1,0-14,1.4-20.1,3.8c-2.4,0.9-3,1.9-3,3.7v99.9c0,1.9,1.5,3.5,3.4,3.7c0.1,0,86.7,0,87.3,0c17.4,0,31.5-14.1,31.5-31.5C-15,408.1-29.1,394-46.5,394zM-143.6,353.2c-1.9,0-3.4,1.6-3.5,3.5l-1.4,70.9l1.4,25.7c0,1.9,1.6,3.4,3.5,3.4c1.9,0,3.4-1.6,3.5-3.5l1.5-25.8l-1.5-70.9C-140.2,354.8-141.7,353.2-143.6,353.2zM-186.5,366.8c-1.4,0-2.5,1.1-2.6,2.6l-1.6,58.2l1.6,26.7c0,1.4,1.2,2.6,2.6,2.6s2.5-1.1,2.6-2.6l1.8-26.7l-1.8-58.2C-184,367.9-185.1,366.8-186.5,366.8zM-175.9,368.1c-1.5,0-2.8,1.2-2.8,2.8l-1.5,56.7l1.5,26.5c0,1.6,1.3,2.8,2.8,2.8s2.8-1.2,2.8-2.8l1.7-26.5l-1.7-56.7C-173.1,369.3-174.3,368.1-175.9,368.1zM-165.2,369.9c-1.7,0-3,1.3-3,3l-1.4,54.7l1.4,26.3c0,1.7,1.4,3,3,3c1.7,0,3-1.3,3-3l1.5-26.3l-1.5-54.7C-162.2,371.3-163.5,369.9-165.2,369.9z"
};

const COLORS = {
    spotify: "#1DB954",
    ytmusic: "#FF0000",
    yandex: "#FED42B",
    apple: "#FC3C44",
    soundcloud: "#F26EEe"
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
            
            data.author = data.author.replace(' on Apple Music', '').trim();
            
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
        console.error("SERVER ERROR:", e.message);
        res.status(200).send(`<svg width="600" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="300" fill="#333"/><text x="50%" y="50%" fill="white" text-anchor="middle" font-family="sans-serif">Error: ${e.message}</text></svg>`);
    }
};
