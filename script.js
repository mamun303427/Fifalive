// Video.js প্লেয়ার ইনস্ট্যান্সগুলো ট্র্যাক করার জন্য গ্লোবাল ভেরিয়েবল
let mainPlayerInstance = null;
let catPlayerInstance = null;

const m3uLinks = {
    home: 'https://iptv-org.github.io/iptv/countries/bd.m3u',
    sports: 'YOUR_SPORTS_LINK',
    news: 'YOUR_NEWS_LINK',
    kids: 'YOUR_KIDS_LINK',
    doc: 'YOUR_DOC_LINK',
    islamic: 'YOUR_ISLAMIC_LINK',
    bd: 'https://iptv-org.github.io/iptv/countries/bd.m3u',
    in: 'https://iptv-org.github.io/iptv/countries/in.m3u',
    pk: 'https://iptv-org.github.io/iptv/countries/pk.m3u'
};

// থিম পরিবর্তন লজিক
document.querySelector('#checkbox').addEventListener('change', (e) => {
    document.body.className = e.target.checked ? 'light-theme' : 'dark-theme';
});

// পেজ লোড হলে চ্যানেল লিস্ট দেখাবে কিন্তু প্লে হবে না
window.onload = () => {
    // Video.js প্লেয়ার ইনিশিয়ালাইজ করুন
    mainPlayerInstance = videojs('main-player');
    catPlayerInstance = videojs('cat-player');
    
    fetchChannels('home', 'main-grid', mainPlayerInstance, 'main-ch-name', 'main-player-container');
};

async function fetchChannels(key, gridId, playerInstance, titleId, containerId) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '<p style="text-align:center; width:100%;">Loading Channels...</p>';
    
    try {
        const response = await fetch(m3uLinks[key]);
        const data = await response.text();
        const channels = parseM3U(data);
        
        grid.innerHTML = '';
        channels.forEach(ch => {
            const card = document.createElement('div');
            card.className = 'channel-card';
            card.innerHTML = `<img src="${ch.logo}" onerror="this.src='https://via.placeholder.com/100?text=TV'"><span>${ch.name}</span>`;
            card.onclick = () => {
                document.getElementById(containerId).style.display = 'block';
                playStream(playerInstance, ch.url, ch.name, titleId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            grid.appendChild(card);
        });
    } catch (e) {
        grid.innerHTML = '<p>Error loading channels.</p>';
        console.error("Error fetching channels:", e);
    }
}

function parseM3U(data) {
    const lines = data.split('\n');
    const list = [];
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

function playStream(playerInstance, url, name, titleId) {
    document.getElementById(titleId).innerText = name;
    playerInstance.src({
        src: url,
        type: 'application/x-mpegURL' // HLS স্ট্রিমের জন্য সঠিক টাইপ
    });
    playerInstance.play();
}

function navTo(view) {
    document.getElementById('home-view').style.display = view === 'home' ? 'block' : 'none';
    document.getElementById('cat-list-view').style.display = view === 'cat' ? 'block' : 'none';
    document.getElementById('cat-player-view').style.display = 'none';
    
    document.getElementById('nav-home').classList.toggle('active', view === 'home');
    document.getElementById('nav-cat').classList.toggle('active', view === 'cat');
    
    // ভিউ চেঞ্জ করলে প্লেয়ার পজ হবে এবং প্লেয়ার কন্টেইনার হাইড হবে
    if (mainPlayerInstance) {
        mainPlayerInstance.pause();
        document.getElementById('main-player-container').style.display = 'none';
    }
    if (catPlayerInstance) {
        catPlayerInstance.pause();
        document.getElementById('cat-player-container').style.display = 'none';
    }
}

function openCategory(key) {
    document.getElementById('cat-list-view').style.display = 'none';
    document.getElementById('cat-player-view').style.display = 'block';
    // ক্যাটেগরি চ্যানেলের ক্ষেত্রেও প্লেয়ার শুরুতে লুকানো থাকবে
    document.getElementById('cat-player-container').style.display = 'none';
    fetchChannels(key, 'cat-grid', catPlayerInstance, 'cat-ch-name', 'cat-player-container');
}
