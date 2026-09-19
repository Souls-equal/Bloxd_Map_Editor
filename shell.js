/* Bloxd Tools — Bascule d'onglets : charge chaque outil dans un iframe, à la demande,
   et le garde monté (état conservé) tant que la page n'est pas rechargée. */
(function () {
'use strict';

const TOOLS = {
    schem:    'schem_placer.html',
    terrain:  'terrain_editor.html',
    asset:    'asset_placer.html',
    splitter: 'schem_splitter.html',
};

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
    let start = 'home';
    try { start = localStorage.getItem('bloxdTools.lastView') || 'home'; } catch (e) {}
    if (!TOOLS[start] && start !== 'home') start = 'home';
    activateView(start);
});
})();
