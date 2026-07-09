// ===== Shifaa Modern UI Script =====

// Apply saved theme immediately to avoid flash of dark content
(function () {
    if (localStorage.getItem('theme') === 'light') {
        document.documentElement.classList.add('light-mode');
    }
})();

// --- Language Translations ---
const translations = {
    en: {
        // NAV
        english: "English",
        arabic: "Arabic",

        // STROKE
        STtitle: "Stroke Questionnaire",
        STtitle2: "Answer these questions",
        gender: "What is your gender?",
        male: "Male",
        female: "Female",
        currentWork: "Which of the following best describes your current work status?",
        private: "Private",
        govtJob: "Govt_job",
        SelfEmployed: "Self-Employed",
        NeverWorked: "Never_Worked",
        children: "Children",
        age: "What is your current age?",
        bloodPressure: "Have you been diagnosed with hypertension (high blood pressure)?",
        yes: "Yes",
        no: "No",
        status: "Have you ever been married?",
        heartDisease: "Do you have Heart disease",
        live: "Do you live in an urban or rural area?",
        urban: "Urban",
        rural: "Rural",
        glucoseLevel: "What is your most recent fasting blood glucose level (mg/dL)?",
        height: "What is your current Height?",
        weight: "What is your current Weight?",
        smokeStatus: "Which of the following best describes your smoking status?",
        neverSmoke: "Never Smoked",
        smoke: "Smokes",
        formerlySmoke: "Formerly Smoked",

        // ECG
        ECGtitle: "Medical Tests & ECG",
        ECGtitle2: "Answer these Questions",
        ECGhead: "Part 1: Medical Test Questionnaire",
        ecgUpload: "Upload ECG Image",
        ckmb: "What is Your creatine kinase-myocardial band (CK-MB)?",
        troponin: "What is Your Troponin Level?",

        // CHD
        CHDtitle: "CHD Questionnaire",
        CHDtitle2: "Answer these Questions",
        cigsNum: "If you currently smoke, how many cigarettes do you smoke per day?",
        troponibloodPressure: "Are you currently taking any blood pressure medications?",
        stroke: "Have you ever had a stroke?",
        hypertension: "Have you ever been diagnosed with hypertension (high blood pressure)?",
        diabetes: "Have you ever been diagnosed with diabetes?",
        cholesterolLevel: "What is your most recent total cholesterol level (mg/dL)?",
        topBloodPressure: "What is your most recent systolic blood pressure reading (the top number)?",
        bottomBloodPressure: "What is your most recent diastolic blood pressure reading (the bottom number)?",
        restingHeartRate: "What is your resting heart rate (beats per minute)?",
        glucoseLevel: "What is your most recent fasting blood glucose level (mg/dL)?",

        // RESULT
        formCheck: "Check Your Heart",
        result: "Your Result",

        // NAV
        navHome: "Home",
        navDetector: "Detector",
        navAnalysis: "Analysis",
        navAbout: "About",
        navChatbot: "Chatbot",
        navGetStarted: "Get Started",

        // HOME HERO
        homeHero1: "Check Your Heart",
        homeHero2: "Health Today",
        homeHeroDesc: "Welcome to Shifaa, a groundbreaking platform where technology meets healthcare. Our mission is to empower you with tools for early prevention and detection of cardiovascular diseases.",
        homeBtn: "Get Started",
        homeChatBtn: "Chat with AI",
        trustAI: "AI Powered",
        trustFast: "Fast Detection",
        trustAccuracy: "95% Accuracy",

        // SERVICES
        svcTitle: "Our Services",
        svcSubtitle: "Tell Us How Can Help?",
        svc1Title: "Heart Detector",
        svc1Desc: "Start your heart health assessment with our easy-to-use tool by answering a few questions.",
        svc1Btn: "Start Assessment",
        svc2Title: "Data Analysis",
        svc2Desc: "Gain detailed insights with our comprehensive analysis page.",
        svc2Btn: "View Analysis",
        svc3Title: "AI Chatbot",
        svc3Desc: "Get instant health support from our AI Chatbot, your round-the-clock digital health assistant.",
        svc3Btn: "Chat Now",
        svc4Title: "About Us",
        svc4Desc: "Discover our mission, technology, and the dedicated team behind our innovative platform.",
        svc4Btn: "Learn More",

        // HOW DETECTOR WORKS
        howTitle: "How Detector Works",
        step1Title: "1. Answer Some Questions",
        step1Desc: "Let's start your health journey. Please answer a few questions to help us understand your health better.",
        step2Title: "2. Analyze Answers",
        step2AnalyzeBy: "We do analysis by:",
        step2Desc: "Our advanced algorithms analyze your answers to provide insightful feedback.",
        step3Title: "3. View Your Results",
        step3Desc: "Congratulations! Let's look at your results and plan your path to optimal heart health.",

        // DETECTOR HEROES
        strokeHero1: "AI-Powered Heart & Stroke Detection",
        strokeHero2: "Stroke Risk Prediction",
        strokeHeroDesc: "Advanced machine-learning models help estimate your stroke risk using key health indicators—fast, accurate, and actionable.",
        strokeBtn: "Run Stroke Check",
        strokeChatBtn: "Ask AI Doctor",
        chdHeroDesc: "Assess your risk of developing Coronary Heart Disease (CHD) within the next 10 years. Our CHD Predictor is powered by the Framingham Heart Study data.",
        ecgHeroDesc: "Early detection of Myocardial Infarction (MI) can save lives. Our Heart Attack Detector combines ECG image analysis with medical test results for accurate and swift heart attack detection.",

        // ABOUT PAGE
        aboutHeroTitle: "About Shifaa",
        aboutHeroDesc: "Pioneering cardiovascular health through AI-powered detection and analysis. Our mission is to make heart health accessible to everyone.",
        aboutCard1Title: "AI-Powered Detection",
        aboutCard1Desc: "Advanced machine learning algorithms analyze medical data to detect cardiovascular risks with high accuracy.",
        aboutCard2Title: "Data Analytics",
        aboutCard2Desc: "Comprehensive Power BI dashboards provide insights into cardiovascular disease patterns and risk factors.",
        aboutCard3Title: "24/7 Chatbot Support",
        aboutCard3Desc: "Our intelligent chatbot provides instant answers to your cardiovascular health questions anytime.",
        missionTitle: "Our Mission",
        missionDesc: "Our platform combines cutting-edge AI technology with medical expertise to deliver comprehensive cardiovascular health solutions. From early detection to detailed analysis, we're here to support your heart health journey.",
        teamTitle: "Our Team",
    },
    ar: {
        english: "English",
        arabic: "عربي",

        // STROKE
        STtitle: "اسئلة عن السكتة الدماغية",
        STtitle2: "اجب علي هذه الاسئلة",
        gender: "ما هو نوعك؟",
        male: "ذكر",
        female: "انثي",
        currentWork: "أي مما يلي يصف حالة عملك الحالية؟",
        private: "خاص",
        govtJob: "حكومي",
        SelfEmployed: "لديك عملك الخاص",
        NeverWorked: "لا تعمل",
        children: "أطفال",
        age: "ما هو سنك الحالي؟",
        bloodPressure: "هل سبق أن تم تشخيصك بارتفاع ضغط الدم؟",
        yes: "نعم",
        no: "لا",
        status: "هل سبق لك أن تزوجت؟",
        heartDisease: "هل لديك مرض في القلب؟",
        live: "هل تعيش في منطقة حضرية أم ريفية؟",
        urban: "حضارية",
        rural: "ريفية",
        glucoseLevel: "ما هو أحدث مستوى جلوكوز في الدم في حالة الصيام؟",
        height: "ما هو طولك الحالي؟",
        weight: "ما هو وزنك الحالي؟",
        smokeStatus: "أي من التالي يصف حالة التدخين لديك؟",
        neverSmoke: "لم أدخن ابدا",
        smoke: "ادخن",
        formerlySmoke: "ادخن بشكل كبير",

        // ECG
        ECGtitle: "التحاليل الطبية وتخطيط القلب",
        ECGtitle2: "اجب علي تلك الاسئلة",
        ECGhead: "الجزء 1: اسئلة التحاليل الطبية",
        ecgUpload: "ارفع صورة تخطيط القلب",
        ckmb: "ما هو مستوى كرياتين كيناز وعضلة القلب (CK-MP) لديك؟",
        troponin: "ما هو مستوي التروبونين لديك؟",

        // CHD
        CHDtitle: "اسئلة أمراض الشرايين التاجية",
        CHDtitle2: "أجب علي تلك الاسئلة",
        cigsNum: "إذا كنت تدخن حالياً، فكم عدد السجائر التي تدخنها يومياً؟",
        troponibloodPressure: "هل تتناول حالياً أي أدوية لضغط الدم؟",
        stroke: "هل أصبت بسكتة دماغية من قبل؟",
        hypertension: "هل سبق أن تم تشخيصك بارتفاع ضغط الدم؟",
        diabetes: "هل سبق أن تم تشخيصك بمرض السكري؟",
        cholesterolLevel: "ما هو أحدث مستوى كوليسترول كلي لديك؟",
        topBloodPressure: "ما هي أحدث قراءة لضغط الدم الانقباضي لديك؟",
        bottomBloodPressure: "ما هي أحدث قراءة لضغط الدم الانبساطي لديك؟",
        restingHeartRate: "ما هو معدل ضربات قلبك أثناء الراحة؟",
        glucoseLevel: "ما هو أحدث مستوى جلوكوز في الدم في حالة الصيام؟",

        // RESULT
        formCheck: "ابدا الفحص",
        result: "نتيجتك",

        // NAV
        navHome: "الرئيسية",
        navDetector: "الكاشف",
        navAnalysis: "التحليل",
        navAbout: "عن الموقع",
        navChatbot: "الدردشة",
        navGetStarted: "ابدأ الآن",

        // HOME HERO
        homeHero1: "افحص قلبك",
        homeHero2: "صحتك اليوم",
        homeHeroDesc: "مرحباً بك في شفاء، منصة رائدة تجمع بين التكنولوجيا والرعاية الصحية. مهمتنا تمكينك بأدوات للوقاية المبكرة والكشف عن أمراض القلب والأوعية الدموية.",
        homeBtn: "ابدأ الآن",
        homeChatBtn: "تحدث مع الذكاء الاصطناعي",
        trustAI: "مدعوم بالذكاء الاصطناعي",
        trustFast: "كشف سريع",
        trustAccuracy: "دقة 95%",

        // SERVICES
        svcTitle: "خدماتنا",
        svcSubtitle: "كيف يمكننا مساعدتك؟",
        svc1Title: "كاشف أمراض القلب",
        svc1Desc: "ابدأ تقييم صحة قلبك باستخدام أداتنا السهلة الاستخدام من خلال الإجابة على بعض الأسئلة.",
        svc1Btn: "ابدأ التقييم",
        svc2Title: "تحليل البيانات",
        svc2Desc: "احصل على رؤى تفصيلية من خلال صفحة التحليل الشاملة لدينا.",
        svc2Btn: "عرض التحليل",
        svc3Title: "الدردشة الذكية",
        svc3Desc: "احصل على دعم صحي فوري من روبوت الدردشة الذكي لدينا، مساعدك الصحي الرقمي على مدار الساعة.",
        svc3Btn: "دردش الآن",
        svc4Title: "عن الموقع",
        svc4Desc: "اكتشف مهمتنا وتقنيتنا والفريق المتفاني الذي يقف وراء منصتنا المبتكرة.",
        svc4Btn: "تعرف أكثر",

        // HOW DETECTOR WORKS
        howTitle: "كيف يعمل الكاشف",
        step1Title: "١. أجب على بعض الأسئلة",
        step1Desc: "لنبدأ رحلتك الصحية. يرجى الإجابة على بعض الأسئلة لمساعدتنا على فهم صحتك بشكل أفضل.",
        step2Title: "٢. تحليل الإجابات",
        step2AnalyzeBy: "نقوم بالتحليل من خلال:",
        step2Desc: "تقوم خوارزمياتنا المتقدمة بتحليل إجاباتك لتقديم تعليقات ثاقبة.",
        step3Title: "٣. عرض نتائجك",
        step3Desc: "تهانينا! لنلقِ نظرة على نتائجك ونخطط لمسارك نحو صحة قلب مثالية.",

        // DETECTOR HEROES
        strokeHero1: "كشف أمراض القلب والسكتة الدماغية بالذكاء الاصطناعي",
        strokeHero2: "التنبؤ بخطر السكتة الدماغية",
        strokeHeroDesc: "تساعد نماذج التعلم الآلي المتقدمة في تقدير خطر الإصابة بالسكتة الدماغية باستخدام المؤشرات الصحية الرئيسية.",
        strokeBtn: "ابدأ فحص السكتة الدماغية",
        strokeChatBtn: "اسأل طبيب الذكاء الاصطناعي",
        chdHeroDesc: "قيّم خطر إصابتك بأمراض الشرايين التاجية خلال السنوات العشر القادمة. يعتمد كاشف CHD لدينا على بيانات دراسة فرامينغهام للقلب.",
        ecgHeroDesc: "يمكن للكشف المبكر عن احتشاء عضلة القلب إنقاذ الأرواح. يجمع كاشف النوبة القلبية لدينا بين تحليل صور تخطيط القلب ونتائج الاختبارات الطبية للكشف الدقيق والسريع.",

        // ABOUT PAGE
        aboutHeroTitle: "عن شفاء",
        aboutHeroDesc: "ريادة صحة القلب والأوعية الدموية من خلال الكشف والتحليل المدعوم بالذكاء الاصطناعي. مهمتنا جعل صحة القلب في متناول الجميع.",
        aboutCard1Title: "الكشف بالذكاء الاصطناعي",
        aboutCard1Desc: "تحلل خوارزميات التعلم الآلي المتقدمة البيانات الطبية للكشف عن مخاطر القلب والأوعية الدموية بدقة عالية.",
        aboutCard2Title: "تحليل البيانات",
        aboutCard2Desc: "توفر لوحات معلومات Power BI الشاملة رؤى حول أنماط أمراض القلب والأوعية الدموية وعوامل الخطر.",
        aboutCard3Title: "دعم الدردشة 24/7",
        aboutCard3Desc: "يقدم روبوت الدردشة الذكي لدينا إجابات فورية لأسئلتك المتعلقة بصحة القلب في أي وقت.",
        missionTitle: "مهمتنا",
        missionDesc: "تجمع منصتنا تقنية الذكاء الاصطناعي المتطورة مع الخبرة الطبية لتقديم حلول شاملة لصحة القلب والأوعية الدموية. من الكشف المبكر إلى التحليل التفصيلي، نحن هنا لدعم رحلتك الصحية القلبية.",
        teamTitle: "فريقنا",
    }
};

// --- Language Switching ---
const setLanguage = (language) => {
    const elements = document.querySelectorAll('[data-lng]');
    elements.forEach((element) => {
        const translationKey = element.getAttribute("data-lng");
        if (translations[language] && translations[language][translationKey]) {
            element.textContent = translations[language][translationKey];
        }
    });

    const isAr = language === 'ar';
    document.documentElement.lang = language;
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
};

// Wrap bare text nodes in nav links with data-lng spans so setLanguage can translate them.
// This runs once at page load — no need to modify each page's HTML.
function wrapNavTextNodes() {
    const linkMap = [
        ['.u-list a[href="/"]',       'navHome'],
        ['.u-list a[href="/about"]',  'navAbout'],
        ['.u-list a[href="/chat"]',   'navChatbot'],
        ['.n-button-wrap a.n-button', 'navGetStarted'],
    ];

    linkMap.forEach(([sel, key]) => {
        document.querySelectorAll(sel).forEach(el => {
            if (el.querySelector('[data-lng]')) return; // already wrapped
            for (const node of Array.from(el.childNodes)) {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    const trimmed = node.textContent.trim();
                    const leading  = node.textContent.startsWith(' ') ? ' ' : '';
                    const trailing = node.textContent.endsWith(' ')   ? ' ' : '';
                    const frag = document.createDocumentFragment();
                    if (leading) frag.appendChild(document.createTextNode(leading));
                    const span = document.createElement('span');
                    span.setAttribute('data-lng', key);
                    span.textContent = trimmed;
                    frag.appendChild(span);
                    if (trailing) frag.appendChild(document.createTextNode(trailing));
                    el.replaceChild(frag, node);
                    break;
                }
            }
        });
    });

    // Dropdown toggles: "Detector" and "Analysis"
    document.querySelectorAll('.u-list .nav-link.dropdown-toggle').forEach(el => {
        if (el.querySelector('[data-lng]')) return;
        for (const node of Array.from(el.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                const text = node.textContent.trim();
                const key  = text === 'Detector' ? 'navDetector'
                           : text === 'Analysis'  ? 'navAnalysis'
                           : null;
                if (key) {
                    const span = document.createElement('span');
                    span.setAttribute('data-lng', key);
                    span.textContent = text;
                    const prefix = node.textContent.match(/^[\s\S]*?(?=\S)/)?.[0] || '';
                    const frag = document.createDocumentFragment();
                    if (prefix) frag.appendChild(document.createTextNode(prefix));
                    frag.appendChild(span);
                    el.replaceChild(frag, node);
                }
                break;
            }
        }
    });
}
wrapNavTextNodes();

// Use specific selector so form dropdowns are never confused with the lang picker
const langSelector = document.querySelector('select.lang-select');
if (langSelector) {
    langSelector.addEventListener("change", (event) => {
        setLanguage(event.target.value);
        localStorage.setItem("lang", event.target.value);
    });
}

// Script is loaded at bottom of body so DOM is ready; no need for DOMContentLoaded
setLanguage(localStorage.getItem("lang") || 'en');
// Sync the select element to the stored value
if (langSelector) {
    langSelector.value = localStorage.getItem("lang") || 'en';
}

// --- Hamburger Menu ---
const menu = document.getElementById('menu');
const rightNav = document.getElementById('n-right');

if (menu) {
    menu.onclick = () => {
        menu.classList.toggle('bx-x');
        if (rightNav) {
            rightNav.classList.toggle('open');

            const ul = rightNav.querySelector('ul');
            if (ul) {
                if (ul.style.display === 'flex') {
                    ul.style.display = 'none';
                } else {
                    ul.style.display = 'flex';
                    ul.style.flexDirection = 'column';
                    ul.style.position = 'absolute';
                    ul.style.top = '70px';
                    ul.style.right = '2rem';
                    ul.style.background = document.documentElement.classList.contains('light-mode')
                        ? 'rgba(240, 242, 255, 0.98)'
                        : 'rgba(15, 15, 35, 0.98)';
                    ul.style.backdropFilter = 'blur(20px)';
                    ul.style.padding = '1rem';
                    ul.style.borderRadius = 'var(--radius-md)';
                    ul.style.border = '1px solid var(--border-glass)';
                    ul.style.minWidth = '220px';
                    ul.style.gap = '0.5rem';
                    ul.style.listStyle = 'none';
                    ul.style.zIndex = '1000';
                }
            }
        }
    };
}

// --- Navbar Scroll Effect ---
let prevScrollPos = window.pageYOffset;
const navbar = document.getElementById('Navebar');

window.onscroll = function () {
    let currentScrollPos = window.pageYOffset;

    if (navbar) {
        if (prevScrollPos > currentScrollPos) {
            navbar.style.paddingLeft = "2rem";
        } else {
            navbar.style.paddingLeft = "1rem";
        }
    }
    prevScrollPos = currentScrollPos;
};

// --- Scroll-to-Top for Home Button ---
const homeBtn = document.getElementById("homeBtn");
if (homeBtn) {
    homeBtn.addEventListener("click", function () {
        const target = document.getElementById("Services-Sheader") ||
                       document.getElementById("Services") ||
                       document.getElementById("chart");
        if (target) {
            target.scrollIntoView({ behavior: "smooth" });
        }
    });
}

// --- Image Upload Preview (ECG page) ---
const imageUpload = document.getElementById("imageUpload");
const previewImage = document.getElementById("previewImage");

if (imageUpload && previewImage) {
    imageUpload.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (!file || !file.type.match("image.*")) {
            if (file) alert("Please select a valid image file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            previewImage.src = event.target.result;
            previewImage.style.display = 'block';
        };
        reader.readAsDataURL(file);
    });
}

// --- Intersection Observer for Scroll Animations ---
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

const introEl = document.querySelector('.intro');
if (introEl) {
    introEl.classList.add('animate-on-scroll');
    fadeInObserver.observe(introEl);
}

const serviceCards = document.querySelectorAll('.oneServices');
serviceCards.forEach(card => {
    card.classList.add('animate-on-scroll');
    fadeInObserver.observe(card);
});

const parts = document.querySelectorAll('.parts');
parts.forEach(part => {
    part.classList.add('animate-on-scroll');
    fadeInObserver.observe(part);
});

// --- Smooth Scroll for Anchor Links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// --- Navbar Background on Scroll ---
window.addEventListener('scroll', () => {
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});

// --- Click outside mobile menu to close ---
document.addEventListener('click', (e) => {
    if (rightNav && menu) {
        // Only act when the mobile dropdown is actually open — otherwise this
        // fires on every click anywhere on the page (dashboard buttons, theme
        // toggle, etc.) and force-hides the desktop nav links via inline style.
        if (rightNav.classList.contains('open') && !rightNav.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('bx-x');
            rightNav.classList.remove('open');
            const ul = rightNav.querySelector('ul');
            if (ul) ul.style.display = 'none';
        }
    }
});

// --- Service Card Button Ripple Effect ---
document.addEventListener('click', function (e) {
    const btn = e.target.classList.contains('S-btn') ? e.target : e.target.closest('.S-btn');
    if (!btn || btn.tagName === 'A') return;
    if (btn) {
        const ripple = document.createElement('span');
        const rect = btn.getBoundingClientRect();
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(108, 99, 255, 0.4);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        ripple.style.left = (e.clientX - rect.left) + 'px';
        ripple.style.top = (e.clientY - rect.top) + 'px';
        ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + 'px';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }
});

// Add ripple keyframes dynamically
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to { transform: scale(4); opacity: 0; }
    }
`;
document.head.appendChild(rippleStyle);

// --- Light / Dark Mode Toggle ---
function applyTheme(theme) {
    const btn = document.getElementById('theme-toggle');
    if (theme === 'light') {
        document.documentElement.classList.add('light-mode');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        document.documentElement.classList.remove('light-mode');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

function initThemeToggle() {
    const wrap = document.querySelector('.n-button-wrap');
    if (!wrap) return;

    const btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.className = 'theme-toggle-btn';
    btn.setAttribute('aria-label', 'Toggle light/dark mode');
    btn.innerHTML = '<i class="fa-solid fa-sun"></i>';

    const langSel = wrap.querySelector('.lang-select');
    if (langSel) {
        wrap.insertBefore(btn, langSel);
    } else {
        wrap.prepend(btn);
    }

    btn.addEventListener('click', () => {
        const next = document.documentElement.classList.contains('light-mode') ? 'dark' : 'light';
        applyTheme(next);
        localStorage.setItem('theme', next);
    });
}

initThemeToggle();
applyTheme(localStorage.getItem('theme') || 'dark');
