// ১. কনফিগারেশন
const wcServers = [
    { name: "T Sports HD", url: "https://tvsen5.aynaott.com/TnMn5kZz8aLm/tracks-v1a1/mono.ts.m3u8" },
    { name: "A Sports", url: "https://tvsen6.aynaott.com/zv68oqPDu7MZZwmHhRxt/tracks-v1a1/mono.ts.m3u8?e=1784102512&token=968935df4fd0678de5d7fe392c0610d9&u=ee5437a7-c16b-4700-b317-a41b77d5cba9" },
    { name: "Bein Sports 1", url: "https://1nyaler.streamhostingcdn.top/stream/23/index.m3u8" },
    { name: "Bein Sports 3", url: "https://ua.online24.pm/play/1103/350B326FB34F4B8/video.m3u8" },
    { name: "Caze Tv", url: "https://dfr80qz435crc.cloudfront.net/MNOP/Amagi/Caze/Caze_TV_BR/1080p-vtt/index.m3u8" },
    { name: "Server 6", url: "https://trs1.aynaott.com/tsports/tracks-v1a1/mono.ts.m3u8" }, // HTTP পরিবর্তন করা হয়েছে
    { name: "Server 7", url: "https://dfr80qz435crc.cloudfront.net/MNOP/Amagi/Caze/Caze_TV_BR/1080p-vtt/index.m3u8" },
    { name: "Win Sports", url: "https://1nyaler.streamhostingcdn.top/stream/32/index.m3u8" },
    { name: "CCTV 5", url: "https://play1.gzxdby.com/live/783234345958_4547667094.m3u8" },
    { name: "Server 10", url: "https://trs1.aynaott.com/tsports/tracks-v1a1/mono.ts.m3u8" }
];

const categoryLinks = {
    // স্পেস রিমুভ করা হয়েছে
    sports: 'https://raw.githubusercontent.com/abusaeeidx/Mrgify-Tv/refs/heads/main/playlist.m3u',
    news: 'https://raw.githubusercontent.com/mamun303427/Fifalive/refs/heads/main/News%20Channel.m3u',
    kids: 'https://raw.githubusercontent.com/mamun303427/Fifalive/refs/heads/main/Kids%20Channels.m3u',
    islamic: 'https://raw.githubusercontent.com/mamun303427/Fifalive/refs/heads/main/Islamic%20Tv.m3u',
    bd: 'https://raw.githubusercontent.com/mamun303427/Fifalive/refs/heads/main/Bangladeshi%20TV.m3u',
    in: 'https://raw.githubusercontent.com/shidul100/Iptv/refs/heads/main/playlist.m3u',
    pk: 'https://iptv-org.github.io/iptv/countries/pk.m3u',
    homeExtra: 'https://raw.githubusercontent.com/shidul100/Iptv/refs/heads/main/playlist.m3u'
};

const mainVid = document.getElementById('main-video');
const catVid = document.getElementById('cat-video');
const serverSection = document.getElementById('server-section');
let hlsMain = null, hlsCat = null, wakeLock = null;
let currentSrvIdx = 0; 
let failoverTimeout = null;

window.onload = () => {
    startAutoFailover();
    loadHomeExtra();
};

function startAutoFailover() {
    if (currentSrvIdx >= wcServers.length) {
        document.getElementById('main-name').innerText = "All servers are offline.";
        return;
    }

    const srv = wcServers[currentSrvIdx];
    const srvButtons = document.querySelectorAll('.srv-btn');
    
    document.getElementById('main-name').innerText = "Connecting " + srv.name + "...";
    srvButtons.forEach(b => b.classList.remove('active'));
    if(srvButtons[currentSrvIdx]) srvButtons[currentSrvIdx].classList.add('active');

    loadStream(mainVid, srv.url, 'main');

    clearTimeout(failoverTimeout);
    failoverTimeout = setTimeout(() => {
        console.log(srv.name + " failed. Next...");
        currentSrvIdx++;
        startAutoFailover();
    }, 10000); // ১০ সেকেন্ড করা হলো ভালো পারফরম্যান্সের জন্য
}

mainVid.onplaying = () => {
    clearTimeout(failoverTimeout);
    document.getElementById('main-name').innerText = wcServers[currentSrvIdx].name;
};

mainVid.onerror = () => {
    clearTimeout(failoverTimeout);
    currentSrvIdx++;
    startAutoFailover();
};

function playWC(index, btn) {
    clearTimeout(failoverTimeout);
    currentSrvIdx = index;
    const srv = wcServers[index];
    serverSection.style.display = 'block';
    document.getElementById('main-name').innerText = srv.name;
    document.querySelectorAll('.srv-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    loadStream(mainVid, srv.url, 'main');
}

function loadStream(vid, url, type) {
    if (type === 'main' && hlsMain) { hlsMain.destroy(); hlsMain = null; }
    if (type === 'cat' && hlsCat) { hlsCat.destroy(); hlsCat = null; }

    if (Hls.isSupported()) {
        const hls = new Hls({ 
            capLevelToPlayerSize: true, 
            debug: false // অতিরিক্ত কনসোল লগ বন্ধ করতে
        });
        if (type === 'main') hlsMain = hls; else hlsCat = hls;
        hls.loadSource(url);
        hls.attachMedia(vid);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            vid.play().catch(() => { vid.muted = true; vid.play(); });
        });
        
        // HLS Level এরর হ্যান্ডলিং
        hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal && type === 'main') {
                currentSrvIdx++;
                startAutoFailover();
            }
        });

    } else if (vid.canPlayType('application/vnd.apple.mpegurl')) {
        vid.src = url;
        vid.play().catch(() => { vid.muted = true; vid.play(); });
    }
    requestWakeLock();
}

// ক্যাটেগরি লজিক
async function openCat(k) {
    clearTimeout(failoverTimeout);
    mainVid.pause();
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('cat-list-view').style.display = 'none';
    document.getElementById('cat-player-view').style.display = 'block';
    
    const grid = document.getElementById('cat-grid');
    grid.innerHTML = '<div class="loader">Loading Channels...</div>';
    
    try {
        const res = await fetch(categoryLinks[k]);
        if(!res.ok) throw new Error();
        const data = await res.text();
        const channels = parseM3U(data);
        grid.innerHTML = '';
        channels.forEach((ch, idx) => {
            const card = document.createElement('div');
            card.className = 'channel-card';
            card.innerHTML = `<img src="${ch.logo}" loading="lazy" onerror="this.src='https://via.placeholder.com/100?text=TV'"><span>${ch.name}</span>`;
            card.onclick = () => {
                loadStream(catVid, ch.url, 'cat');
                document.getElementById('cat-name').innerText = ch.name;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            grid.appendChild(card);
            if(idx === 0) { loadStream(catVid, ch.url, 'cat'); document.getElementById('cat-name').innerText = ch.name; }
        });
    } catch (e) { 
        grid.innerHTML = '<p style="color:white;text-align:center;">Failed to load channels. Try again later.</p>'; 
    }
}

function navTo(v) {
    clearTimeout(failoverTimeout);
    mainVid.pause(); catVid.pause();
    
    document.getElementById('home-view').style.display = v === 'home' ? 'block' : 'none';
    document.getElementById('cat-list-view').style.display = v === 'cat' ? 'block' : 'none';
    document.getElementById('cat-player-view').style.display = 'none';
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('btn-' + v);
    if (btn) btn.classList.add('active');

    if(v === 'home') {
        currentSrvIdx = 0;
        startAutoFailover();
    }
}

function parseM3U(data) {
    const list = [];
    const lines = data.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXTINF')) {
            const name = line.split(',')[1] || "Unknown Channel";
            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            const logo = logoMatch ? logoMatch[1] : "";
            
            // পরবর্তী লাইনে URL খোঁজা (ফাঁকা লাইন এড়িয়ে)
            let url = "";
            for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].trim().startsWith('http')) {
                    url = lines[j].trim();
                    break;
                }
            }
            if (url) list.push({ name, logo, url });
        }
    }
    return list;
}

// থিম এবং ওয়েকলক (অপরিবর্তিত)
async function requestWakeLock() { try { if ('wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {} }
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const icon = document.getElementById('theme-icon');
    icon.classList.toggle('fa-sun'); icon.classList.toggle('fa-moon');
}
