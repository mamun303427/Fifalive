const wcServers = [
    { name: "T Sports HD", url: "https://trs1.aynaott.com/tsports/index.m3u8" }, // আপনার লিঙ্ক দিন
    { name: "Server 2", url: "URL_2" },
    { name: "Server 3", url: "URL_3" },
    { name: "Server 4", url: "URL_4" },
    { name: "Server 5", url: "URL_5" }
];

const categoryLinks = {
    sports: 'এখানে_স্পোর্টস_লিঙ্ক_দিন',
    news: 'এখানে_নিউজ_লিঙ্ক_দিন',
    kids: 'এখানে_কিডস_লিঙ্ক_দিন',
    doc: 'এখানে_ডকুমেন্টারি_লিঙ্ক_দিন',
    islamic: 'এখানে_ইসলামিক_লিঙ্ক_দিন',
    bd: 'https://iptv-org.github.io/iptv/countries/bd.m3u',
    in: 'https://raw.githubusercontent.com/iptv-org/iptv/refs/heads/master/streams/in.m3u',
    pk: 'https://iptv-org.github.io/iptv/countries/pk.m3u',
    homeExtra: 'https://github.com/mamun303427/Fifalive/blob/main/Fifa%20world%20cup.m3u' // হোম পেজের নিচের চ্যানেল
};

const mainVid = document.getElementById('main-video');
const catVid = document.getElementById('cat-video');
const serverSection = document.getElementById('server-section');
let hlsMain, hlsCat;

window.onload = () => {
    playWC(0, document.querySelector('.srv-btn'));
    loadHomeExtra();
};

// ১. নেভিগেশন লজিক (হোম ছাড়া অন্য কোথাও গেলে পজ হবে)
function navTo(v) {
    document.getElementById('home-view').style.display = v === 'home' ? 'block' : 'none';
    document.getElementById('cat-list-view').style.display = v === 'cat' ? 'block' : 'none';
    document.getElementById('cat-player-view').style.display = 'none';
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + v).classList.add('active');

    if(v === 'home') {
        // হোমে ক্লিক করলে সার্ভার ১ আবার প্লে হবে
        playWC(0, document.querySelector('.srv-btn'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // হোম বাটন ছাড়া অন্য কোথাও ক্লিক করলে মেইন ভিডিও পজ হবে
        mainVid.pause();
        catVid.pause();
    }
}

// ২. ক্যাটেগরি ওপেন করার লজিক (এখানেও মেইন ভিডিও পজ হবে)
async function openCat(k) {
    // ক্যাটেগরি পেজ ওপেন হওয়ার সাথে সাথে হোম ভিডিও পজ করা
    mainVid.pause();

    document.getElementById('cat-list-view').style.display = 'none';
    document.getElementById('cat-player-view').style.display = 'block';
    const grid = document.getElementById('cat-grid');
    grid.innerHTML = '<p style="text-align:center; padding:20px;">Loading Channels...</p>';
    
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
        
        // ক্যাটেগরির প্রথম চ্যানেল অটো-প্লে (ইচ্ছে করলে এটিও বন্ধ রাখতে পারেন)
        if(idx === 0) {
            loadStream(catVid, ch.url, 'cat');
            document.getElementById('cat-name').innerText = ch.name;
        }
    });
}

// ৩. সার্ভার প্লে লজিক
function playWC(index, btn) {
    const srv = wcServers[index];
    serverSection.style.display = 'block';
    document.getElementById('main-name').innerText = srv.name;
    document.querySelectorAll('.srv-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadStream(mainVid, srv.url, 'main');
}

// ৪. স্ট্রীম লোড ফাংশন
function loadStream(vid, url, type) {
    if (Hls.isSupported()) {
        if (type === 'main') {
            if(hlsMain) hlsMain.destroy();
            hlsMain = new Hls(); hlsMain.loadSource(url); hlsMain.attachMedia(vid);
            hlsMain.on(Hls.Events.MANIFEST_PARSED, () => vid.play());
        } else {
            if(hlsCat) hlsCat.destroy();
            hlsCat = new Hls(); hlsCat.loadSource(url); hlsCat.attachMedia(vid);
            hlsCat.on(Hls.Events.MANIFEST_PARSED, () => vid.play());
        }
    } else if (vid.canPlayType('application/vnd.apple.mpegurl')) {
        vid.src = url; vid.play();
    }
}

// ৫. রিকমেন্ডেড চ্যানেল লোড (নিচে চ্যানেলে ক্লিক করলে ভিডিও পজ লজিক অলরেডি আছে যেহেতু প্লেয়ার চেঞ্জ হয় না)
async function loadHomeExtra() {
    const grid = document.getElementById('home-extra-grid');
    const res = await fetch(categoryLinks.homeExtra);
    const data = await res.text();
    const channels = parseM3U(data);
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
}

// বাকি কমন ফাংশনগুলো
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
