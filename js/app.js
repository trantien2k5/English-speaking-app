import { LessonsDB } from './data.js';
import { StorageService, SpeechEngine } from './services.js';
import { Router } from './router.js';

class App {
    constructor() {
        this.currentLesson = null;
        this.step = 0;
        this.isMicOn = false;
        this.init();
    }

    init() {
        // --- VIEW: HOME ---
        Router.register('home', () => {
            const userData = StorageService.getData();
            let listHtml = '';
            
            Object.values(LessonsDB).forEach(l => {
                const isDone = userData.completed.includes(l.id);
                const statusClass = isDone ? 'done' : '';
                const iconCheck = isDone ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-chevron-right" style="color:#ddd"></i>';
                
                listHtml += `
                    <div class="lesson-card ${statusClass}" onclick="window.startLesson(${l.id})">
                        <div class="icon-box"><i class="fa-solid fa-book-open"></i></div>
                        <div style="flex:1">
                            <div style="font-weight:800; margin-bottom:4px">${l.title}</div>
                            <div style="font-size:0.85rem; color:#888">${l.desc}</div>
                        </div>
                        <div style="width:24px; height:24px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:${isDone?'#58CC02':'#eee'}; color:white">
                            ${iconCheck}
                        </div>
                    </div>`;
            });

            return `
                <div class="app-header">
                    <div class="user-info">
                        <div class="avatar-circle"><img src="https://ui-avatars.com/api/?name=St&background=random" alt="User"></div>
                        <div><div style="font-size:0.75rem; color:#888; font-weight:700">WELCOME</div><div style="font-weight:800">Student</div></div>
                    </div>
                    <div class="streak-badge"><i class="fa-solid fa-fire"></i> ${userData.streak}</div>
                </div>
                <div class="section-label">Lộ trình học tập</div>
                ${listHtml}
                <div style="height:20px"></div>
            `;
        });

        // --- VIEW: PRACTICE ---
        Router.register('practice', (id) => `
            <div class="app-header">
                <i class="fa-solid fa-arrow-left" onclick="window.goHome()" style="font-size:1.4rem; color:#888; cursor:pointer"></i>
                <span style="font-weight:800; font-size:1.1rem">${LessonsDB[id].title}</span>
                <div style="width:20px"></div>
            </div>
            
            <div id="chat-box" class="chat-stream"></div>

            <div class="action-container">
                <div class="hint-box">
                    <div id="target-text" class="hint-en">Listening...</div>
                    <div id="phonetic" class="hint-ipa">...</div>
                </div>
                <div id="mic" class="mic-btn-big" onclick="window.toggleMic()">
                    <i class="fa-solid fa-microphone"></i>
                </div>
            </div>
        `);

        // SETUP EVENTS
        window.addEventListener('routeChanged', (e) => {
            if(e.detail.name === 'practice') this.startPractice(e.detail.param);
        });

        // GLOBAL BINDING
        window.goHome = () => Router.navigate('home');
        window.startLesson = (id) => Router.navigate('practice', id);
        window.toggleMic = () => this.toggleMicHandler();
        
        Router.navigate('home');
    }

    startPractice(id) {
        this.currentLesson = LessonsDB[id];
        this.step = 0;
        SpeechEngine.init((text) => this.handleVoice(text));
        this.nextStep();
    }

    nextStep() {
        const dialog = this.currentLesson.dialogue;
        if(this.step >= dialog.length) {
            StorageService.markComplete(this.currentLesson.id);
            this.renderBubble("🎉 Hoàn thành bài học!", "system");
            const audio = new Audio('https://www.soundjay.com/human/sounds/applause-01.mp3'); audio.play().catch(()=>{});
            setTimeout(() => window.goHome(), 2500);
            return;
        }

        const line = dialog[this.step];
        if(line.role === 'teacher') {
            this.renderBubble(line.content, 'teacher');
            SpeechEngine.speak(line.content);
            setTimeout(() => { this.step++; this.nextStep(); }, Math.max(2000, line.content.length * 60));
        } else {
            document.getElementById('target-text').innerText = line.target;
            document.getElementById('phonetic').innerText = line.phonetic;
        }
    }

    toggleMicHandler() {
        if(this.isMicOn) {
            SpeechEngine.stop();
            this.isMicOn = false;
            document.getElementById('mic').classList.remove('listening');
        } else {
            SpeechEngine.start();
            this.isMicOn = true;
            document.getElementById('mic').classList.add('listening');
        }
    }

    handleVoice(text) {
        this.toggleMicHandler();
        const target = this.currentLesson.dialogue[this.step].target;
        const res = SpeechEngine.compare(text, target);

        let html = "";
        res.diffs.forEach(part => {
            if(part[0]===0) html += `<span class="word-correct">${part[1]}</span>`;
            else if(part[0]===1) html += `<span class="word-wrong">${part[1]}</span>`;
        });
        this.renderBubble(html, 'user');

        if(res.score > 60) {
            const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3'); audio.play().catch(()=>{});
            setTimeout(() => { this.step++; this.nextStep(); }, 1000);
        } else {
            this.renderBubble("Thử lại nhé!", "system");
        }
    }

    renderBubble(content, type) {
        const stream = document.getElementById('chat-box');
        const div = document.createElement('div');
        div.className = 'bubble-row';
        
        const avatarTeacher = 'https://cdn-icons-png.flaticon.com/512/3406/3406987.png';
        const avatarStudent = 'https://cdn-icons-png.flaticon.com/512/924/924915.png';

        let htmlContent = content;
        if(type === 'teacher') {
            // Tách từ để bấm nghe
            htmlContent = content.split(' ').map(w => 
                `<span onclick="window.speakWord('${w.replace(/'/g,"\\'")}')" style="cursor:pointer;border-bottom:1px dotted #ccc">${w}</span>`
            ).join(' ');
        }

        div.innerHTML = `
            ${type === 'teacher' ? `<div class="avatar-small"><img src="${avatarTeacher}"></div>` : ''}
            <div class="bubble ${type}">${htmlContent}</div>
            ${type === 'user' ? `<div class="avatar-small"><img src="${avatarStudent}"></div>` : ''}
        `;
        stream.appendChild(div);
        stream.scrollTop = stream.scrollHeight;
    }
}

// --- GLOBAL HELPER ---
window.speakWord = (word) => {
    const u = new SpeechSynthesisUtterance(word.replace(/[.,?!]/g, ""));
    u.lang = 'en-US'; u.rate = 0.8;
    window.speechSynthesis.speak(u);
};

// KHỞI CHẠY APP
new App();