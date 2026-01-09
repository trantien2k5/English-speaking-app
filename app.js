// --- 1. QUẢN LÝ DỮ LIỆU & CẤU HÌNH (STORE) ---
const Store = {
    data: [],
    user: JSON.parse(localStorage.getItem('nf_user')) || { 
        name: 'Learner', 
        streak: 0, 
        xp: 0, 
        completed: [] 
    },
    
    async init() {
        try {
            const res = await fetch('./course.json');
            this.data = await res.json();
            this.updateUI();
        } catch (e) {
            Swal.fire('Lỗi', 'Không tải được dữ liệu (Cần chạy Live Server)', 'error');
        }
    },
    
    complete(id) {
        if (!this.user.completed.includes(id)) {
            this.user.completed.push(id);
            this.user.streak++;
            this.user.xp += 100; // Thêm XP khi học xong
            this.save();
        }
    },

    save() {
        localStorage.setItem('nf_user', JSON.stringify(this.user));
        this.updateUI();
    },

    reset() {
        if(confirm('Bạn có chắc muốn xóa toàn bộ tiến độ?')) {
            localStorage.removeItem('nf_user');
            location.reload();
        }
    },
    
    updateUI() {
        const streakEl = document.getElementById('streak-display');
        if(streakEl) streakEl.innerText = this.user.streak;
    }
};

// --- 2. XỬ LÝ ÂM THANH (AUDIO ENGINE) ---
const AudioEngine = {
    recognition: null,
    
    init(callback) {
        if (!('webkitSpeechRecognition' in window)) {
            Swal.fire('Lỗi Mic', 'Vui lòng dùng Chrome Android hoặc PC', 'warning');
            return;
        }
        const rec = new webkitSpeechRecognition();
        rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = false;
        rec.onresult = (e) => callback(e.results[0][0].transcript);
        rec.onend = () => document.getElementById('mic-btn')?.classList.remove('mic-active');
        this.recognition = rec;
    },

    listen() { try { this.recognition.start(); document.getElementById('mic-btn').classList.add('mic-active'); } catch(e){} },
    stop() { try { this.recognition.stop(); document.getElementById('mic-btn').classList.remove('mic-active'); } catch(e){} },

    speak(text) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; u.rate = 0.9;
        window.speechSynthesis.speak(u);
    }
};

// --- 3. ĐIỀU HƯỚNG & GIAO DIỆN (APP CONTROLLER) ---
const App = {
    currentLesson: null,
    step: 0,

    async start() {
        await Store.init();
        this.router('home');
    },

    // --- ROUTER: CHUYỂN TRANG MƯỢT MÀ ---
    router(page, param = null) {
        const main = document.getElementById('main-view');
        const header = document.getElementById('app-header');
        const nav = document.getElementById('bottom-nav');
        
        // Reset Nav Active State
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('text-primary'));
        const activeBtn = document.querySelector(`button[onclick="App.router('${page}')"]`);
        if(activeBtn) activeBtn.classList.add('text-primary');

        // Logic hiển thị từng trang
        if (page === 'home') {
            header.classList.remove('hidden'); nav.classList.remove('hidden');
            this.renderHome(main);
        } 
        else if (page === 'practice') {
            header.classList.add('hidden'); nav.classList.add('hidden');
            this.renderPractice(main, param);
        }
        else if (page === 'stats') {
            header.classList.add('hidden'); nav.classList.remove('hidden');
            this.renderStats(main);
        }
        else if (page === 'rank') { // Thêm trang Rank
            header.classList.add('hidden'); nav.classList.remove('hidden');
            this.renderRank(main);
        }
        else if (page === 'profile') { // Thêm trang Profile
            header.classList.add('hidden'); nav.classList.remove('hidden');
            this.renderProfile(main);
        }
    },

    // --- VIEW: HOME ---
    renderHome(container) {
        let html = `<div class="px-5 py-4 text-xs font-bold text-gray-400 tracking-widest uppercase">Lộ trình học tập</div>`;
        
        Store.data.forEach(l => {
            const isDone = Store.user.completed.includes(l.id);
            const statusStyle = isDone ? 'bg-green-500 text-white border-green-500' : 'bg-gray-100 text-gray-300 border-gray-100';
            const icon = isDone ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-play"></i>';

            html += `
            <div onclick="App.router('practice', ${l.id})" 
                 class="mx-5 mb-4 p-4 bg-white rounded-2xl border-2 border-gray-100 shadow-[0_4px_0_#E5E5E5] active:translate-y-1 active:shadow-none transition-all flex items-center gap-4 cursor-pointer relative overflow-hidden group">
                <div class="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-50">
                    <img src="${l.image}" class="w-10 h-10 object-contain group-hover:scale-110 transition-transform">
                </div>
                <div class="flex-1">
                    <div class="font-extrabold text-gray-800 text-lg mb-1">${l.title}</div>
                    <div class="text-sm text-gray-500 line-clamp-1">${l.desc}</div>
                </div>
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg ${statusStyle}">
                    ${icon}
                </div>
            </div>`;
        });
        html += `<div class="h-10"></div>`;
        container.innerHTML = html;
    },

    // --- VIEW: STATS (THỐNG KÊ) ---
    renderStats(container) {
        const percent = Math.round((Store.user.completed.length / Math.max(Store.data.length, 1)) * 100);
        container.innerHTML = `
            <div class="p-6">
                <h2 class="text-2xl font-extrabold text-gray-800 mb-6">Thống kê</h2>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-orange-50 p-4 rounded-2xl border-2 border-orange-100">
                        <div class="text-orange-500 text-3xl mb-1"><i class="fa-solid fa-fire"></i></div>
                        <div class="text-2xl font-black text-gray-800">${Store.user.streak}</div>
                        <div class="text-xs text-gray-500 font-bold uppercase">Ngày Streak</div>
                    </div>
                    <div class="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100">
                        <div class="text-blue-500 text-3xl mb-1"><i class="fa-solid fa-bolt"></i></div>
                        <div class="text-2xl font-black text-gray-800">${Store.user.xp}</div>
                        <div class="text-xs text-gray-500 font-bold uppercase">Tổng XP</div>
                    </div>
                </div>

                <div class="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div class="flex justify-between mb-2">
                        <span class="font-bold text-gray-600">Tiến độ khóa học</span>
                        <span class="font-bold text-primary">${percent}%</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-4">
                        <div class="bg-primary h-4 rounded-full transition-all duration-1000" style="width: ${percent}%"></div>
                    </div>
                    <div class="mt-4 text-center text-sm text-gray-500">
                        Đã hoàn thành <b>${Store.user.completed.length}</b> / ${Store.data.length} bài học
                    </div>
                </div>
            </div>
        `;
    },

    // --- VIEW: RANK (BẢNG XẾP HẠNG GIẢ LẬP) ---
    renderRank(container) {
        // Fake data cho vui
        const ranks = [
            { name: "David Chill", xp: 1250, img: "https://i.pravatar.cc/150?img=11" },
            { name: "Sarah Code", xp: 980, img: "https://i.pravatar.cc/150?img=5" },
            { name: Store.user.name + " (Bạn)", xp: Store.user.xp, img: "https://ui-avatars.com/api/?name=Me&background=random", isMe: true },
            { name: "Alex Pro", xp: 200, img: "https://i.pravatar.cc/150?img=3" },
        ].sort((a,b) => b.xp - a.xp);

        let html = `
            <div class="p-6">
                <h2 class="text-2xl font-extrabold text-gray-800 mb-6 text-center">Bảng xếp hạng</h2>
                <div class="flex flex-col gap-3">
        `;

        ranks.forEach((r, index) => {
            const bg = r.isMe ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100';
            const rankNum = index + 1;
            let medal = `<span class="font-bold text-gray-400 w-6 text-center">${rankNum}</span>`;
            if (rankNum === 1) medal = '🥇';
            if (rankNum === 2) medal = '🥈';
            if (rankNum === 3) medal = '🥉';

            html += `
                <div class="${bg} p-3 rounded-xl border-2 flex items-center gap-3 shadow-sm">
                    <div class="text-xl">${medal}</div>
                    <img src="${r.img}" class="w-10 h-10 rounded-full object-cover">
                    <div class="flex-1 font-bold ${r.isMe ? 'text-primary' : 'text-gray-700'}">${r.name}</div>
                    <div class="font-bold text-gray-400 text-sm">${r.xp} XP</div>
                </div>
            `;
        });
        html += `</div></div>`;
        container.innerHTML = html;
    },

    // --- VIEW: PROFILE (CÀI ĐẶT) ---
    renderProfile(container) {
        container.innerHTML = `
            <div class="p-6 flex flex-col items-center">
                <div class="w-24 h-24 rounded-full border-4 border-primary p-1 mb-4">
                    <img src="https://ui-avatars.com/api/?name=${Store.user.name}&background=random" class="w-full h-full rounded-full object-cover">
                </div>
                <h2 class="text-2xl font-extrabold text-gray-800 mb-1">${Store.user.name}</h2>
                <div class="text-gray-400 text-sm font-bold mb-8">Thành viên mới</div>

                <div class="w-full flex flex-col gap-3">
                    <button class="w-full bg-white border-2 border-gray-100 p-4 rounded-xl font-bold text-gray-700 flex justify-between items-center active:bg-gray-50">
                        <span><i class="fa-solid fa-bell mr-3 text-blue-500"></i> Nhắc nhở học tập</span>
                        <div class="w-10 h-5 bg-green-500 rounded-full relative"><div class="w-4 h-4 bg-white rounded-full absolute right-1 top-0.5"></div></div>
                    </button>
                    
                    <button onclick="Store.reset()" class="w-full bg-white border-2 border-red-100 p-4 rounded-xl font-bold text-red-500 flex justify-between items-center active:bg-red-50">
                        <span><i class="fa-solid fa-trash mr-3"></i> Xóa dữ liệu & Học lại</span>
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
    },

    // --- VIEW: PRACTICE (BÀI HỌC) ---
    renderPractice(container, id) {
        this.currentLesson = Store.data.find(l => l.id === id);
        this.step = 0;

        container.innerHTML = `
            <div class="sticky top-0 bg-white/95 backdrop-blur-md p-4 flex items-center justify-between border-b border-gray-100 z-20">
                <button onclick="App.router('home')" class="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-800 transition">
                    <i class="fa-solid fa-arrow-left text-xl"></i>
                </button>
                <div class="font-extrabold text-lg text-primary">${this.currentLesson.title}</div>
                <div class="w-10"></div>
            </div>

            <div id="chat-stream" class="p-5 flex flex-col gap-4 pb-48"></div>

            <div class="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 p-6 pb-8 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 flex flex-col items-center">
                <div class="text-center mb-6 w-full">
                    <div id="target-text" class="text-xl font-bold text-gray-800 mb-2 min-h-[1.75rem]">Listening...</div>
                    <div id="phonetic" class="font-mono text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full inline-block">...</div>
                </div>
                
                <button id="mic-btn" onclick="App.toggleMic()" 
                    class="w-20 h-20 rounded-full bg-primary text-white text-3xl flex items-center justify-center shadow-[0_8px_0_#3fa302] active:translate-y-2 active:shadow-none transition-all">
                    <i class="fa-solid fa-microphone"></i>
                </button>
            </div>
        `;
        AudioEngine.init((text) => this.handleVoice(text));
        this.nextStep();
    },

    nextStep() {
        const dialog = this.currentLesson.dialogue;
        if (this.step >= dialog.length) {
            Store.complete(this.currentLesson.id);
            Swal.fire({
                title: 'Xuất sắc!', text: '+100 XP', icon: 'success',
                confirmButtonText: 'Tiếp tục', confirmButtonColor: '#58CC02'
            }).then(() => this.router('home'));
            return;
        }

        const line = dialog[this.step];
        const stream = document.getElementById('chat-stream');

        if (line.role === 'teacher') {
            const html = `
                <div class="flex items-end gap-3 bubble-pop">
                    <img src="https://cdn-icons-png.flaticon.com/512/3406/3406987.png" class="w-9 h-9 rounded-full bg-gray-100 p-1">
                    <div class="max-w-[80%] bg-white border-2 border-gray-100 p-3.5 rounded-2xl rounded-bl-none text-gray-700 shadow-sm leading-relaxed">
                        ${line.content.split(' ').map(w => `<span onclick="AudioEngine.speak('${w.replace(/'/g,"\\'")}')" class="cursor-pointer hover:text-primary hover:underline decoration-dotted">${w}</span>`).join(' ')}
                    </div>
                </div>`;
            stream.insertAdjacentHTML('beforeend', html);
            stream.scrollTop = stream.scrollHeight;
            AudioEngine.speak(line.content);
            setTimeout(() => { this.step++; this.nextStep(); }, Math.max(2000, line.content.length * 60));
        } else {
            document.getElementById('target-text').innerText = line.target;
            document.getElementById('phonetic').innerText = line.phonetic;
        }
    },

    toggleMic() {
        const btn = document.getElementById('mic-btn');
        if (btn.classList.contains('mic-active')) AudioEngine.stop();
        else AudioEngine.listen();
    },

    handleVoice(userText) {
        AudioEngine.stop();
        const target = this.currentLesson.dialogue[this.step].target;
        // @ts-ignore
        const dmp = new diff_match_patch();
        const diffs = dmp.diff_main(target.toLowerCase().replace(/[.,?!]/g, ""), userText.toLowerCase().replace(/[.,?!]/g, ""));
        dmp.diff_cleanupSemantic(diffs);

        let htmlDiff = diffs.map(d => {
            if(d[0] === 0) return `<span class="text-green-500 font-bold">${d[1]}</span>`;
            if(d[0] === 1) return `<span class="text-red-400 font-bold line-through decoration-2">${d[1]}</span>`;
            return '';
        }).join('');

        const stream = document.getElementById('chat-stream');
        const html = `
            <div class="flex items-end gap-3 flex-row-reverse bubble-pop">
                <img src="https://cdn-icons-png.flaticon.com/512/924/924915.png" class="w-9 h-9 rounded-full bg-gray-100 p-1">
                <div class="max-w-[80%] bg-primary text-white p-3.5 rounded-2xl rounded-br-none shadow-md leading-relaxed">
                    ${htmlDiff}
                </div>
            </div>`;
        stream.insertAdjacentHTML('beforeend', html);
        stream.scrollTop = stream.scrollHeight;

        let correctCount = diffs.filter(d => d[0] === 0).reduce((acc, curr) => acc + curr[1].length, 0);
        let score = (correctCount / target.length) * 100;

        if (score > 60) {
            new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3').play().catch(()=>{});
            setTimeout(() => { this.step++; this.nextStep(); }, 1000);
        } else {
            const hint = document.getElementById('target-text');
            hint.innerHTML = `<span class="text-red-500">Thử lại:</span> ${target}`;
        }
    }
};

window.App = App;
window.AudioEngine = AudioEngine;
App.start();