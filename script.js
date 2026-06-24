const video = document.getElementById('video-player');
const channelGrid = document.getElementById('channel-list');
const channelTitle = document.getElementById('current-channel-name');

// Configuration: Map your M3U links here
const m3uSources = {
    'home': 'https://iptv-org.github.io/iptv/countries/bd.m3u',
    'sports': 'YOUR_SPORTS_M3U_URL',
    'news': 'YOUR_NEWS_M3U_URL',
    'bd': 'https://iptv-org.github.io/iptv/countries/bd.m3u',
    'in': 'https://iptv-org.github.io/iptv/countries/in.m3u',
    'pk': 'https://iptv-org.github.io/iptv/countries/pk.m3u',
};

// Auto-load Home content on startup
window.onload = () => loadM3U(m3uSources.home);

async function loadM3U(url) {
    channelGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Fetching Channels...</p>';
    try {
        const response = await fetch(url);
        const data = await response.text();
        const channels = parseM3U(data);
        
        displayChannels(channels);
        
        // AUTO-PLAY First Channel
        if (channels.length > 0) {
            playStream(channels[0].url, channels[0].name);
        }
    } catch (error) {
        channelGrid.innerHTML = '<p>Error loading playlist.</p>';
    }
}

function parseM3U(data) {
    const lines = data.split('\n');
    const list = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('#EXTINF')) {
            const name = lines[i].split(',')[1] || "Unknown";
            const logoMatch = lines[i].match(/tvg-logo="([^"]+)"/);
            const logo = logoMatch ? logoMatch[1] : "https://via.placeholder.com/100?text=TV";
            const url = lines[i + 1]?.trim();
            if (url && url.startsWith('http')) {
                list.push({ name, logo, url });
            }
        }
    }
    return list;
}

function displayChannels(channels) {
    channelGrid.innerHTML = '';
    channels.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `
            <img src="${ch.logo}" onerror="this.src='https://via.placeholder.com/100?text=TV'">
            <span>${ch.name}</span>
        `;
        card.onclick = () => playStream(ch.url, ch.name);
        channelGrid.appendChild(card);
    });
}

function playStream(url, name) {
    channelTitle.innerText = "Playing: " + name;
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
    } else {
        video.src = url;
        video.play();
    }
}

// Navigation Logic
function navTo(page) {
    const main = document.getElementById('main-view');
    const cat = document.getElementById('category-view');
    const bHome = document.getElementById('btn-home');
    const bCat = document.getElementById('btn-cat');

    if (page === 'home') {
        main.style.display = 'block';
        cat.style.display = 'none';
        bHome.classList.add('active');
        bCat.classList.remove('active');
    } else {
        main.style.display = 'none';
        cat.style.display = 'block';
        bCat.classList.add('active');
        bHome.classList.remove('active');
        video.pause();
    }
}

function loadCategory(key) {
    navTo('home');
    loadM3U(m3uSources[key]);
}
