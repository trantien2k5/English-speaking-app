// --- 1. STORE (DATA & BACKUP) ---
const Store = {
    rawData: [], lessons: [], categories: {},
    user: JSON.parse(localStorage.getItem('nf_user_final')) || { name: '', goal: 'All', streak: 0, completed: [] },
    
    async init() {
        try {
            const res = await fetch('./course.json');
            const json = await res.json();
            this.rawData = json.lessons;
            this.categories = json.metadata.categories;
            this.filterLessons();
        } catch (e) { Swal.fire('Lỗi', 'Cần chạy Live Server!', 'error'); }
    },

    filterLessons() {
        this.lessons = this.user.goal === 'All' ? this.rawData : this.rawData.filter(l => l.category === this.user.goal);
    },
    
    save() { localStorage.setItem('nf_user_final', JSON.stringify(this.user)); },

    setUserGoal(name, goal) {
        this.user.name = name; this.user.goal = goal; this.save();
        this.filterLessons(); App.router('home');
    },

    complete(id) {
        if (!this.user.completed.includes(id)) {
            this.user.completed.push(id); this.user.streak++; this.save();
        }
    },

    // BACKUP FUNCTION
    exportData() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.user));
        const dl = document.createElement('a');
        dl.setAttribute("href", dataStr);
        dl.setAttribute("download", `NativeFlow_Backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(dl); dl.click(); dl.remove();
    },

    importData(event) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if(data.streak !== undefined) {
                    this.user = data; this.save();
                    Swal.fire('Xong', 'Đã khôi phục dữ liệu!', 'success').then(() => location.reload());
                }
            } catch(ex) { Swal.fire('Lỗi', 'File không hợp lệ', 'error'); }
        };
        reader.readAsText(event.target.files[0]);
    }
};

// --- 2. AUDIO ENGINE ---
const AudioEngine = {
    recognition: null,
    init(callback) {
        if (!('webkitSpeechRecognition' in window)) return;
        const rec = new webkitSpeechRecognition();
        rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = false;
        rec.onresult = (e) => callback(e.results[0][0].transcript);
        rec.onend = () => document.getElementById('mic-btn')?.classList.remove('listening');
        this.recognition = rec;
    },
    listen() { try{this.recognition.start(); document.getElementById('mic-btn').classList.add('listening');}catch(e){} },
    stop() { try{this.recognition.stop();}catch(e){} },
    speak(text) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; u.rate = 0.9;
        window.speechSynthesis.speak(u);
    }
};

// --- 3. APP CONTROLLER ---
const App = {
    currentLesson: null, step: 0,

    async start() {
        await Store.init();
        if (!Store.user.name) this.router('onboarding');
        else this.router('home');
    },

    router(page, param = null) {
        const main = document.getElementById('main-view');
        const header = document.getElementById('app-header');
        const nav = document.getElementById('bottom-nav');

        header.classList.add('hidden'); nav.classList.add('hidden');
        document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('text-primary'));

        if (page === 'onboarding') this.renderOnboarding(main);
        else if (page === 'home') {
            header.classList.remove('hidden'); nav.classList.remove('hidden');
            document.querySelector('button[onclick="App.router(\'home\')"]').classList.add('text-primary');
            document.getElementById('streak-display').innerText = Store.user.streak;
            this.renderHome(main);
        }
        else if (page === 'practice') this.renderPractice(main, param);
        else if (page === 'profile') {
            nav.classList.remove('hidden');
            document.querySelector('button[onclick="App.router(\'profile\')"]').classList.add('text-primary');
            this.renderProfile(main);
        }
        else if (page === 'stats') {
             nav.classList.remove('hidden');
             document.querySelector('button[onclick="App.router(\'stats\')"]').classList.add('text-primary');
             this.renderStats(main);
        }
    },

    renderOnboarding(container) {
        let options = `<option value="All">Tổng hợp</option>`;
        for (const [k, v] of Object.entries(Store.categories)) options += `<option value="${k}">${v}</option>`;
        container.innerHTML = `
            <div class="h-full flex flex-col justify-center px-6 bg-white">
                <div class="text-center mb-8"><h1 class="text-3xl font-extrabold text-primary mb-2">NativeFlow</h1><p class="text-gray-500">Học tiếng Anh chuẩn bản xứ.</p></div>
                <div class="space-y-4">
                    <input id="inp-name" type="text" placeholder="Tên của bạn" class="w-full p-4 bg-gray-50 rounded-xl border-2 border-gray-100 font-bold">
                    <select id="inp-goal" class="w-full p-4 bg-gray-50 rounded-xl border-2 border-gray-100 font-bold text-gray-700">${options}</select>
                    <button onclick="App.handleOnboarding()" class="w-full bg-primary text-white font-bold text-lg p-4 rounded-xl mt-4 shadow-lg active:scale-95 transition-transform">Bắt đầu ngay</button>
                </div>
            </div>`;
    },

    handleOnboarding() {
        const name = document.getElementById('inp-name').value;
        const goal = document.getElementById('inp-goal').value;
        if(!name) return Swal.fire('Khoan!', 'Nhập tên đã sếp ơi', 'warning');
        Store.setUserGoal(name, goal);
    },

    renderHome(container) {
        let html = `<div class="p-5 space-y-4 pb-20"><h2 class="text-xl font-extrabold text-gray-800 mb-4">Lộ trình: ${Store.categories[Store.user.goal] || 'Tổng hợp'}</h2>`;
        Store.lessons.forEach((l, idx) => {
            const isDone = Store.user.completed.includes(l.id);
            const isLocked = idx > 0 && !Store.user.completed.includes(Store.lessons[idx-1].id);
            let css = isDone ? "bg-primary border-primary text-white" : (isLocked ? "bg-gray-100 text-gray-300" : "bg-white border-primary text-primary shadow-lg");
            let icon = isDone ? '<i class="fa-solid fa-check"></i>' : (isLocked ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-play"></i>');
            html += `
            <div onclick="${isLocked?'':`App.router('practice','${l.id}')`}" class="flex items-center gap-4 cursor-pointer group ${isLocked?'opacity-50':''}">
                <div class="w-16 h-16 rounded-full border-4 flex items-center justify-center transition-transform group-hover:scale-110 z-10 ${css}">${icon}</div>
                <div class="flex-1 bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm"><div class="font-extrabold text-gray-800">${l.title}</div><div class="text-xs text-gray-500 mt-1">${l.desc}</div></div>
            </div>`;
        });
        container.innerHTML = html + `</div>`;
    },

    renderPractice(container, id) {
        this.currentLesson = Store.rawData.find(l => l.id === id); this.step = 0;
        container.innerHTML = `
            <div class="sticky top-0 bg-white/95 backdrop-blur-md p-4 flex items-center justify-between border-b border-gray-100 z-20">
                <button onclick="App.router('home')" class="text-gray-400"><i class="fa-solid fa-xmark text-xl"></i></button>
                <div class="w-full bg-gray-200 h-3 rounded-full mx-4 overflow-hidden"><div id="progress-bar" class="bg-primary h-full w-0 transition-all duration-500"></div></div>
                <div class="w-5"></div>
            </div>
            <div id="chat-stream" class="p-5 flex flex-col gap-4 pb-48"></div>
            <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 pb-8 z-50 flex flex-col items-center">
                <div class="text-center mb-4 w-full"><div id="target-text" class="text-xl font-bold text-gray-800 mb-2">...</div><div id="phonetic" class="font-mono text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full inline-block">...</div></div>
                <button id="mic-btn" onclick="App.toggleMic()" class="w-20 h-20 rounded-full bg-primary text-white text-3xl flex items-center justify-center shadow-lg transition-all"><i class="fa-solid fa-microphone"></i></button>
            </div>`;
        AudioEngine.init((text) => this.handleVoice(text));
        this.nextStep();
    },

    nextStep() {
        const lesson = this.currentLesson;
        document.getElementById('progress-bar').style.width = `${(this.step / lesson.dialogue.length) * 100}%`;
        if (this.step >= lesson.dialogue.length) {
            Store.complete(lesson.id);
            Swal.fire({ title: 'Hoàn thành!', icon: 'success', confirmButtonColor: '#58CC02' }).then(() => App.router('home'));
            return;
        }
        const line = lesson.dialogue[this.step];
        const stream = document.getElementById('chat-stream');
        if (line.role === 'teacher') {
            stream.insertAdjacentHTML('beforeend', `<div class="flex items-end gap-3 bubble-pop"><img src="https://cdn-icons-png.flaticon.com/512/3406/3406987.png" class="w-8 h-8 rounded-full bg-gray-100"><div class="bg-gray-100 p-3 rounded-2xl rounded-bl-none text-gray-700">${line.content}</div></div>`);
            stream.scrollTop = stream.scrollHeight;
            AudioEngine.speak(line.content);
            setTimeout(() => { this.step++; this.nextStep(); }, Math.max(1500, line.content.length * 60));
        } else {
            document.getElementById('target-text').innerText = line.target;
            document.getElementById('phonetic').innerText = line.phonetic;
        }
    },

    toggleMic() {
        const btn = document.getElementById('mic-btn');
        if (btn.classList.contains('listening')) AudioEngine.stop();
        else AudioEngine.listen();
    },

    handleVoice(userText) {
        AudioEngine.stop();
        const target = this.currentLesson.dialogue[this.step].target;
        const targetClean = target.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
        const userClean = userText.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
        // @ts-ignore
        const dmp = new diff_match_patch();
        const diffs = dmp.diff_main(targetClean, userClean); dmp.diff_cleanupSemantic(diffs);
        let correctChars = 0;
        let htmlDiff = diffs.map(d => {
            if(d[0]===0) { correctChars += d[1].length; return `<span class="text-green-500 font-bold">${d[1]}</span>`; }
            if(d[0]===1) return `<span class="text-red-400 line-through decoration-2 opacity-60 mx-1">${d[1]}</span>`;
            return `<span class="text-gray-400 border-b-2 border-red-300 mx-1">${d[1]}</span>`;
        }).join('');
        
        document.getElementById('chat-stream').insertAdjacentHTML('beforeend', `<div class="flex items-end gap-3 flex-row-reverse bubble-pop"><div class="max-w-[85%] bg-white border-2 border-primary/30 text-gray-800 p-3.5 rounded-2xl rounded-br-none shadow-sm leading-relaxed">${htmlDiff}</div></div>`);
        document.getElementById('chat-stream').scrollTop = 9999;

        if ((correctChars/targetClean.length)*100 > 85) {
            new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3').play().catch(()=>{});
            setTimeout(() => { this.step++; this.nextStep(); }, 1000);
        } else {
            const hint = document.getElementById('target-text');
            hint.innerHTML = `<div class="text-red-500 font-bold animate-pulse">Chưa chuẩn!</div>`;
            setTimeout(() => { hint.innerText = target; }, 1500);
        }
    },

    renderProfile(container) {
        container.innerHTML = `
            <div class="p-6 flex flex-col items-center pb-24">
                <div class="w-24 h-24 rounded-full border-4 border-primary p-1 mb-4"><img src="https://ui-avatars.com/api/?name=${Store.user.name}&background=random" class="w-full h-full rounded-full object-cover"></div>
                <h2 class="text-2xl font-extrabold text-gray-800 mb-8">${Store.user.name}</h2>
                <div class="w-full bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                    <h3 class="font-bold text-blue-600 mb-2">Sao lưu dữ liệu</h3>
                    <div class="flex gap-2">
                        <button onclick="Store.exportData()" class="flex-1 bg-white text-blue-600 font-bold py-2 rounded-lg border border-blue-200">Lưu về máy</button>
                        <label class="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg flex items-center justify-center cursor-pointer">Khôi phục<input type="file" class="hidden" onchange="Store.importData(event)" accept=".json"></label>
                    </div>
                </div>
                <button onclick="localStorage.removeItem('nf_user_final'); location.reload()" class="w-full bg-white border-2 border-red-100 p-4 rounded-xl font-bold text-red-500">Đăng xuất / Reset</button>
            </div>`;
    },

    renderStats(container) {
        container.innerHTML = `<div class="p-6 text-center pt-20 text-gray-400">Tính năng thống kê đang cập nhật...</div>`;
    }
};

window.App = App;
App.start();