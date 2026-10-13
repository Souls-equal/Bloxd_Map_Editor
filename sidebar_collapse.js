/**
 * sidebar_collapse.js — Replier / déplier / masquer les blocs de la sidebar (Terrain Editor)
 * ═══════════════════════════════════════════════════════════════════════════
 * 1) Chaque bloc de #app-panel (aide, formats, sections du formulaire, bloc
 *    « Reprendre plus tard ») peut être replié en cliquant sur son titre.
 *    Seul le titre reste visible. L'état est mémorisé dans localStorage.
 *    Tout est déplié par défaut.
 *
 * 2) Les deux cartes d'aide (« 3 étapes pour ne pas se perdre » et « Quel
 *    fichier pour quoi ? ») ont une croix ✕ qui les masque complètement.
 *    Volontairement NON mémorisé : un rechargement de page les fait revenir,
 *    l'aide ne peut donc jamais être perdue définitivement.
 *
 * 3) La zone « Téléchargement » (bouton d'export + astuce) se cache derrière
 *    sa barre de titre : flèche ▼ = cacher, flèche ▲ = remontrer. Cet état-là
 *    EST mémorisé, mais la barre reste toujours visible.
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

    /* ═══════════════════════════════════════════════════════════════
       2) Croix ✕ : masquer complètement une carte d'aide
       ───────────────────────────────────────────────────────────────
       Rien n'est écrit dans localStorage : la carte masquée revient au
       prochain rechargement de la page (l'aide reste toujours accessible).
       ═══════════════════════════════════════════════════════════════ */
    Array.prototype.forEach.call(panel.querySelectorAll('[data-dismiss-card]'), function (btn) {
        var card = btn.closest ? btn.closest('.coach-card, .format-card') : null;
        if (!card) return;
        btn.addEventListener('click', function (e) {
            e.stopPropagation();   // ne pas déclencher le repliage du titre au passage
            card.classList.add('is-dismissed');
        });
    });

    /* ═══════════════════════════════════════════════════════════════
       3) Zone « Téléchargement » : flèche ▼ pour cacher, ▲ pour remontrer
       ───────────────────────────────────────────────────────────────
       La barre « Téléchargement » reste affichée même zone cachée : on ne
       peut donc jamais perdre le bouton d'export. État mémorisé.
       ═══════════════════════════════════════════════════════════════ */
    var EXPORT_ZONE_KEY = 'terrainEditor.exportZoneHidden';
    var exportZone = document.getElementById('export-zone');
    var exportToggle = document.getElementById('export-zone-toggle');

    if (exportZone && exportToggle) {
        var setExportZone = function (hidden) {
            exportZone.classList.toggle('is-hidden', hidden);
            exportToggle.setAttribute('aria-expanded', hidden ? 'false' : 'true');
            try { localStorage.setItem(EXPORT_ZONE_KEY, hidden ? '1' : '0'); }
            catch (e) { /* stockage indisponible (iframe bloquée) : le réglage ne survit pas */ }
        };

        var exportHidden = false;
        try { exportHidden = localStorage.getItem(EXPORT_ZONE_KEY) === '1'; } catch (e) { exportHidden = false; }

        setExportZone(exportHidden);
        exportToggle.addEventListener('click', function () {
            setExportZone(!exportZone.classList.contains('is-hidden'));
        });
    }
})();
