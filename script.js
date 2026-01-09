// ==========================================
// 1. DATABASE (BẠN CHỈ CẦN COPY-PASTE VÀO ĐÂY)
// ==========================================
const DATABASE = {
    // Chủ đề luyện nói (Situational)
    topics: [
        {
            id: 't1',
            title: 'Coffee Shop',
            icon: '☕',
            color: '#e0f2fe',
            desc: 'Ordering, customizing drink',
            scenarios: [
                {
                    id: 's1',
                    prompt: "Bạn muốn gọi một ly Latte ít đường đá. Nhân viên hỏi: 'What can I get for you?'",
                    ai_role: "Barista",
                    keywords: ["latte", "sugar", "ice", "less"],
                    native_suggestion: "Can I get an iced Latte with less sugar, please?"
                }
            ]
        },
        {
            id: 't2',
            title: 'Job Interview',
            icon: '💼',
            color: '#fef3c7',
            desc: 'Self introduction, strengths',
            scenarios: [
                {
                    id: 's2',
                    prompt: "Tell me a little about yourself.",
                    ai_role: "Interviewer",
                    keywords: ["experience", "background", "passionate", "years"],
                    native_suggestion: "Well, I've been working as a dev for 2 years and I'm really passionate about AI."
                }
            ]
        },
        {
            id: 't3',
            title: 'Daily Chat',
            icon: '🗣️',
            color: '#dcfce7',
            desc: 'Small talk, weather, hobbies',
            scenarios: [
                {
                    id: 's3',
                    prompt: "Hey, long time no see! How have you been?",
                    ai_role: "Friend",
                    keywords: ["good", "great", "busy", "you"],
                    native_suggestion: "Pretty good! Just been busy with work. How about you?"
                }
            ]
        }
    ],

    // Bài luyện nghe / Shadowing (Youtube)
    shadowing: [
        {
            id: 'v1',
            title: 'Học cách dùng "Gonna" & "Wanna"',
            youtubeId: '7K4fTPlX5a0', // ID video youtube
            desc: 'Native Pronunciation'
        },
        {
            id: 'v2',
            title: 'Daily Routine Vocabulary',
            youtubeId: 'qD1pnquN_DM',
            desc: 'Vocabulary Builder'
        }
    ]
};

// ==========================================
// 2. APP LOGIC (KHÔNG CẦN SỬA)
// ==========================================

class NativeApp {
    constructor() {
        this.currentTab = 'home';
        this.recognition = null;
        this.isRecording = false;
        this.initSpeech();
        this.renderHome(); // Mặc định vào home
    }

    // --- NAVIGATION ---
    navigate(tabId) {
        // Active visual state
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        event.currentTarget.classList.add('active');
        
        this.currentTab = tabId;
        const container = document.getElementById('app-container');
        container.innerHTML = ''; // Clear content

        if (tabId === 'home') this.renderHome();
        else if (tabId === 'topics') this.renderTopics();
        else if (tabId === 'shadowing') this.renderShadowing();
        else if (tabId === 'profile') this.renderProfile();
    }

    // --- RENDERERS (Tạo giao diện từ JSON) ---
    
    renderHome() {
        const container = document.getElementById('app-container');
        // Hero Section
        container.innerHTML = `
            <div class="hero-card">
                <h2>Reflex Training</h2>
                <p>Luyện phản xạ nhanh trong 5s. Bạn đã sẵn sàng?</p>
                <button class="hero-btn" onclick="app.startRandomPractice()">Start Now <i class="fas fa-play"></i></button>
            </div>
            <h3 class="section-title">Recommended Topics</h3>
            <div class="card-grid" id="home-topics"></div>
        `;
        
        // Render 2 topics đầu tiên ra Home
        const grid = document.getElementById('home-topics');
        DATABASE.topics.slice(0, 4).forEach(topic => {
            grid.innerHTML += this.createTopicCard(topic);
        });
    }

    renderTopics() {
        const container = document.getElementById('app-container');
        container.innerHTML = `<h3 class="section-title">All Topics</h3><div class="card-grid" id="all-topics"></div>`;
        const grid = document.getElementById('all-topics');
        DATABASE.topics.forEach(topic => {
            grid.innerHTML += this.createTopicCard(topic);
        });
    }

    createTopicCard(topic) {
        // Chuyển object topic thành chuỗi JSON an toàn để truyền vào hàm onclick
        const topicString = encodeURIComponent(JSON.stringify(topic));
        return `
            <div class="topic-card" onclick="app.openTopicDetail('${topicString}')">
                <div class="topic-icon" style="background: ${topic.color}">${topic.icon}</div>
                <div>
                    <h4 class="topic-title">${topic.title}</h4>
                    <span class="topic-meta">${topic.desc}</span>
                </div>
            </div>
        `;
    }

    renderShadowing() {
        const container = document.getElementById('app-container');
        let html = `<h3 class="section-title">Shadowing Practice</h3>`;
        DATABASE.shadowing.forEach(video => {
            html += `
                <div class="topic-card" style="margin-bottom: 15px; display: block;">
                    <div class="video-responsive">
                        <iframe src="https://www.youtube.com/embed/${video.youtubeId}" allowfullscreen></iframe>
                    </div>
                    <h4 class="topic-title" style="margin-top:10px">${video.title}</h4>
                    <span class="topic-meta">${video.desc}</span>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    renderProfile() {
        document.getElementById('app-container').innerHTML = `
            <h3 class="section-title">Your Progress</h3>
            <div class="topic-card" style="display:block; text-align:center; padding: 30px;">
                <i class="fas fa-trophy" style="font-size: 3rem; color: #f59e0b; margin-bottom: 10px;"></i>
                <h2>Level 2</h2>
                <p>Bạn đã luyện tập <strong>12</strong> bài nói tuần này.</p>
                <p style="color:var(--text-light); font-size:0.9rem">Mục tiêu: Giao tiếp tự nhiên (Native-like)</p>
            </div>
        `;
    }

    // --- PRACTICE LOGIC (Mở Modal & Xử lý nói) ---

    openTopicDetail(topicString) {
        const topic = JSON.parse(decodeURIComponent(topicString));
        // Lấy scenario đầu tiên để test (Sau này có thể làm list scenario)
        const scenario = topic.scenarios[0];
        this.startPractice(scenario, topic.title);
    }

    startRandomPractice() {
        // Lấy ngẫu nhiên 1 scenario
        const randomTopic = DATABASE.topics[Math.floor(Math.random() * DATABASE.topics.length)];
        const randomScenario = randomTopic.scenarios[0];
        this.startPractice(randomScenario, "Reflex Mode");
    }

    startPractice(scenario, title) {
        this.currentScenario = scenario;
        const modal = document.getElementById('practice-modal');
        document.getElementById('modal-title').innerText = title;
        
        const content = document.getElementById('modal-content');
        content.innerHTML = `
            <div class="chat-bubble ai">
                <strong><i class="fas fa-robot"></i> AI (${scenario.ai_role}):</strong><br>
                ${scenario.prompt}
            </div>
            
            <div id="user-response-area" style="width:100%; display:none;">
                <div class="chat-bubble" style="background:#e0f2fe; margin-left:auto; align-self:flex-end;">
                    <strong>You:</strong> <span id="user-transcript">...</span>
                </div>
                
                <div id="feedback-area" style="margin-top:20px; background:#fff; padding:15px; border-radius:12px; box-shadow:var(--shadow);">
                    <h5 style="margin:0 0 5px 0; color:var(--primary)">Native Suggestion:</h5>
                    <p style="margin:0;">${scenario.native_suggestion}</p>
                </div>
            </div>

            <div class="mic-wrapper" id="mic-btn" onclick="app.toggleMic()">
                <i class="fas fa-microphone"></i>
            </div>
            <p style="color:#aaa; font-size:0.8rem">Tap mic to speak</p>
        `;

        modal.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('practice-modal').classList.add('hidden');
        if (this.isRecording) this.stopListening();
    }

    // --- VOICE LOGIC (Web Speech API) ---

    initSpeech() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'en-US';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;

            this.recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                
                // Hiển thị text đang nói thời gian thực
                const userTranscript = document.getElementById('user-transcript');
                if (userTranscript) userTranscript.innerText = transcript;
            };

            this.recognition.onend = () => {
                this.isRecording = false;
                document.getElementById('mic-btn').classList.remove('listening');
                this.analyzeResult(document.getElementById('user-transcript').innerText);
            };
        } else {
            alert("Trình duyệt không hỗ trợ Voice. Hãy dùng Chrome trên Android/PC.");
        }
    }

    toggleMic() {
        if (this.isRecording) this.stopListening();
        else this.startListening();
    }

    startListening() {
        if(!this.recognition) return;
        this.isRecording = true;
        document.getElementById('mic-btn').classList.add('listening');
        // Show user response area
        document.getElementById('user-response-area').style.display = 'block';
        document.getElementById('user-transcript').innerText = "...";
        document.getElementById('feedback-area').classList.add('hidden'); // Ẩn feedback cũ
        this.recognition.start();
    }

    stopListening() {
        if(this.recognition) this.recognition.stop();
    }

    analyzeResult(text) {
        // Logic giả lập check keyword
        const keywords = this.currentScenario.keywords || [];
        const found = keywords.filter(w => text.toLowerCase().includes(w));
        
        // Hiện feedback sau khi nói xong
        const feedbackArea = document.getElementById('feedback-area');
        feedbackArea.classList.remove('hidden');
        
        // Bạn có thể mở rộng logic chấm điểm ở đây
    }
}

// Khởi chạy App
const app = new NativeApp();