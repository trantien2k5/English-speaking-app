export const StorageService = {
    KEY: 'nativeflow_v2',
    getData() {
        const d = localStorage.getItem(this.KEY);
        return d ? JSON.parse(d) : { completed: [], streak: 0 };
    },
    markComplete(id) {
        const data = this.getData();
        if (!data.completed.includes(id)) {
            data.completed.push(id);
            data.streak++;
            localStorage.setItem(this.KEY, JSON.stringify(data));
        }
        return data;
    }
};

export const SpeechEngine = {
    recognition: null,
    init(callback) {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Vui lòng dùng Chrome trên máy tính/Android để hỗ trợ Mic!");
            return false;
        }
        const rec = new webkitSpeechRecognition();
        rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = false;
        rec.onresult = (e) => callback(e.results[0][0].transcript);
        this.recognition = rec;
    },
    speak(text) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; u.rate = 0.9;
        window.speechSynthesis.speak(u);
    },
    start() { try{this.recognition.start()}catch(e){} },
    stop() { try{this.recognition.stop()}catch(e){} },
    compare(user, target) {
        // @ts-ignore
        const dmp = new diff_match_patch();
        const u = user.toLowerCase().replace(/[.,?!]/g, "").trim();
        const t = target.toLowerCase().replace(/[.,?!]/g, "").trim();
        const diffs = dmp.diff_main(t, u);
        dmp.diff_cleanupSemantic(diffs);
        let correct = 0;
        diffs.forEach(d => { if(d[0]===0) correct += d[1].length; });
        return { score: (correct/t.length)*100, diffs };
    }
};