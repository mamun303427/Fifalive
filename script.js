const mainVideo = document.getElementById('main-player');
const catVideo = document.getElementById('cat-player');

const m3uLinks = {
    home: 'https://iptv-org.github.io/iptv/countries/bd.m3u',
    sports: 'YOUR_SPORTS_LINK',
    news: 'YOUR_NEWS_LINK',
    bd: 'https://iptv-org.github.io/iptv/countries/bd.m3u',
    in: 'https://iptv-org.github.io/iptv/countries/in.m3u'
};

// Theme Toggle Logic
const toggleSwitch = document.querySelector('#checkbox');
toggleSwitch.addEventListener('change', (e) => {
    if (e.target.checked) {
        document.body.classList.replace('dark-theme', 'light-theme');
    } else {
        document.body.classList.replace('light-theme', 'dark-theme');
    }
});

// Auto-play on Load
window.onload = () => loadCategoryData('home', 'main-grid', mainVideo, 'main-ch-name');

async function loadCategoryData(key, gridId, videoElem, titleId) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '<p>Loading Channels...</p>';
    
    try {
        const response = await fetch(m3uLinks[key]);
        const data = await response.text();
        const channels = parseM3U(data);
        
        renderGrid(channels, grid, videoElem, titleId);
        
        // Auto-play the first channel
        if (channels.length > 0) {
            playStream(videoElem, channels[0].url, channels[0].name, titleId);
        }
    } catch (e) {
        grid.innerHTML = '<p>Error loading playlist.</p>';
    }
}

function parseM3U(data) {
    const lines = data.split('\n');
    const list = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('#EXTINF')) {
            const name = lines[i].split(',')[1] || "TV Channel";
            const logo = lines[i].match(/tvg-logo="([^"]+)"/)?.[1] || "https://via.placeholder.com/100";
            const url = lines[i + 1]?.trim();
            if (url) list.push({ name, logo, url });
        }
    }
    return list;
}

function renderGrid(channels, grid, videoElem, titleId) {
    grid.innerHTML = '';
    channels.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `<img src="${ch.logo}"><span>${ch.name}</span>`;
        card.onclick = () => {
            playStream(videoElem, ch.url, ch.name, titleId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        grid.appendChild(card);
    });
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

// Navigation
function navTo(view) {
    document.getElementById('home-view').style.display = view === 'home' ? 'block' : 'none';
    document.getElementById('cat-list-view').style.display = view === 'cat' ? 'block' : 'none';
    document.getElementById('cat-player-view').style.display = 'none';
    
    document.getElementById('nav-home').classList.toggle('active', view === 'home');
    document.getElementById('nav-cat').classList.toggle('active', view === 'cat');
    
    mainVideo.pause();
    catVideo.pause();
    if(view === 'home') mainVideo.play();
}

function openCategory(key, name) {
    document.getElementById('cat-list-view').style.display = 'none';
    document.getElementById('cat-player-view').style.display = 'block';
    loadCategoryData(key, 'cat-grid', catVideo, 'cat-ch-name');
}
