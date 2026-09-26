/* Bloxd Tools — popup du premier lancement.
   Indique (et permet de régler) la langue et les touches, qui vivent dans ⚙️ Paramètres.
   Une seule fois, partagée par tous les éditeurs (localStorage). */
(function () {
'use strict';

var SEEN_KEY = 'bloxdTools.settingsHintSeen';
var LANG_KEY = 'bloxdTools.lang';
var KB_KEY = 'bloxdTools.keyboard';

var TEXT = {
    fr: {
        title: 'Langue et touches',
        body: 'Tu peux changer la langue et les touches de déplacement à tout moment dans ⚙️ Paramètres.',
        where: 'Sur l’accueil, clique ⚙️ Paramètres. Dans un éditeur, clique 🏠 puis Paramètres.',
        now: 'Tu peux aussi les régler ici. Le choix est mémorisé et partagé par tous les outils.',
        lang: 'Langue',
        kb: 'Touches de déplacement',
        azerty: 'AZERTY',
        azertySub: 'ZQSD pour avancer',
        qwerty: 'QWERTY',
        qwertySub: 'WASD pour avancer',
        open: 'Ouvrir les paramètres',
        ok: 'C’est compris'
    },
    en: {
        title: 'Language and keys',
        body: 'You can change the language and the movement keys anytime in ⚙️ Settings.',
        where: 'On the home page, click ⚙️ Settings. Inside an editor, click 🏠 then Settings.',
        now: 'You can also set them here. The choice is remembered and shared by every tool.',
        lang: 'Language',
        kb: 'Movement keys',
        azerty: 'AZERTY',
        azertySub: 'ZQSD to move',
        qwerty: 'QWERTY',
        qwertySub: 'WASD to move',
        open: 'Open Settings',
        ok: 'Got it'
    },
    ja: {
        title: '言語とキー',
        body: '言語と移動キーは、いつでも ⚙️ 設定 から変更できます。',
        where: 'ホームでは ⚙️ 設定。エディタ内では 🏠 を押してから設定へ。',
        now: 'ここでも今すぐ変更できます。選択はすべてのツールで共有されます。',
        lang: '言語',
        kb: '移動キー',
        azerty: 'AZERTY',
        azertySub: 'ZQSD で移動',
        qwerty: 'QWERTY',
        qwertySub: 'WASD で移動',
        open: '設定を開く',
        ok: 'わかりました'
    },
    ko: {
        title: '언어와 키',
        body: '언어와 이동 키는 언제든지 ⚙️ 설정에서 바꿀 수 있습니다.',
        where: '홈에서는 ⚙️ 설정. 에디터 안에서는 🏠 다음 설정입니다.',
        now: '여기서도 바로 바꿀 수 있습니다. 선택은 모든 도구에 기억됩니다.',
        lang: '언어',
        kb: '이동 키',
        azerty: 'AZERTY',
        azertySub: 'ZQSD로 이동',
        qwerty: 'QWERTY',
        qwertySub: 'WASD로 이동',
        open: '설정 열기',
        ok: '알겠습니다'
    },
    th: {
        title: 'ภาษาและปุ่ม',
        body: 'เปลี่ยนภาษาและปุ่มเคลื่อนที่ได้ตลอดเวลาใน ⚙️ ตั้งค่า',
        where: 'ที่หน้าแรก กด ⚙️ ตั้งค่า ในเครื่องมือ กด 🏠 แล้วไปที่ตั้งค่า',
        now: 'ตั้งค่าได้ที่นี่เลย — ระบบจำไว้ให้ทุกเครื่องมือ',
        lang: 'ภาษา',
        kb: 'ปุ่มเคลื่อนที่',
        azerty: 'AZERTY',
        azertySub: 'ZQSD เพื่อเดิน',
        qwerty: 'QWERTY',
        qwertySub: 'WASD เพื่อเดิน',
        open: 'เปิดตั้งค่า',
        ok: 'เข้าใจแล้ว'
    }
};

var LANGS = [
    { id: 'fr', flag: '🇫🇷', name: 'Français' },
    { id: 'en', flag: '🇬🇧', name: 'English' },
    { id: 'ja', flag: '🇯🇵', name: '日本語' },
    { id: 'ko', flag: '🇰🇷', name: '한국어' },
    { id: 'th', flag: '🇹🇭', name: 'ไทย' }
];

function detectLang() {
    var nav = '';
    try { nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase(); } catch (e) { nav = 'en'; }
    var code = nav.slice(0, 2);
    return TEXT[code] ? code : 'en';
}

function readLang() {
    try {
        var stored = localStorage.getItem(LANG_KEY);
        if (stored && TEXT[stored]) return stored;
    } catch (e) {}
    return detectLang();
}

function readKb(lang) {
    try {
        var k = localStorage.getItem(KB_KEY);
        if (k === 'qwerty' || k === 'azerty') return k;
    } catch (e) {}
    return (lang || readLang()) === 'fr' ? 'azerty' : 'qwerty';
}

function parentWillShow() {
    if (window.top === window) return false;
    try { return !!window.top.BloxdWelcome; } catch (e) { return false; }
}

function applyLocal(lang, kb) {
    try {
        if (lang) {
            localStorage.setItem(LANG_KEY, lang);
            localStorage.setItem('bloxd_lang', lang);
        }
        if (kb) localStorage.setItem(KB_KEY, kb);
    } catch (e) {}
    try { if (lang && window.applyLanguage) window.applyLanguage(lang); } catch (e) {}
    try { if (lang && window.BloxdTools && window.BloxdTools.applyLang) window.BloxdTools.applyLang(lang); } catch (e) {}
    try { if (kb && window.BloxdTools && window.BloxdTools.applyKb) window.BloxdTools.applyKb(kb); } catch (e) {}
    try { if (lang && window.SchemPlacerSetLang) window.SchemPlacerSetLang(lang); } catch (e) {}
    try { if (window.BloxdApplyPrefs) window.BloxdApplyPrefs(lang, kb); } catch (e) {}
    try {
        if (window.I18N) {
            if (lang) window.I18N.lang = lang;
            if (kb) window.I18N.keyboard = kb;
        }
    } catch (e) {}
    try { if (window.appLibraryUI && window.appLibraryUI.updateTexts) window.appLibraryUI.updateTexts(); } catch (e) {}
    try { if (window.appUIManager && window.appUIManager.updateTexts) window.appUIManager.updateTexts(); } catch (e) {}
}

function broadcast(lang, kb) {
    if (window.top !== window) {
        try { window.top.postMessage({ type: 'bloxdTools:prefs', lang: lang, kb: kb, from: 'child' }, '*'); } catch (e) {}
        return;
    }
    var frames = document.querySelectorAll('iframe');
    for (var i = 0; i < frames.length; i++) {
        try { frames[i].contentWindow.postMessage({ type: 'bloxdTools:prefs', lang: lang, kb: kb }, '*'); } catch (e) {}
    }
}

function setPrefs(lang, kb) {
    applyLocal(lang, kb);
    broadcast(lang, kb);
}

function seen() {
    try { return localStorage.getItem(SEEN_KEY) === '1'; } catch (e) { return false; }
}
function markSeen() {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
}

function canOpenSettings() {
    if (document.getElementById('settings-modal') && window.BloxdTools && window.BloxdTools.openSettings) return true;
    if (window.top !== window) {
        try { return !!(window.top.BloxdTools && window.top.BloxdTools.openSettings); } catch (e) { return true; }
    }
    return false;
}

function openSettings() {
    markSeen();
    hide();
    if (window.BloxdTools && window.BloxdTools.openSettings && document.getElementById('settings-modal')) {
        window.BloxdTools.openSettings();
        return;
    }
    try {
        if (window.top !== window && window.top.BloxdTools && window.top.BloxdTools.openSettings) {
            window.top.BloxdTools.openSettings();
            return;
        }
    } catch (e) {}
    try { window.top.postMessage({ type: 'bloxdTools:openSettings' }, '*'); } catch (e) {}
}

var root = null;
var state = { lang: 'en', kb: 'azerty' };

function hide() {
    if (root) root.classList.remove('on');
}

function render() {
    if (!root) return;
    var t = TEXT[state.lang] || TEXT.en;
    root.querySelector('[data-w="title"]').textContent = t.title;
    root.querySelector('[data-w="body"]').textContent = t.body;
    root.querySelector('[data-w="where"]').textContent = t.where;
    root.querySelector('[data-w="now"]').textContent = t.now;
    root.querySelector('[data-w="lang"]').textContent = t.lang;
    root.querySelector('[data-w="kb"]').textContent = t.kb;
    root.querySelector('[data-w="azerty"]').textContent = t.azerty;
    root.querySelector('[data-w="azertySub"]').textContent = t.azertySub;
    root.querySelector('[data-w="qwerty"]').textContent = t.qwerty;
    root.querySelector('[data-w="qwertySub"]').textContent = t.qwertySub;
    root.querySelector('[data-w="open"]').textContent = t.open;
    root.querySelector('[data-w="ok"]').textContent = t.ok;
    var openBtn = root.querySelector('[data-w="openBtn"]');
    openBtn.style.display = canOpenSettings() ? '' : 'none';
    var langBtns = root.querySelectorAll('[data-lang]');
    for (var i = 0; i < langBtns.length; i++) {
        langBtns[i].classList.toggle('on', langBtns[i].getAttribute('data-lang') === state.lang);
    }
    var kbBtns = root.querySelectorAll('[data-kb]');
    for (var j = 0; j < kbBtns.length; j++) {
        kbBtns[j].classList.toggle('on', kbBtns[j].getAttribute('data-kb') === state.kb);
    }
    var keys = root.querySelector('[data-w="keys"]');
    keys.textContent = state.kb === 'qwerty' ? 'W A S D' : 'Z Q S D';
}

function build() {
    if (root) return;
    var style = document.createElement('style');
    style.textContent = [
        '#bloxd-welcome{position:fixed;inset:0;z-index:20000;display:none;align-items:center;justify-content:center;',
        'background:rgba(5,7,12,.72);backdrop-filter:blur(5px);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}',
        '#bloxd-welcome.on{display:flex;}',
        '#bloxd-welcome .card{width:min(520px,calc(100vw - 28px));max-height:min(88vh,720px);overflow:auto;',
        'background:#1c2030;color:#eef2f8;border:1px solid #3b435b;border-radius:16px;',
        'box-shadow:0 28px 70px rgba(0,0,0,.55);padding:22px 22px 16px;}',
        '#bloxd-welcome h2{font-size:20px;margin:0 0 8px;display:flex;align-items:center;gap:8px;}',
        '#bloxd-welcome p{margin:0 0 8px;color:#c5cde0;font-size:13.5px;line-height:1.5;}',
        '#bloxd-welcome .where{color:#8c95ac;font-size:12.5px;}',
        '#bloxd-welcome .lbl{display:block;margin:14px 0 6px;font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#8c95ac;}',
        '#bloxd-welcome .langs{display:flex;flex-wrap:wrap;gap:6px;}',
        '#bloxd-welcome .langs button,#bloxd-welcome .kbs button{',
        'background:#2c3244;border:1px solid #3b435b;color:#eef2f8;border-radius:10px;padding:8px 10px;cursor:pointer;font:inherit;}',
        '#bloxd-welcome .langs button{font-size:13px;font-weight:650;}',
        '#bloxd-welcome .langs button small{display:block;font-weight:400;color:#8c95ac;font-size:10px;}',
        '#bloxd-welcome .kbs{display:grid;grid-template-columns:1fr 1fr;gap:8px;}',
        '#bloxd-welcome .kbs button{text-align:left;padding:10px 12px;}',
        '#bloxd-welcome .kbs b{display:block;font-size:14px;}',
        '#bloxd-welcome .kbs small{color:#8c95ac;font-size:11.5px;}',
        '#bloxd-welcome button.on{background:#4aa8ff;border-color:#4aa8ff;color:#061018;}',
        '#bloxd-welcome button.on small{color:rgba(6,16,24,.72);}',
        '#bloxd-welcome .keys{margin-top:8px;display:flex;gap:6px;align-items:center;color:#8c95ac;font-size:12px;}',
        '#bloxd-welcome .keys b{letter-spacing:3px;color:#eef2f8;font-family:ui-monospace,monospace;background:#101218;border:1px solid #3b435b;border-radius:6px;padding:3px 8px;}',
        '#bloxd-welcome .actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px;}',
        '#bloxd-welcome .actions button{border-radius:9px;padding:9px 14px;font:inherit;font-weight:650;cursor:pointer;border:1px solid #3b435b;background:#2c3244;color:#eef2f8;}',
        '#bloxd-welcome .actions .primary{background:#3dd48a;border-color:#3dd48a;color:#061018;}'
    ].join('');
    document.head.appendChild(style);

    root = document.createElement('div');
    root.id = 'bloxd-welcome';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    var langBtns = LANGS.map(function (l) {
        return '<button type="button" data-lang="' + l.id + '">' + l.flag + ' ' + l.name + '</button>';
    }).join('');
    root.innerHTML =
        '<div class="card">' +
            '<h2>⚙️ <span data-w="title"></span></h2>' +
            '<p data-w="body"></p>' +
            '<p class="where" data-w="where"></p>' +
            '<p data-w="now"></p>' +
            '<span class="lbl" data-w="lang"></span>' +
            '<div class="langs">' + langBtns + '</div>' +
            '<span class="lbl" data-w="kb"></span>' +
            '<div class="kbs">' +
                '<button type="button" data-kb="azerty"><b data-w="azerty"></b><small data-w="azertySub"></small></button>' +
                '<button type="button" data-kb="qwerty"><b data-w="qwerty"></b><small data-w="qwertySub"></small></button>' +
            '</div>' +
            '<div class="keys"><b data-w="keys"></b></div>' +
            '<div class="actions">' +
                '<button type="button" data-w="openBtn"><span data-w="open"></span></button>' +
                '<button type="button" class="primary" data-w="okBtn"><span data-w="ok"></span></button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(root);

    root.addEventListener('click', function (e) {
        var langBtn = e.target.closest('[data-lang]');
        if (langBtn) {
            state.lang = langBtn.getAttribute('data-lang');
            setPrefs(state.lang, state.kb);
            render();
            return;
        }
        var kbBtn = e.target.closest('[data-kb]');
        if (kbBtn) {
            state.kb = kbBtn.getAttribute('data-kb');
            setPrefs(state.lang, state.kb);
            render();
            return;
        }
        if (e.target.closest('[data-w="okBtn"]')) { markSeen(); hide(); }
        if (e.target.closest('[data-w="openBtn"]')) openSettings();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && root.classList.contains('on')) { markSeen(); hide(); }
    });
}

function show() {
    build();
    state.lang = readLang();
    state.kb = readKb(state.lang);
    // Premier passage sans préférence : aligne la langue sur le navigateur, et le clavier dessus.
    if (!localStorage.getItem(LANG_KEY) || !TEXT[localStorage.getItem(LANG_KEY)]) {
        state.lang = detectLang();
    }
    setPrefs(state.lang, state.kb);
    render();
    root.classList.add('on');
}

window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'bloxdTools:prefs') {
        if (d.lang) state.lang = TEXT[d.lang] ? d.lang : state.lang;
        if (d.kb === 'qwerty' || d.kb === 'azerty') state.kb = d.kb;
        applyLocal(d.lang, d.kb);
        if (root && root.classList.contains('on')) render();
        if (d.from === 'child' && window.top === window) broadcast(state.lang, state.kb);
    }
    if (d.type === 'bloxdTools:openSettings' && window.top === window && window.BloxdTools && window.BloxdTools.openSettings) {
        window.BloxdTools.openSettings();
    }
});

// Le parent (hub) pose le drapeau tout de suite, avant le chargement des iframes.
window.BloxdWelcome = true;

function boot() {
    if (parentWillShow()) return;
    if (seen()) {
        // Applique quand même une langue navigateur si rien n'est encore choisi (ouverture directe d'un éditeur).
        if (!localStorage.getItem(LANG_KEY)) setPrefs(detectLang(), readKb(detectLang()));
        return;
    }
    show();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
