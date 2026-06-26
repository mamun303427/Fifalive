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
let hlsMain = null;
let hlsCat = null;
let wakeLock = null;

// ইনিশিয়াল লোড
window.onload = () => {
    playWC(0, document.querySelector('.srv-btn'));
    loadHomeExtra();
};

// সাউন্ড আনমিউট লজিক (ইউজার প্রথমবার টাচ করলেই সাউন্ড আসবে)
document.body.addEventListener('touchstart', function unmute() {
    mainVid.muted = false;
    catVid.muted = false;
    document.body.removeEventListener('touchstart', unmute);
}, { once: true });

function playWC(index, btn) {
    const srv = wcServers[index];
    serverSection.style.display = 'block';
    document.getElementById('main-name').innerText = srv.name;
    document.querySelectorAll('.srv-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadStream(mainVid, srv.url, 'main');
}

function loadStream(vid, url, type) {
    vid.muted = false;

    // আগের HLS কানেকশন বন্ধ করা
    if (type === 'main' && hlsMain) {
        hlsMain.destroy();
        hlsMain = null;
    } else if (type === 'cat' && hlsCat) {
        hlsCat.destroy();
        hlsCat = null;
    }

    if (Hls.isSupported()) {
        const hls = new Hls();
        if (type === 'main') hlsMain = hls; else hlsCat = hls;

        hls.loadSource(url);
        hls.attachMedia(vid);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            vid.play().catch(() => {
                vid.muted = true;
                vid.play();
            });
        });
    } else if (vid.canPlayType('application/vnd.apple.mpegurl')) {
        vid.src = url;
        vid.play().catch(() => {
            vid.muted = true;
            vid.play();
        });
    }
    requestWakeLock();
}

async function loadHomeExtra() {
    const grid = document.getElementById('home-extra-grid');
    try {
        const res = await fetch(categoryLinks.homeExtra);
        const data = await res.text();
        const channels = parseM3U(data);
        grid.innerHTML = '';
        channels.slice(0, 16).forEach(ch => { 
            const card = document.createElement('div');
            card.className = 'channel-card';
            card.innerHTML = `<img src="${ch.logo}" onerror="this.src='https://via.placeholder.com/100?text=TV'"><span>${ch.name}</span>`;
            card.onclick = () => {
                serverSection.style.display = 'none';
                loadStream(mainVid, ch.url, 'main');
                document.getElementById('main-name').innerText = ch.name;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            grid.appendChild(card);
        });
    } catch (e) { console.log('Home Extra Error'); }
}

// নেভিগেশন লজিক (ভিডিও এবং অডিও পুরোপুরি বন্ধ করার জন্য আপডেট করা হয়েছে)
function navTo(v) {
    // সব ভিডিও পজ করা
    mainVid.pause();
    catVid.pause();

    // ভিডিওর সোর্স খালি করা যাতে ডাটা লোড বন্ধ হয়
    mainVid.src = "";
    catVid.src = "";

    // HLS কানেকশন পুরোপুরি বিচ্ছিন্ন করা
    if (hlsMain) {
        hlsMain.destroy();
        hlsMain = null;
    }
    if (hlsCat) {
        hlsCat.destroy();
        hlsCat = null;
    }

    document.getElementById('home-view').style.display = v === 'home' ? 'block' : 'none';
    document.getElementById('cat-list-view').style.display = v === 'cat' ? 'block' : 'none';
    document.getElementById('cat-player-view').style.display = 'none';
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if (document.getElementById('btn-' + v)) {
        document.getElementById('btn-' + v).classList.add('active');
    }

    if(v === 'home') {
        playWC(0, document.querySelector('.srv-btn'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        if (wakeLock) { 
            wakeLock.release().then(() => { wakeLock = null; }); 
        }
    }
}

async function openCat(k) {
    // হোম পেজের ভিডিও পুরোপুরি বন্ধ করা
    mainVid.pause();
    mainVid.src = "";
    if (hlsMain) {
        hlsMain.destroy();
        hlsMain = null;
    }

    document.getElementById('cat-list-view').style.display = 'none';
    document.getElementById('cat-player-view').style.display = 'block';
    const grid = document.getElementById('cat-grid');
    grid.innerHTML = '<p style="text-align:center; padding:20px;">Loading...</p>';
    
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
                loadStream(catVid, ch.url, 'cat');
                document.getElementById('cat-name').innerText = ch.name;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            grid.appendChild(card);
            if(idx === 0) { 
                loadStream(catVid, ch.url, 'cat'); 
                document.getElementById('cat-name').innerText = ch.name; 
            }
        });
    } catch (e) { grid.innerHTML = 'Error'; }
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

async function requestWakeLock() {
    try { 
        if ('wakeLock' in navigator && !wakeLock) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) { }
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
