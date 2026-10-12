/**
 * sidebar_collapse.js — Replier / déplier les blocs de la sidebar (Terrain Editor)
 * ═══════════════════════════════════════════════════════════════════════════
 * Chaque bloc de #app-panel (aide, formats, sections du formulaire, bloc
 * « Reprendre plus tard ») peut être replié en cliquant sur son titre.
 * Seul le titre reste visible. L'état est mémorisé dans localStorage.
 * Tout est déplié par défaut.
 */
(function () {
    'use strict';

    var STORE_KEY = 'terrainEditor.sidebarCollapsed';
    var panel = document.getElementById('app-panel');
    if (!panel) return;

    var state = {};
    try { state = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch (e) { state = {}; }

    function save() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* stockage indisponible : pas grave */ }
    }

    var blocks = panel.querySelectorAll('.form-section, .format-card, .coach-card, .sb-collapsible');
    var usedKeys = {};

    Array.prototype.forEach.call(blocks, function (block) {
        // En-tête = premier enfant direct qui est un titre de section ou l'en-tête de l'aide.
        var header = null;
        for (var i = 0; i < block.children.length; i++) {
            var c = block.children[i];
            if (c.classList.contains('section-title') || c.classList.contains('coach-head')) { header = c; break; }
        }
        if (!header) return; // bloc sans titre (ex. wrapper) : rien à replier

        // Clé stable : la clé i18n du titre, sinon son texte.
        var labelEl = header.querySelector('[data-i18n]');
        var key = labelEl ? labelEl.getAttribute('data-i18n') : header.textContent.trim().slice(0, 40);
        if (usedKeys[key]) key = key + '#' + usedKeys[key]++;
        else usedKeys[key] = 1;

        block.classList.add('sb-collapsible');
        header.classList.add('sb-header');
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');

        var chev = document.createElement('i');
        chev.className = 'fas fa-chevron-down sb-chevron';
        chev.setAttribute('aria-hidden', 'true');
        header.insertBefore(chev, header.firstChild);

        function apply(collapsed) {
            block.classList.toggle('is-collapsed', collapsed);
            header.setAttribute('aria-expanded', String(!collapsed));
            header.setAttribute('title', collapsed ? 'Déplier' : 'Replier');
        }

        function toggle() {
            var collapsed = !block.classList.contains('is-collapsed');
            apply(collapsed);
            state[key] = collapsed;
            save();
        }

        apply(!!state[key]);

        header.addEventListener('click', function (e) {
            // Ne pas replier quand on clique sur un bouton/lien/champ présent dans le titre (ex. « Guide des formats »).
            if (e.target.closest && e.target.closest('button, a, input, select, textarea, label')) return;
            toggle();
        });
        header.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });
    });
})();
