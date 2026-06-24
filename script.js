const links = {
    home: 'https://prod-cdn01-live.toffeelive.com/live/FIFA-2026/0/master_1750.m3u8',
    sports: 'YOUR_URL', news: 'YOUR_URL', kids: 'YOUR_URL', doc: 'YOUR_URL', 
    islamic: 'YOUR_URL', bd: 'https://iptv-org.github.io/iptv/countries/bd.m3u', 
    in: 'https://iptv-org.github.io/iptv/countries/in.m3u', pk: 'https://iptv-org.github.io/iptv/countries/pk.m3u'
};

const mainVid = document.getElementById('main-video');
const catVid = document.getElementById('cat-video');
let hlsMain, hlsCat;

// Theme Toggle
document.getElementById('checkbox').addEventListener('change', (e) => {
    document.body.className = e.target.checked ? 'light-theme' : 'dark-theme';
});

// Initial Load
window.onload = () => loadGrid('home', 'main-grid', mainVid, 'main-name', 'main-player-wrapper');

async function loadGrid(key, gridId, vidElem, nameId, wrapperId) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:20px;">Loading Channels...</div>';
    
    try {
        const res = await fetch(links[key]);
        const text = await res.text();
        const channels = parse(text);
        
        grid.innerHTML = '';
        channels.forEach(ch => {
            const card = document.createElement('div');
            card.className = 'channel-card';
            card.innerHTML = `<img src="${ch.logo}" loading="lazy" onerror="this.src='https://via.placeholder.com/100?text=TV'"><span>${ch.name}</span>`;
            card.onclick = () => {
                document.getElementById(wrapperId).style.display = 'block';
                play(vidElem, ch.url, ch.name, nameId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            grid.appendChild(card);
        });
    } catch (e) { grid.innerHTML = 'Error loading.'; }
}

function parse(data) {
    const list = [];
    const lines = data.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('#EXTINF')) {
            const name = lines[i].split(',')[1] || "Channel";
            const logo = lines[i].match(/tvg-logo="([^"]+)"/)?.[1] || "";
            const url = lines[i + 1]?.trim();
            if (url) list.push({ name, logo, url });
        }
    }
    return list;
}

function play(vid, url, name, nameId) {
    document.getElementById(nameId).innerText = name;
    if (Hls.isSupported()) {
        if (vid.id === 'main-video') { if(hlsMain) hlsMain.destroy(); hlsMain = new Hls(); hlsMain.loadSource(url); hlsMain.attachMedia(vid); hlsMain.on(Hls.Events.MANIFEST_PARSED,() => vid.play()); }
        else { if(hlsCat) hlsCat.destroy(); hlsCat = new Hls(); hlsCat.loadSource(url); hlsCat.attachMedia(vid); hlsCat.on(Hls.Events.MANIFEST_PARSED,() => vid.play()); }
    } else if (vid.canPlayType('application/vnd.apple.mpegurl')) {
        vid.src = url; vid.play();
    }
}

function navTo(v) {
    document.getElementById('home-view').style.display = v === 'home' ? 'block' : 'none';
    document.getElementById('cat-list-view').style.display = v === 'cat' ? 'block' : 'none';
    document.getElementById('cat-player-view').style.display = 'none';
    document.getElementById('btn-home').classList.toggle('active', v === 'home');
    document.getElementById('btn-cat').classList.toggle('active', v === 'cat');
    mainVid.pause(); catVid.pause();
}

function openCat(k) {
    document.getElementById('cat-list-view').style.display = 'none';
    document.getElementById('cat-player-view').style.display = 'block';
    document.getElementById('cat-player-wrapper').style.display = 'none';
    loadGrid(k, 'cat-grid', catVid, 'cat-name', 'cat-player-wrapper');
}
