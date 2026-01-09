export const LessonsDB = {
    1: {
        id: 1, title: "Hello & Intro", desc: "Chào hỏi cơ bản",
        dialogue: [
            { role: "teacher", content: "Hi! I don't think we've met. I'm Sarah." },
            { role: "user", target: "Nice to meet you Sarah I am Nam", phonetic: "/naɪs tuː miːt juː/" },
            { role: "teacher", content: "Nice to meet you too. Are you new here?" },
            { role: "user", target: "Yes it is my first day", phonetic: "/jɛs ɪt ɪz maɪ fɜːrst deɪ/" }
        ]
    },
    2: {
        id: 2, title: "Ordering Coffee", desc: "Gọi đồ uống",
        dialogue: [
            { role: "teacher", content: "Good morning! What can I get for you?" },
            { role: "user", target: "Can I get a black coffee please", phonetic: "/kæn aɪ ɡɛt ə blæk ˈkɔːfi/" },
            { role: "teacher", content: "Hot or iced?" },
            { role: "user", target: "Iced please", phonetic: "/aɪst pliːz/" }
        ]
    },
    3: {
        id: 3, title: "Asking for WiFi", desc: "Hỏi mật khẩu Wifi",
        dialogue: [
            { role: "teacher", content: "Here is your drink. Anything else?" },
            { role: "user", target: "Do you have free wifi here", phonetic: "/duː juː hæv friː ˈwaɪfaɪ hɪr/" },
            { role: "teacher", content: "Yes, the password is on the receipt." }
        ]
    },
    10: {
        id: 10, title: "Clothing Store", desc: "Mua quần áo",
        dialogue: [
            { role: "teacher", content: "Welcome! Can I help you find anything?" },
            { role: "user", target: "I am looking for a white t-shirt", phonetic: "/waɪt ˈtiːˌʃɜːrt/" },
            { role: "teacher", content: "Okay. What is your size?" },
            { role: "user", target: "Medium please", phonetic: "/ˈmiːdiəm/" }
        ]
    },
    11: {
        id: 11, title: "Taking a Taxi", desc: "Đi taxi",
        dialogue: [
            { role: "teacher", content: "Where are you heading to?" },
            { role: "user", target: "Please take me to the airport", phonetic: "/ˈɛrpɔːrt/" }
        ]
    },
    12: {
        id: 12, title: "Hotel Check-in", desc: "Nhận phòng khách sạn",
        dialogue: [
            { role: "teacher", content: "Welcome to Hilton. Do you have a reservation?" },
            { role: "user", target: "I have a booking under Nam", phonetic: "/ˈbʊkɪŋ ˈʌndər næm/" }
        ]
    }
};