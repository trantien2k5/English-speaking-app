// --- 1. QUẢN LÝ DỮ LIỆU (STORE) ---
const Store = {
    data: [], // Chứa bài học
    user: JSON.parse(localStorage.getItem('nf_user')) || { streak: 0, completed: [] },
    
    async init() {
        try {
            const res = await fetch('./course.json');
            this.data = await res.json();
            this.updateUI();
        } catch (e) {
            Swal.fire('Lỗi', 'Không tải được dữ liệu bài học', 'error');
        }
    },
    
    complete(id) {
        if (!this.user.completed.includes(id)) {
            this.user.completed.push(id);
            this.user.streak++;
            localStorage.setItem('nf_user', JSON.stringify(this.user));
            this.updateUI();
        }
    },
    
    updateUI() {
        const streakEl = document.getElementById('streak-display');
        if(streakEl) streakEl.innerText = this.user.streak;
    }
};

// --- 2. XỬ LÝ ÂM THANH & AI (AUDIO ENGINE) ---
const AudioEngine = {
    recognition: null,
    speaking: false,

    init(callback) {
        if (!('webkitSpeechRecognition' in window)) {
            Swal.fire('Thiết bị không hỗ trợ', 'Vui lòng dùng Chrome trên Android/PC', 'warning');
            return;
        }
        const rec = new webkitSpeechRecognition();
        rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = false;
        rec.onresult = (e) => callback(e.results[0][0].transcript);
        rec.onend = () => document.getElementById('mic-btn')?.classList.remove('mic-active');
        this.recognition = rec;
    },

    listen() {
        try {
            this.recognition.start();
            document.getElementById('mic-btn').classList.add('mic-active');
        } catch(e) {}
    },

    stop() {
        try {
            this.recognition.stop();
            document.getElementById('mic-btn').classList.remove('mic-active');
        } catch(e) {}
    },

    speak(text) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; u.rate = 0.9;
        window.speechSynthesis.speak(u);
    }
};

// --- 3. ĐIỀU HƯỚNG & GIAO DIỆN (VIEW CONTROLLER) ---
const App = {
    currentLesson: null,
    step: 0,

    async start() {
        await Store.init();
        this.router('home');
    },

    router(page, param = null) {
        const main = document.getElementById('main-view');
        const header = document.getElementById('app-header');
        const nav = document.getElementById('bottom-nav');

        if (page === 'home') {
            header.classList.remove('hidden');
            nav.classList.remove('hidden');
            this.renderHome(main);
        } else if (page === 'practice') {
            header.classList.add('hidden');
            nav.classList.add('hidden');
            this.renderPractice(main, param);
        }
    },

    renderHome(container) {
        let html = `<div class="px-5 py-4 text-xs font-bold text-gray-400 tracking-widest uppercase">Lộ trình học tập</div>`;
        
        Store.data.forEach(l => {
            const isDone = Store.user.completed.includes(l.id);
            const statusColor = isDone ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-gray-300 border-gray-100';
            const icon = isDone ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-lock-open"></i>';

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
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm ${statusColor}">
                    ${icon}
                </div>
            </div>`;
        });
        
        // Spacer bottom
        html += `<div class="h-10"></div>`;
        container.innerHTML = html;
    },

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
                title: 'Xuất sắc!',
                text: 'Bạn đã hoàn thành bài học này.',
                icon: 'success',
                confirmButtonText: 'Về trang chủ',
                confirmButtonColor: '#58CC02'
            }).then(() => this.router('home'));
            return;
        }

        const line = dialog[this.step];
        const stream = document.getElementById('chat-stream');

        if (line.role === 'teacher') {
            // Render Teacher Bubble
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
            // Setup User Turn
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
            if(d[0] === 0) return `<span class="text-green-400 font-bold">${d[1]}</span>`;
            if(d[0] === 1) return `<span class="text-red-300 font-bold line-through decoration-2">${d[1]}</span>`;
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

// Global Access & Start
window.App = App;
window.AudioEngine = AudioEngine;
App.start();
