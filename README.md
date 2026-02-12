# Dynamic Music Cards

> [!TIP]
> You can generate link for your GitHub README at our main page, [check it out here](https://dynamic-music-card.vercel.app).

> [!IMPORTANT]
> Project is currently in development, so some or all features may not work. After finishing development all features will be available.

### Supported Platforms:
YT Music, Spotify, Yandex Music, Apple Music, Soundcloud

## How does it work?
Use one of this links:
* For track: ```https://dynamic-music-card.vercel.app/api/track?link=<your_link_here>```
* For artist: ```https://dynamic-music-card.vercel.app/api/artist?link=<your_link_here>```
* For album: ```https://dynamic-music-card.vercel.app/api/album?link=<your_link_here>```
* For playlist: ```https://dynamic-music-card.vercel.app/api/playlist?link=<your_link_here>```

and paste it in your README like this
```
<a href="https://example.com">
    <img alt="Example" src="https://dynamic-music-card.vercel.app/api/track?link=<your_link_here>" />
</a>
```

or just 
```
<img alt="Example" src="https://dynamic-music-card.vercel.app/api/track?link=<your_link_here>" />
```
Also add ```&cache_bust=1``` for better and faster updates
# Examples

### Track card

<a href="https://music.youtube.com/watch?v=BLZWkjBXfN8">
    <img alt="Example" src="https://dynamic-music-card.vercel.app/api/track?link=https://music.youtube.com/watch?v=BLZWkjBXfN8&cache_bust=1" />
</a>

### Artist card 

<a href="https://open.spotify.com/artist/6XyY86QOPPrYVGvF9ch6wz">
    <img alt="Example" src="https://dynamic-music-card.vercel.app/api/artist?link=https://open.spotify.com/artist/6XyY86QOPPrYVGvF9ch6wz&cache_bust=1" />
</a>

### Album card

<a href="https://music.yandex.ru/album/22492384">
    <img alt="Example" src="https://dynamic-music-card.vercel.app/api/album?link=https://music.yandex.ru/album/22492384&cache_bust=1" />
</a>

### Playlist card

<a href="https://music.youtube.com/playlist?list=OLAK5uy_nTX_UcyURUCsI2KNerL9nZi8mpxfshIAA">
    <img alt="Example" src="https://dynamic-music-card.vercel.app/api/playlist?link=https://music.youtube.com/playlist?list=OLAK5uy_nTX_UcyURUCsI2KNerL9nZi8mpxfshIAA&cache_bust=1" />
</a>

### Also I'll add some other features later

# License

This project is licensed under MIT License -- see the [LICENSE](LICENSE) file for more info.
