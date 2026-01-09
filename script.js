// ==========================================
// 1. DỮ LIỆU MẪU (Giả lập Server)
// ==========================================
const DATABASE = {
    user: { name: "Alex Nguyen", xp: 1250, streak: 12, level: "B1 Intermediate" },
    topics: [
        { id: 't1', title: 'Coffee Talk', desc: 'Ordering & Small talk', icon: '☕', color: '#FAB1A0' },
        { id: 't2', title: 'Business Meeting', desc: 'Expressing opinions', icon: '💼', color: '#74B9FF' },
        { id: 't3', title: 'Job Interview', desc: 'Strengths & Weaknesses', icon: '🤝', color: '#A29BFE' },
        { id: 't4', title: 'Travel & Hotel', desc: 'Check-in, issues', icon: '✈️', color: '#55E6C1' }
    ],
    scenarios: {
        't1': {
            prompt: "Barista asks: 'What can I get for you today?'",
            ai_opening: "Hi! Welcome to The Coffee House. What can I get for you today?",
            suggestion: "I'd like a Cappuccino with less sugar, please."
        }
    }
};

// ==========================================
// 2. APP LOGIC
// ==========================================
class App {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.renderHome(); // Khởi động vào màn hình Home
        this.initSpeech();
    }

    // --- NAVIGATION ---
    navigate(screen) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        // Logic highlight button (bỏ qua bước này để code gọn)
        
        if(screen === 'home') this.renderHome();
        else if(screen === 'topics') this.renderTopics();
        else if(screen === 'stats') this.renderStats(); // Màn hình thống kê giả
        else if(screen === 'profile') this.renderProfile();
    }

    // --- RENDERING SCREENS ---

    renderHome() {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div class="hero-banner">
                <h2>Daily Goal: Speaking</h2>
                <p>Bạn đã hoàn thành 2/5 bài tập hôm nay.</p>
                <div style="width:100%; height:6px; background:rgba(255,255,255,0.3); border-radius:4px; margin-bottom:15px;">
                    <div style="width:40%; height:100%; background:#fff; border-radius:4px;"></div>
                </div>
                <button class="hero-btn" onclick="app.quickPractice()">Continue <i class="fas fa-arrow-right"></i></button>
            </div>

            <div class="stat-card-row">
                <div class="stat-card">
                    <h4>Total XP</h4>
                    <span class="value" style="color:var(--primary)">1,250</span>
                    <i class="fas fa-bolt stat-icon"></i>
                </div>
                <div class="stat-card">
                    <h4>Hours</h4>
                    <span class="value" style="color:var(--accent)">14.5</span>
                    <i class="fas fa-clock stat-icon"></i>
                </div>
            </div>

            <div class="section-title">
                <span>Recommended for you</span>
                <span class="link-btn" onclick="app.navigate('topics')">View All</span>
            </div>
            <div id="home-topics-list"></div>
        `;

        const list = document.getElementById('home-topics-list');
        DATABASE.topics.slice(0, 3).forEach(t => {
            list.innerHTML += this.createTopicItem(t);
        });
    }

    renderTopics() {
        const content = document.getElementById('app-content');
        content.innerHTML = `<h3 style="margin-bottom:20px">Library</h3>`;
        DATABASE.topics.forEach(t => {
            content.innerHTML += this.createTopicItem(t);
        });
    }
    
    // Màn hình thống kê giả lập (Profile Chart)
    renderStats() {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <h3>Your Performance</h3>
            <div class="stat-card" style="height: 200px; justify-content:flex-end; display:flex; gap:10px; align-items:flex-end; padding-bottom:0;">
                <div style="flex:1; background:#dfe6e9; height:40%; border-radius:8px 8px 0 0;"></div>
                <div style="flex:1; background:#dfe6e9; height:60%; border-radius:8px 8px 0 0;"></div>
                <div style="flex:1; background:var(--primary); height:80%; border-radius:8px 8px 0 0; position:relative;">
                    <span style="position:absolute; top:-25px; left:50%; transform:translateX(-50%); font-weight:bold; font-size:0.8rem;">Today</span>
                </div>
                <div style="flex:1; background:#dfe6e9; height:50%; border-radius:8px 8px 0 0;"></div>
                <div style="flex:1; background:#dfe6e9; height:70%; border-radius:8px 8px 0 0;"></div>
            </div>
            <p style="text-align:center; color:var(--text-sub); font-size:0.9rem; margin-top:10px;">Speaking Activity (Last 5 Days)</p>
        `;
    }

    createTopicItem(t) {
        return `
            <div class="topic-item" onclick="app.startTopic('${t.id}')">
                <div class="topic-icon" style="background:${t.color}20; color:${t.color}">${t.icon}</div>
                <div style="flex:1">
                    <h4 style="margin:0; font-size:1rem; color:var(--text-main)">${t.title}</h4>
                    <span style="font-size:0.85rem; color:var(--text-sub)">${t.desc}</span>
                </div>
                <i class="fas fa-chevron-right" style="color:#dfe6e9"></i>
            </div>
        `;
    }

    // --- PRACTICE LOGIC ---

    quickPractice() {
        this.startTopic('t1');
    }

    startTopic(id) {
        const scenario = DATABASE.scenarios['t1']; // Demo lấy cứng t1
        const overlay = document.getElementById('practice-overlay');
        overlay.classList.remove('hidden');
        
        const container = document.getElementById('practice-container');
        container.innerHTML = `
            <div class="chat-msg ai">
                <strong><i class="fas fa-robot"></i> AI Coach</strong><br>
                ${scenario.ai_opening}
            </div>
        `;
        
        this.currentScenario = scenario;
    }

    closePractice() {
        document.getElementById('practice-overlay').classList.add('hidden');
        if(this.isRecording) this.toggleMic();
    }

    // --- VOICE & FEEDBACK ---

    initSpeech() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'en-US';
            this.recognition.continuous = false;
            
            this.recognition.onstart = () => {
                this.isRecording = true;
                document.getElementById('mic-trigger').classList.add('listening');
                document.getElementById('live-transcript').innerText = "Listening...";
            };
            
            this.recognition.onend = () => {
                this.isRecording = false;
                document.getElementById('mic-trigger').classList.remove('listening');
            };

            this.recognition.onresult = (e) => {
                const text = e.results[0][0].transcript;
                this.processInput(text);
            };
        }
    }

    toggleMic() {
        if(this.isRecording) this.recognition.stop();
        else this.recognition.start();
    }

    processInput(text) {
        const container = document.getElementById('practice-container');
        
        // 1. Show user text
        container.innerHTML += `
            <div class="chat-msg user">
                ${text}
            </div>
        `;

        // 2. Simulate AI Analysis (Fake Loading)
        document.getElementById('live-transcript').innerText = "Analyzing...";
        
        setTimeout(() => {
            // Generate Random Scores 
            const fluency = Math.floor(Math.random() * (95 - 70) + 70);
            const accuracy = Math.floor(Math.random() * (98 - 80) + 80);
            
            container.innerHTML += `
                <div style="background:#fff; padding:20px; border-radius:20px; box-shadow:0 10px 30px rgba(0,0,0,0.1); margin-top:10px; border:1px solid #eee;">
                    <h4 style="margin:0 0 15px 0; color:var(--text-main)">Session Analysis</h4>
                    
                    ${this.createScoreBar('Fluency', fluency, '#00CEC9')}
                    ${this.createScoreBar('Pronunciation', accuracy, '#6C5CE7')}
                    ${this.createScoreBar('Grammar', 90, '#FD79A8')}
                    
                    <div style="margin-top:15px; padding:10px; background:#F8F9FA; border-radius:12px; font-size:0.9rem;">
                        <strong>Native Suggestion:</strong><br>
                        <span style="color:var(--primary)">"${this.currentScenario.suggestion}"</span>
                    </div>
                </div>
            `;
            
            // Auto scroll to bottom
            container.scrollTop = container.scrollHeight;
            document.getElementById('live-transcript').innerText = "Tap mic to try again";
            
            // Trigger animation for bars
            setTimeout(() => {
                document.querySelectorAll('.progress-fill').forEach(bar => {
                    bar.style.width = bar.getAttribute('data-width');
                });
            }, 100);

        }, 1000);
    }

    createScoreBar(label, score, color) {
        return `
            <div class="score-row">
                <div class="score-label"><span>${label}</span><span>${score}%</span></div>
                <div class="progress-track">
                    <div class="progress-fill" data-width="${score}%" style="background:${color}; width:0%"></div>
                </div>
            </div>
        `;
    }
}

const app = new App();