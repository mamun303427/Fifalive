const mainVideo = document.getElementById('main-player');
const catVideo = document.getElementById('cat-player');

const m3uLinks = {
    home: 'https://iptv-org.github.io/iptv/countries/bd.m3u',
    sports: 'YOUR_SPORTS_LINK',
    news: 'YOUR_NEWS_LINK',
    kids: 'YOUR_KIDS_LINK',
    doc: 'YOUR_DOC_LINK',
    islamic: 'YOUR_ISLAMIC_LINK',
    bd: 'https://iptv-org.github.io/iptv/countries/bd.m3u',
    in: 'https://iptv-org.github.io/iptv/countries/in.m3u',
    pk: 'https://iptv-org.github.io/iptv/countries/pk.m3u'
};

// থিম পরিবর্তন লজিক
document.querySelector('#checkbox').addEventListener('change', (e) => {
    document.body.className = e.target.checked ? 'light-theme' : 'dark-theme';
});

// পেজ লোড হলে চ্যানেল লিস্ট দেখাবে কিন্তু প্লে হবে না
window.onload = () => fetchChannels('home', 'main-grid', mainVideo, 'main-ch-name');

async function fetchChannels(key, gridId, videoElem, titleId) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '<p style="text-align:center; width:100%;">Loading Channels...</p>';
    
    try {
        const response = await fetch(m3uLinks[key]);
        const data = await response.text();
        const channels = parseM3U(data);
        
        grid.innerHTML = '';
        channels.forEach(ch => {
            const card = document.createElement('div');
            card.className = 'channel-card';
            card.innerHTML = `<img src="${ch.logo}" onerror="this.src='https://via.placeholder.com/100?text=TV'"><span>${ch.name}</span>`;
            card.onclick = () => {
                playStream(videoElem, ch.url, ch.name, titleId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            grid.appendChild(card);
        });
        // অটো-প্লে ফাংশন এখান থেকে সরিয়ে দেওয়া হয়েছে।
    } catch (e) {
        grid.innerHTML = '<p>Error loading channels.</p>';
    }
}

function parseM3U(data) {
    const lines = data.split('\n');
    const list = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('#EXTINF')) {
            const name = lines[i].split(',')[1] || "Unknown Channel";
            const logo = lines[i].match(/tvg-logo="([^"]+)"/)?.[1] || "";
            const url = lines[i + 1]?.trim();
            if (url) list.push({ name, logo, url });
        }
    }
    return list;
}

function playStream(videoElem, url, name, titleId) {
    document.getElementById(titleId).innerText = name;
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(videoElem);
        hls.on(Hls.Events.MANIFEST_PARSED, () => videoElem.play());
    } else {
        videoElem.src = url;
        videoElem.play();
    }
}

function navTo(view) {
    document.getElementById('home-view').style.display = view === 'home' ? 'block' : 'none';
    document.getElementById('cat-list-view').style.display = view === 'cat' ? 'block' : 'none';
    document.getElementById('cat-player-view').style.display = 'none';
    
    document.getElementById('nav-home').classList.toggle('active', view === 'home');
    document.getElementById('nav-cat').classList.toggle('active', view === 'cat');
    
    mainVideo.pause();
    catVideo.pause();
}

function openCategory(key, name) {
    document.getElementById('cat-list-view').style.display = 'none';
    document.getElementById('cat-player-view').style.display = 'block';
    fetchChannels(key, 'cat-grid', catVideo, 'cat-ch-name');
}
