// ১. কনফিগারেশন
const wcServers = [
    { name: "T Sports HD", url: "http://rgkkw.live:80/live/1Aoen7elp5/IgMJ60tmAa/130714.ts" },
    { name: "T Sports Backup", url: "https://trs1.aynaott.com/tsports/tracks-v1a1/mono.ts.m3u8" },
    { name: "Bein Sports 1", url: "https://1nyaler.streamhostingcdn.top/stream/23/index.m3u8" },
    { name: "Bein Sports 3", url: "https://ua.online24.pm/play/1103/350B326FB34F4B8/video.m3u8" },
    { name: "Caze Tv", url: "https://dfr80qz435crc.cloudfront.net/MNOP/Amagi/Caze/Caze_TV_BR/1080p-vtt/index.m3u8" },
    { name: "Server 6", url: "http://go8knm.optikl.ink/X/index.php/Besyria1/video.m3u8" },
    { name: "Server 7", url: "https://dfr80qz435crc.cloudfront.net/MNOP/Amagi/Caze/Caze_TV_BR/1080p-vtt/index.m3u8" },
    { name: "Server 8", url: "https://tvsen5.aynaott.com/PtvSports/index.m3u8" },
    { name: "CCTV 5", url: "https://play1.gzxdby.com/live/783234345958_4547667094.m3u8" },
    { name: "Server 10", url: "https://trs1.aynaott.com/tsports/tracks-v1a1/mono.ts.m3u8" }
];

const categoryLinks = {
    sports: 'https://is.gd/yQuS1g.m3u',
    news: 'https://raw.githubusercontent.com/mamun303427/Fifalive/refs/heads/main/News%20Channel.m3u',
    kids: 'https://raw.githubusercontent.com/mamun303427/Fifalive/refs/heads/main/Kids%20Channels.m3u',
    islamic: 'https://raw.githubusercontent.com/mamun303427/Fifalive/refs/heads/main/Islamic%20Tv.m3u',
    bd: 'https://raw.githubusercontent.com/mamun303427/Fifalive/refs/heads/main/Bangladeshi%20Tv.m3u',
    in: 'https://raw.githubusercontent.com/iptv-org/iptv/refs/heads/master/streams/in.m3u',
    pk: 'https://iptv-org.github.io/iptv/countries/pk.m3u',
    homeExtra: 'https://go.skym3u.top/ziyf.m3u'
};

const mainVid = document.getElementById('main-video');
const catVid = document.getElementById('cat-video');
const serverSection = document.getElementById('server-section');
let hlsMain = null, hlsCat = null, wakeLock = null;
let currentSrvIdx = 0; // বর্তমানে কোন সার্ভার চলছে তা ট্র্যাক করার জন্য
let failoverTimeout = null; // ১০ সেকেন্ড টাইমার

// ২. ইনিশিয়াল লোড
window.onload = () => {
    startAutoFailover(); // ১০ সেকেন্ড লজিকসহ শুরু করা
    loadHomeExtra();
};

// ৩. অটো-ফেইলওভার লজিক (১০ সেকেন্ডের মধ্যে প্লে না হলে পরের সার্ভার)
function startAutoFailover() {
    if (currentSrvIdx >= wcServers.length) {
        console.log("All servers failed.");
        document.getElementById('main-name').innerText = "All servers are offline.";
        return;
    }

    const srv = wcServers[currentSrvIdx];
    const srvButtons = document.querySelectorAll('.srv-btn');
    
    // UI আপডেট (অ্যাক্টিভ বাটন সেট করা)
    document.getElementById('main-name').innerText = "Connecting to " + srv.name + "...";
    srvButtons.forEach(b => b.classList.remove('active'));
    if(srvButtons[currentSrvIdx]) srvButtons[currentSrvIdx].classList.add('active');

    // ভিডিও লোড করা
    loadStream(mainVid, srv.url, 'main');

    // ১০ সেকেন্ডের টাইমার শুরু
    clearTimeout(failoverTimeout);
    failoverTimeout = setTimeout(() => {
        console.log(srv.name + " did not play in 10s. Trying next...");
        currentSrvIdx++;
        startAutoFailover();
    }, 7000); // ৭০০০ মিলি-সেকেন্ড = ৭ সেকেন্ড
}

// ভিডিও যখন চলতে শুরু করবে তখন টাইমার বন্ধ হয়ে যাবে
mainVid.onplaying = () => {
    clearTimeout(failoverTimeout);
    document.getElementById('main-name').innerText = wcServers[currentSrvIdx].name;
    console.log("Stream started successfully!");
};

// যদি ভিডিওতে কোনো এরর আসে (যেমন লিঙ্ক কাজ করছে না), সাথে সাথে পরেরটাতে যাবে
mainVid.onerror = () => {
    clearTimeout(failoverTimeout);
    currentSrvIdx++;
    startAutoFailover();
};

// ৪. সাধারণ প্লে বাটন ক্লিক লজিক
function playWC(index, btn) {
    clearTimeout(failoverTimeout); // ম্যানুয়ালি ক্লিক করলে অটোমেটিক টাইমার অফ হবে
    currentSrvIdx = index;
    const srv = wcServers[index];
    serverSection.style.display = 'block';
    document.getElementById('main-name').innerText = srv.name;
    document.querySelectorAll('.srv-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    loadStream(mainVid, srv.url, 'main');
}

// ৫. স্ট্রিম লোডার (অপ্টিমাইজড)
function loadStream(vid, url, type) {
    if (type === 'main' && hlsMain) { hlsMain.destroy(); hlsMain = null; }
    if (type === 'cat' && hlsCat) { hlsCat.destroy(); hlsCat = null; }

    if (Hls.isSupported()) {
        const hls = new Hls({ capLevelToPlayerSize: true, lowLatencyMode: true });
        if (type === 'main') hlsMain = hls; else hlsCat = hls;
        hls.loadSource(url);
        hls.attachMedia(vid);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            vid.play().catch(() => { vid.muted = true; vid.play(); });
        });
    } else {
        vid.src = url;
        vid.play().catch(() => { vid.muted = true; vid.play(); });
    }
    requestWakeLock();
}

// ক্যাটেগরি এবং অন্যান্য নেভিগেশন লজিক
async function openCat(k) {
    clearTimeout(failoverTimeout); // ক্যাটেগরিতে গেলে হোমপেজের টাইমার অফ হবে
    mainVid.pause();
    document.getElementById('cat-list-view').style.display = 'none';
    document.getElementById('cat-player-view').style.display = 'block';
    const grid = document.getElementById('cat-grid');
    grid.innerHTML = '<p style="text-align:center; padding:20px;">Fetching Channels...</p>';
    
    try {
        const res = await fetch(categoryLinks[k] || categoryLinks.bd);
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
    } catch (e) { grid.innerHTML = 'Error loading channels'; }
}

function navTo(v) {
    clearTimeout(failoverTimeout);
    mainVid.pause(); catVid.pause();
    mainVid.src = ""; catVid.src = "";
    if (hlsMain) { hlsMain.destroy(); hlsMain = null; }
    if (hlsCat) { hlsCat.destroy(); hlsCat = null; }

    document.getElementById('home-view').style.display = v === 'home' ? 'block' : 'none';
    document.getElementById('cat-list-view').style.display = v === 'cat' ? 'block' : 'none';
    document.getElementById('cat-player-view').style.display = 'none';
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('btn-' + v);
    if (btn) btn.classList.add('active');

    if(v === 'home') {
        currentSrvIdx = 0; // আবার সার্ভার ১ থেকে শুরু হবে
        startAutoFailover();
    }
}

// সাউন্ড আনমিউট লজিক
document.body.addEventListener('touchstart', () => {
    [mainVid, catVid].forEach(v => { if(v.muted) v.muted = false; });
}, { once: true });

async function loadHomeExtra() {
    const grid = document.getElementById('home-extra-grid');
    const res = await fetch(categoryLinks.homeExtra);
    const data = await res.text();
    const channels = parseM3U(data);
    grid.innerHTML = '';
    channels.slice(0, 20).forEach(ch => { 
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `<img src="${ch.logo}" onerror="this.src='https://via.placeholder.com/100?text=TV'"><span>${ch.name}</span>`;
        card.onclick = () => {
            clearTimeout(failoverTimeout);
            serverSection.style.display = 'none';
            loadStream(mainVid, ch.url, 'main');
            document.getElementById('main-name').innerText = ch.name;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        grid.appendChild(card);
    });
}

function parseM3U(data) {
    const list = [];
    const lines = data.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('#EXTINF')) {
            const name = lines[i].split(',')[1] || "TV";
            const logo = lines[i].match(/tvg-logo="([^"]+)"/)?.[1] || "";
            const url = lines[i + 1]?.trim();
            if (url && url.startsWith('http')) list.push({ name, logo, url });
        }
    }
    return list;
}

async function requestWakeLock() { try { if ('wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {} }
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const icon = document.getElementById('theme-icon');
    icon.classList.toggle('fa-sun'); icon.classList.toggle('fa-moon');
}
