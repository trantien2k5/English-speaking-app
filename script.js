// ==========================================
// 1. DATABASE MOCKUP
// ==========================================
const DATABASE = {
    // Không fix cứng user nữa, user sẽ được load từ localStorage
    defaultUser: { name: "Learner", level: "Beginner", goal: "Fluency", xp: 0, streak: 0 },
    
    topics: [
        { id: 't1', title: 'Coffee Talk', desc: 'Ordering & Small talk', icon: '☕', color: '#FAB1A0' },
        { id: 't2', title: 'Job Interview', desc: 'Strengths & Weaknesses', icon: '💼', color: '#74B9FF' },
        { id: 't3', title: 'Travel & Hotel', desc: 'Check-in, issues', icon: '✈️', color: '#55E6C1' }
    ],
    
    // Giả lập dữ liệu "Gen ngôn ngữ" (Personalized DNA)
    dna: {
        weakSounds: ['/th/', '/r/', 'ending -s'],
        strongSkills: ['Vocabulary', 'Confidence'],
        style: 'Formal (Lịch sự)',
        trend: 'Improving Intonation 📈'
    },

    scenarios: {
        't1': { 
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
        this.user = this.loadUser(); // Load user từ bộ nhớ
        this.tempSetup = { level: 'Beginner', goal: 'Fluency' }; // Biến tạm khi onboarding
        
        this.initApp();
        this.initSpeech();
    }

    // --- USER MANAGEMENT (PERSONALIZATION CORE) ---
    
    loadUser() {
        const saved = localStorage.getItem('nativeflow_user');
        return saved ? JSON.parse(saved) : null;
    }

    saveUser() {
        localStorage.setItem('nativeflow_user', JSON.stringify(this.user));
        this.updateHeaderUI();
    }

    initApp() {
        if (!this.user) {
            // Chưa có user -> Hiện Onboarding
            document.getElementById('onboarding-overlay').classList.remove('hidden');
            // Tạo user tạm để tránh lỗi
            this.user = { ...DATABASE.defaultUser }; 
        } else {
            // Đã có user -> Ẩn onboarding, vào Home
            document.getElementById('onboarding-overlay').classList.add('hidden');
            this.renderHome();
            this.updateHeaderUI();
        }
    }

    updateHeaderUI() {
        document.getElementById('display-name').innerText = this.user.name;
        document.getElementById('streak-count').innerText = this.user.streak;
        // Avatar random theo tên
        document.getElementById('header-avatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.user.name}`;
    }

    // --- ONBOARDING LOGIC ---

    selectLevel(lvl, btn) {
        this.tempSetup.level = lvl;
        // UI Handling
        btn.parentElement.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    }

    selectGoal(goal, btn) {
        this.tempSetup.goal = goal;
        btn.parentElement.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    }

    finishOnboarding() {
        const nameInput = document.getElementById('inp-name').value;
        const finalName = nameInput.trim() || "Learner";
        
        // Lưu thông tin cá nhân hóa
        this.user = {
            name: finalName,
            level: this.tempSetup.level,
            goal: this.tempSetup.goal,
            xp: 0,
            streak: 1, // Tặng 1 ngày streak đầu tiên
            joinDate: new Date().toISOString()
        };
        
        this.saveUser();
        
        // Ẩn màn hình setup
        document.getElementById('onboarding-overlay').classList.add('hidden');
        this.renderHome();
    }

    // --- NAVIGATION ---
    navigate(screen) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        // Highlight logic (bỏ qua cho gọn)
        
        if(screen === 'home') this.renderHome();
        else if(screen === 'topics') this.renderTopics();
        else if(screen === 'stats') this.renderStats();
        else if(screen === 'profile') this.renderProfile();
    }

    // --- SCREENS ---

    renderHome() {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div class="hero-banner">
                <h2>Mục tiêu: ${this.user.goal}</h2>
                <p>Chào ${this.user.name}, bài tập hôm nay dựa trên trình độ <strong>${this.user.level}</strong> của bạn.</p>
                <div style="width:100%; height:6px; background:rgba(255,255,255,0.3); border-radius:4px; margin-bottom:15px;">
                    <div style="width:20%; height:100%; background:#fff; border-radius:4px;"></div>
                </div>
                <button class="hero-btn" onclick="app.quickPractice()">Tiếp tục <i class="fas fa-arrow-right"></i></button>
            </div>

            <div class="section-title">
                <span>Dành riêng cho bạn</span>
                <span class="link-btn">Xem tất cả</span>
            </div>
            <div id="topic-list"></div>
        `;

        const list = document.getElementById('topic-list');
        DATABASE.topics.forEach(t => list.innerHTML += this.createTopicItem(t));
    }

    // --- MÀN HÌNH PROFILE DNA (CÁ NHÂN HÓA CAO CẤP) ---
    renderProfile() {
        const content = document.getElementById('app-content');
        const dna = DATABASE.dna;
        
        content.innerHTML = `
            <div style="padding: 10px 0;">
                <h2 style="margin-bottom:20px;">Hồ sơ Gen Ngôn Ngữ</h2>
                
                <div class="dna-card">
                    <div class="dna-header">
                        <div class="dna-title"><i class="fas fa-id-card-alt" style="color:var(--primary)"></i> ${this.user.name}'s ID</div>
                        <span class="tag good">${this.user.level}</span>
                    </div>
                    <div style="display:flex; gap:15px;">
                        <div style="flex:1; text-align:center; padding:10px; background:#F8F9FA; border-radius:12px;">
                            <div style="font-weight:800; font-size:1.2rem; color:var(--primary)">${this.user.xp}</div>
                            <div style="font-size:0.75rem; color:var(--text-sub)">Total XP</div>
                        </div>
                        <div style="flex:1; text-align:center; padding:10px; background:#F8F9FA; border-radius:12px;">
                            <div style="font-weight:800; font-size:1.2rem; color:#E17055">${this.user.streak}</div>
                            <div style="font-size:0.75rem; color:var(--text-sub)">Day Streak</div>
                        </div>
                    </div>
                </div>

                <div class="dna-card">
                    <div class="dna-header">
                        <div class="dna-title"><i class="fas fa-bug" style="color:#FF7675"></i> Các lỗi thường gặp</div>
                        <span class="link-btn" style="font-size:0.75rem">Fix ngay</span>
                    </div>
                    <p style="font-size:0.9rem; margin-bottom:10px; color:var(--text-sub)">AI phát hiện bạn thường gặp khó khăn với các âm:</p>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        ${dna.weakSounds.map(s => `<span class="tag bad">${s}</span>`).join('')}
                    </div>
                </div>

                <div class="dna-card">
                    <div class="dna-header">
                        <div class="dna-title"><i class="fas fa-chart-bar" style="color:#00B894"></i> Biểu đồ năng lực</div>
                    </div>
                    
                    ${this.createSkillBar('Fluency (Trôi chảy)', '65%', '#00CEC9')}
                    ${this.createSkillBar('Pronunciation (Phát âm)', '80%', '#6C5CE7')}
                    ${this.createSkillBar('Grammar (Ngữ pháp)', '50%', '#FAB1A0')}
                    
                    <p style="margin-top:15px; font-size:0.85rem; background:#E0F7FA; padding:10px; border-radius:8px; color:#006064;">
                        💡 <strong>AI Tip:</strong> Phong cách nói của bạn là <b>${dna.style}</b>. Hãy thử dùng nhiều thành ngữ (Idioms) hơn để tự nhiên hơn.
                    </p>
                </div>
                
                <button class="btn-primary-lg" style="background:#dfe6e9; color:#636e72; margin-top:10px;" onclick="app.resetData()">Reset Data (Demo)</button>
            </div>
        `;
    }

    createSkillBar(label, percent, color) {
        return `
            <div class="skill-bar">
                <div class="skill-meta"><span>${label}</span><span>${percent}</span></div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${percent}; background:${color}"></div>
                </div>
            </div>
        `;
    }

    // --- OTHER HELPERS ---
    renderTopics() {
        const content = document.getElementById('app-content');
        content.innerHTML = '<h3>Topic Library</h3>';
        DATABASE.topics.forEach(t => content.innerHTML += this.createTopicItem(t));
    }
    
    renderStats() {
        // (Copy lại nội dung renderStats từ bản V4 nếu cần, hoặc để placeholder)
        document.getElementById('app-content').innerHTML = '<div style="text-align:center; padding:40px;"><h3>Stats Screen</h3><p>Đang cập nhật...</p></div>';
    }

    createTopicItem(t) {
        return `
            <div class="topic-item" onclick="app.quickPractice()">
                <div class="topic-icon" style="background:${t.color}20; color:${t.color}">${t.icon}</div>
                <div style="flex:1">
                    <h4 style="margin:0; font-size:1rem; color:var(--text-main)">${t.title}</h4>
                    <span style="font-size:0.85rem; color:var(--text-sub)">${t.desc}</span>
                </div>
                <i class="fas fa-chevron-right" style="color:#dfe6e9"></i>
            </div>
        `;
    }
    
    quickPractice() {
        document.getElementById('practice-overlay').classList.remove('hidden');
        document.getElementById('practice-container').innerHTML = `
            <div class="chat-msg ai"><strong>AI Coach:</strong><br>${DATABASE.scenarios['t1'].ai_opening}</div>
        `;
    }
    
    closePractice() {
        document.getElementById('practice-overlay').classList.add('hidden');
        if(this.isRecording) this.toggleMic();
    }
    
    // Reset để test lại Onboarding
    resetData() {
        localStorage.removeItem('nativeflow_user');
        location.reload();
    }

    // --- SPEECH MOCKUP ---
    initSpeech() { /* Giữ nguyên logic voice từ bản V4 */ 
        this.recognition = null; 
        // ... (Code cũ)
    }
    toggleMic() {
        // ... (Code cũ giả lập voice)
        // Khi click mic, giả lập hiện text
        const container = document.getElementById('practice-container');
        container.innerHTML += `<div class="chat-msg user">I would like a coffee please.</div>`;
        container.scrollTop = container.scrollHeight;
    }
}

const app = new App();