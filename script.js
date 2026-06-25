const wcServers = [
    { name: "FIFA Server 1", url: "https://trs1.aynaott.com/tsports/index.m3u8" },
    { name: "FIFA Server 2", url: "URL_2" },
    { name: "FIFA Server 3", url: "URL_3" },
    { name: "FIFA Server 4", url: "URL_4" }
];

const categoryLinks = {
    sports: 'URL', news: 'URL', kids: 'URL', doc: 'URL', islamic: 'URL',
    bd: 'https://iptv-org.github.io/iptv/countries/bd.m3u',
    in: 'https://iptv-org.github.io/iptv/countries/in.m3u',
    pk: 'https://iptv-org.github.io/iptv/countries/pk.m3u',
    homeExtra: 'https://iptv-org.github.io/iptv/countries/bd.m3u'
};

const mainVid = document.getElementById('main-video');
const catVid = document.getElementById('cat-video');
let hlsMain, hlsCat;

window.onload = () => {
    playWC(0, document.querySelector('.srv-btn'));
    loadHomeExtra();
};

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
            loadStream(mainVid, ch.url, 'main');
            document.getElementById('main-name').innerText = ch.name;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        grid.appendChild(card);
    });
}

function playWC(index, btn) {
    const srv = wcServers[index];
    document.getElementById('main-name').innerText = srv.name;
    document.querySelectorAll('.srv-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadStream(mainVid, srv.url, 'main');
}

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

function navTo(v) {
    document.getElementById('home-view').style.display = v === 'home' ? 'block' : 'none';
    document.getElementById('cat-list-view').style.display = v === 'cat' ? 'block' : 'none';
    document.getElementById('cat-player-view').style.display = 'none';
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + v).classList.add('active');
}

async function openCat(k) {
    document.getElementById('cat-list-view').style.display = 'none';
    document.getElementById('cat-player-view').style.display = 'block';
    const grid = document.getElementById('cat-grid');
    grid.innerHTML = '<p>Loading...</p>';
    const res = await fetch(categoryLinks[k]);
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
}
