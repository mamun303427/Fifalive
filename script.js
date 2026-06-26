// ১. কনফিগারেশন
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

// ৩. অটো-সাউন্ড আনমিউট লজিক (ব্রাউজার পলিসি ফিক্স)
// ইউজারের প্রথম টাচ বা ক্লিকের সাথে সাথেই সাউন্ড অন হবে
document.body.addEventListener('touchstart', function unmute() {
    mainVid.muted = false;
    catVid.muted = false;
    document.body.removeEventListener('touchstart', unmute);
}, { once: true });

// ৪. স্ট্রীম লোড ফাংশন (Improved Sound Logic)
function loadStream(vid, url, type, name, titleId) {
    document.getElementById(titleId).innerText = name;
    
    // ভিডিও লোড করার সময় সাউন্ড অন রাখার নির্দেশ
    vid.muted = false;
    vid.volume = 1.0;

    if (Hls.isSupported()) {
        const hls = (type === 'main') ? (hlsMain = hlsMain || new Hls()) : (hlsCat = hlsCat || new Hls());
        if(type === 'main' && hlsMain) hlsMain.destroy();
        if(type === 'cat' && hlsCat) hlsCat.destroy();
        
        const newHls = new Hls();
        if(type === 'main') hlsMain = newHls; else hlsCat = newHls;
        
        newHls.loadSource(url);
        newHls.attachMedia(vid);
        newHls.on(Hls.Events.MANIFEST_PARSED, () => {
            vid.play().catch(() => {
                vid.muted = true; // অটো-প্লে না হলে মিউট করে প্লে করবে
                vid.play();
            });
        });
    } else if (vid.canPlayType('application/vnd.apple.mpegurl')) {
        vid.src = url;
        vid.play().catch(() => { vid.muted = true; vid.play(); });
    }
    requestWakeLock();
}

// ৫. জেস্টচার কন্ট্রোল (ফুল স্ক্রিনেও কাজ করবে)
let startY = 0, startVol = 1, startBright = 0;

function handleGestureStart(e) {
    startY = e.touches[0].clientY;
    startVol = mainVid.volume;
    const opacity = window.getComputedStyle(brightnessOverlay).opacity;
    startBright = 1 - parseFloat(opacity);
}

function handleGestureMove(e) {
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = startY - currentY;
    const screenWidth = window.innerWidth;
    const targetVid = (document.getElementById('home-view').style.display !== 'none') ? mainVid : catVid;

    // স্ক্রিনের ডান পাশ (ভলিউম)
    if (currentX > screenWidth / 2) {
        let newVol = startVol + (diffY / 300);
        targetVid.volume = Math.max(0, Math.min(1, newVol));
    } 
    // স্ক্রিনের বাম পাশ (ব্রাইটনেস)
    else {
        let newBright = startBright + (diffY / 300);
        brightnessOverlay.style.opacity = 1 - Math.max(0, Math.min(1, newBright));
    }
    
    if(e.cancelable) e.preventDefault();
}

// ইভেন্ট লিসেনারগুলো প্লেয়ারের ওপর সেট করা
mainVid.addEventListener('touchstart', handleGestureStart, { passive: false });
mainVid.addEventListener('touchmove', handleGestureMove, { passive: false });
catVid.addEventListener('touchstart', handleGestureStart, { passive: false });
catVid.addEventListener('touchmove', handleGestureMove, { passive: false });

// ৬. নেভিগেশন এবং অন্যান্য ফাংশন
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
    grid.innerHTML = '<p style="text-align:center;">Loading...</p>';
    
    try {
        const res = await fetch(categoryLinks[k] || categoryLinks.bd);
        const data = await res.text();
        const channels = parseM3U(data);
        grid.innerHTML = '';
        channels.forEach((ch, idx) => {
            const card = document.createElement('div');
            card.className = 'channel-card';
            card.innerHTML = `<img src="${ch.logo}" onerror="this.src='https://via.placeholder.com/100?text=TV'"><span>${ch.name}</span>`;
            card.onclick = () => loadStream(catVid, ch.url, 'cat', ch.name, 'cat-name');
            grid.appendChild(card);
            if(idx === 0) loadStream(catVid, ch.url, 'cat', ch.name, 'cat-name');
        });
    } catch (e) { grid.innerHTML = '<p>Error</p>'; }
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
    } catch (e) { }
}

function navTo(v) {
    document.getElementById('home-view').style.display = v === 'home' ? 'block' : 'none';
    document.getElementById('cat-list-view').style.display = v === 'cat' ? 'block' : 'none';
    document.getElementById('cat-player-view').style.display = 'none';
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + v).classList.add('active');
    if(v === 'home') {
        playWC(0, document.querySelector('.srv-btn'));
    } else {
        mainVid.pause(); catVid.pause();
        if (wakeLock) { wakeLock.release(); wakeLock = null; }
    }
}

async function requestWakeLock() {
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) { }
}

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
