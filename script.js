const video = document.getElementById('video');
const channelList = document.getElementById('channel-list');
const playingTitle = document.getElementById('now-playing');

// আপনার M3U লিঙ্ক
const M3U_URL = "https://iptv-org.github.io/iptv/countries/bd.m3u";

// ১. নেভিগেশন লজিক (Home vs Category)
function showSection(section) {
    const homeSec = document.getElementById('home-section');
    const catSec = document.getElementById('category-section');
    const homeBtn = document.getElementById('home-btn');
    const catBtn = document.getElementById('cat-btn');

    if (section === 'home') {
        homeSec.style.display = 'block';
        catSec.style.display = 'none';
        homeBtn.classList.add('active');
        catBtn.classList.remove('active');
    } else {
        homeSec.style.display = 'none';
        catSec.style.display = 'block';
        catBtn.classList.add('active');
        homeBtn.classList.remove('active');
    }
}

// ২. M3U চ্যানেল লোড করা
async function loadChannels() {
    try {
        const response = await fetch(M3U_URL);
        const data = await response.text();
        const channels = parseM3U(data);
        
        channels.forEach(channel => {
            const card = document.createElement('div');
            card.className = 'channel-card';
            card.innerHTML = `
                <img src="${channel.logo}" alt="${channel.name}" onerror="this.src='https://via.placeholder.com/100?text=TV'">
                <p>${channel.name}</p>
            `;
            card.onclick = () => playVideo(channel.url, channel.name);
            channelList.appendChild(card);
        });
    } catch (err) {
        console.error("চ্যানেল লোড করা সম্ভব হয়নি।");
    }
}

// M3U টেক্সট পার্স করা
function parseM3U(data) {
    const lines = data.split('\n');
    const channels = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
            const name = lines[i].split(',')[1];
            const logoMatch = lines[i].match(/tvg-logo="([^"]+)"/);
            const logo = logoMatch ? logoMatch[1] : "https://via.placeholder.com/100";
            const url = lines[i + 1]?.trim();
            if(url) channels.push({ name, logo, url });
        }
    }
    return channels;
}

// ভিডিও প্লে করা
function playVideo(url, name) {
    playingTitle.innerText = "Now Playing: " + name;
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.play();
    }
}

loadChannels();
