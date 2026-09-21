/* Bloxd Tools — Bascule d'onglets : charge chaque outil dans un iframe, à la demande,
   et le garde monté (état conservé) tant que la page n'est pas rechargée. */
(function () {
'use strict';

const TOOLS = {
    schem:      'schem_placer.html',
    terrain:    'terrain_editor.html',
    asset:      'asset_placer.html',
    splitter:   'schem_splitter.html',
    converter:  'schem_converter.html',
};

function getViewFromUrl() {
    try {
        const params = new URLSearchParams(window.location.search);
        const v = params.get('view');
        if (v) return v;
        if (params.has('home')) return 'home';
        const hashRaw = window.location.hash.replace(/^#/, '');
        if (hashRaw) {
            // direct view name in hash
            if (TOOLS[hashRaw] || hashRaw === 'home') return hashRaw;
            try {
                const hp = new URLSearchParams(hashRaw);
                if (hp.get('view')) return hp.get('view');
                if (hp.has('home')) return 'home';
            } catch (e) {}
        }
    } catch (e) {}
    return null;
}

function activateView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + id));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === id));

    // Plein écran réel dans un outil : plus de header/onglets/footer, l'éditeur prend tout l'écran.
    document.body.classList.toggle('tool-fullscreen', !!TOOLS[id]);

    if (TOOLS[id]) {
        const wrap = document.getElementById('view-' + id);
        const iframe = wrap.querySelector('iframe');
        if (!iframe.getAttribute('src')) {
            iframe.addEventListener('load', () => wrap.classList.add('loaded'), { once: true });
            iframe.setAttribute('src', TOOLS[id]);
        }
    }
    try { localStorage.setItem('bloxdTools.lastView', id); } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-view]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            activateView(el.dataset.view);
        });
    });

    // Ouvre directement sur le dernier outil utilisé, sinon l'accueil.
    // Mais si l'URL demande explicitement une vue (ex: ?view=home depuis le bouton 🏠 d'un éditeur), on respecte l'URL.
    let urlView = getViewFromUrl();
    let start = 'home';
    if (urlView) {
        start = urlView;
        // Nettoie l'URL pour éviter de rester en ?view=home
        try { history.replaceState(null, '', window.location.pathname); } catch (e) {}
    } else {
        try { start = localStorage.getItem('bloxdTools.lastView') || 'home'; } catch (e) {}
    }
    if (!TOOLS[start] && start !== 'home') start = 'home';
    activateView(start);

    // Permet aux iframes (éditeurs) de demander le retour au hub via postMessage
    window.addEventListener('message', (event) => {
        const data = event.data;
        if (!data) return;
        const type = typeof data === 'string' ? data : data.type;
        if (type === 'bloxdTools:goHome' || type === 'goHome' || data === 'goHome') {
            activateView('home');
        }
    });
});

// Expose une API pour que les iframes puissent aussi appeler parent.BloxdToolsHub.goHome() si même origine
window.BloxdToolsHub = {
    goHome: () => activateView('home'),
    activateView
};
})();
