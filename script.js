// ১. কনফিগারেশন এবং গ্লোবাল ভেরিয়েবল
const wcServers = [
    { name: "T Sports HD", url: "https://trs1.aynaott.com/tsports/index.m3u8" },
    { name: "T Sports", url: "https://trs1.aynaott.com/tsports/tracks-v1a1/mono.ts.m3u8" },
    { name: "Unite8 Sports", url: "http://198.195.239.50:8095/unt-s/video.m3u8" },
    { name: "Somoy TV", url: "http://198.195.239.50:8095/somoyTv/tracks-v1a1/mono.m3u8" },
    { name: "Server 5", url: "URL_5" }
];

const categoryLinks = {
    sports: 'https://is.gd/yQuS1g.m3u',
    news: 'https://raw.githubusercontent.com/mamun303427/Fifalive/refs/heads/main/News%20Channel.m3u',
    kids: 'https://raw.githubusercontent.com/mamun303427/Fifalive/refs/heads/main/Kids%20Channels.m3u',
    doc: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/doc.m3u',
    islamic: 'https://raw.githubusercontent.com/mamun303427/Fifalive/refs/heads/main/Islamic%20Tv.m3u',
    bd: 'https://raw.githubusercontent.com/mamun303427/Fifalive/refs/heads/main/Bangladeshi%20Tv.m3u',
    in: 'https://raw.githubusercontent.com/iptv-org/iptv/refs/heads/master/streams/in.m3u',
    pk: 'https://iptv-org.github.io/iptv/countries/pk.m3u',
    homeExtra: 'https://is.gd/yQuS1g.m3u'
};

const mainVid = document.getElementById('main-video');
const catVid = document.getElementById('cat-video');
const serverSection = document.getElementById('server-section');
const brightnessOverlay = document.getElementById('brightness-overlay');
let hlsMain, hlsCat, wakeLock = null;

// ২. ইনিশিয়াল লোড
window.onload = () => {
    playWC(0, document.querySelector('.srv-btn'));
    loadHomeExtra();
};

// ৩. স্ট্রীম লোড ফাংশন (HLS, Sound, & WakeLock)
function loadStream(vid, url, type, name, titleId) {
    document.getElementById(titleId).innerText = name;
    
    // সাউন্ড সেটিংস
    vid.muted = false; 
    vid.volume = 1.0;

    if (Hls.isSupported()) {
        if (type === 'main') {
            if(hlsMain) hlsMain.destroy();
            hlsMain = new Hls(); hlsMain.loadSource(url); hlsMain.attachMedia(vid);
            hlsMain.on(Hls.Events.MANIFEST_PARSED, () => {
                vid.play().catch(() => { vid.muted = true; vid.play(); });
            });
        } else {
            if(hlsCat) hlsCat.destroy();
            hlsCat = new Hls(); hlsCat.loadSource(url); hlsCat.attachMedia(vid);
            hlsCat.on(Hls.Events.MANIFEST_PARSED, () => {
                vid.play().catch(() => { vid.muted = true; vid.play(); });
            });
        }
    } else if (vid.canPlayType('application/vnd.apple.mpegurl')) {
        vid.src = url;
        vid.play().catch(() => { vid.muted = true; vid.play(); });
    }
    requestWakeLock(); // ভিডিও চললে স্ক্রিন অফ হবে না
}

// ৪. সার্ভার এবং ক্যাটেগরি লজিক
function playWC(index, btn) {
    const srv = wcServers[index];
    serverSection.style.display = 'block';
    document.querySelectorAll('.srv-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadStream(mainVid, srv.url, 'main', srv.name, 'main-name');
}

async function openCat(k) {
    mainVid.pause();
    document.getElementById('cat-list-view').style.display = 'none';
    document.getElementById('cat-player-view').style.display = 'block';
    const grid = document.getElementById('cat-grid');
    grid.innerHTML = '<p style="text-align:center; padding:20px;">Loading Channels...</p>';
    
    try {
        const res = await fetch(categoryLinks[k] || categoryLinks.bd);
        const data = await res.text();
        const channels = parseM3U(data);
        
        grid.innerHTML = '';
        channels.forEach((ch, idx) => {
            const card = document.createElement('div');
            card.className = 'channel-card';
            card.innerHTML = `<img src="${ch.logo}" onerror="this.src='https://via.placeholder.com/100?text=TV'"><span>${ch.name}</span>`;
            card.onclick = () => {
                loadStream(catVid, ch.url, 'cat', ch.name, 'cat-name');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            grid.appendChild(card);
            if(idx === 0) loadStream(catVid, ch.url, 'cat', ch.name, 'cat-name');
        });
    } catch (e) { grid.innerHTML = '<p>Error loading playlist.</p>'; }
}

async function loadHomeExtra() {
    const grid = document.getElementById('home-extra-grid');
    try {
        const res = await fetch(categoryLinks.homeExtra);
        const data = await res.text();
        const channels = parseM3U(data);
        channels.slice(0, 16).forEach(ch => { 
            const card = document.createElement('div');
            card.className = 'channel-card';
            card.innerHTML = `<img src="${ch.logo}" onerror="this.src='https://via.placeholder.com/100?text=TV'"><span>${ch.name}</span>`;
            card.onclick = () => {
                serverSection.style.display = 'none';
                loadStream(mainVid, ch.url, 'main', ch.name, 'main-name');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            grid.appendChild(card);
        });
    } catch (e) { console.log("Home Extra Load Error"); }
}

// ৫. নেভিগেশন এবং থিম
function navTo(v) {
    document.getElementById('home-view').style.display = v === 'home' ? 'block' : 'none';
    document.getElementById('cat-list-view').style.display = v === 'cat' ? 'block' : 'none';
    document.getElementById('cat-player-view').style.display = 'none';
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + v).classList.add('active');

    if(v === 'home') {
        playWC(0, document.querySelector('.srv-btn'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        mainVid.pause(); catVid.pause();
        if (wakeLock) { wakeLock.release(); wakeLock = null; }
    }
}

function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    if (body.classList.contains('dark-theme')) {
        body.classList.replace('dark-theme', 'light-theme');
        icon.classList.replace('fa-sun', 'fa-moon');
    } else {
        body.classList.replace('light-theme', 'dark-theme');
        icon.classList.replace('fa-moon', 'fa-sun');
    }
}

// ৬. হেল্পার ফাংশনসমূহ (WakeLock, Touch, M3U Parser)
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) { console.log('WakeLock error'); }
}

let startY = 0, startVol = 1, startBright = 0;
mainVid.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    startVol = mainVid.volume;
    startBright = 1 - parseFloat(window.getComputedStyle(brightnessOverlay).opacity);
});

mainVid.addEventListener('touchmove', (e) => {
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = startY - currentY;
    const screenWidth = window.innerWidth;

    if (currentX > screenWidth / 2) { // ডান পাশ - ভলিউম
        let newVol = startVol + (diffY / 200);
        mainVid.volume = Math.max(0, Math.min(1, newVol));
    } else { // বাম পাশ - ব্রাইটনেস
        let newBright = startBright + (diffY / 200);
        brightnessOverlay.style.opacity = 1 - Math.max(0, Math.min(1, newBright));
    }
    e.preventDefault();
}, { passive: false });

function parseM3U(data) {
    const list = [];
    const lines = data.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('#EXTINF')) {
            const name = lines[i].split(',')[1] || "TV";
            const logo = lines[i].match(/tvg-logo="([^"]+)"/)?.[1] || "";
            const url = lines[i + 1]?.trim();
            if (url) list.push({ name, logo, url });
        }
    }
    return list;
}

document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});
