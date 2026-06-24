const video = document.getElementById('video');
const channelList = document.getElementById('channel-list');
const playingTitle = document.getElementById('now-playing');

// আপনার .m3u লিঙ্কটি এখানে বসান
const M3U_URL = "https://iptv-org.github.io/iptv/countries/bd.m3u";

async function loadChannels() {
    try {
        const response = await fetch(M3U_URL);
        const data = await response.text();
        const channels = parseM3U(data);
        
        channels.forEach(channel => {
            const card = document.createElement('div');
            card.className = 'channel-card';
            card.innerHTML = `
                <img src="${channel.logo}" alt="${channel.name}">
                <p>${channel.name}</p>
            `;
            card.onclick = () => playVideo(channel.url, channel.name);
            channelList.appendChild(card);
        });
    } catch (err) {
        console.error("চ্যানেল লোড করতে সমস্যা হচ্ছে", err);
    }
}

function parseM3U(data) {
    const lines = data.split('\n');
    const channels = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
            const name = lines[i].split(',')[1];
            const logoMatch = lines[i].match(/tvg-logo="([^"]+)"/);
            const logo = logoMatch ? logoMatch[1] : "https://via.placeholder.com/150";
            const url = lines[i + 1];
            channels.push({ name, logo, url });
        }
    }
    return channels;
}

function playVideo(url, name) {
    playingTitle.innerText = "Now Playing: " + name;
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
    } else {
        video.src = url;
    }
}

loadChannels();
function changeTab(tabName) {
    // সব আইটেম থেকে 'active' ক্লাস সরিয়ে ফেলুন
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    // যেটিতে ক্লিক করা হয়েছে সেটিতে 'active' ক্লাস যোগ করুন
    event.currentTarget.classList.add('active');

    // এখানে আপনি ভবিষ্যতে ট্যাব অনুযায়ী কন্টেন্ট পরিবর্তন করার কোড লিখতে পারেন
    if(tabName === 'category') {
        alert('ক্যাটেগরি পেজ শীঘ্রই আসছে!');
    } else if(tabName === 'highlights') {
        alert('হাইলাইটস পেজ শীঘ্রই আসছে!');
    }
}
