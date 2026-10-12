/**
 * app-cache.js — enregistrement du Service Worker (sw.js)
 * ═══════════════════════════════════════════════════════════════════════════
 * Le cache local est ce qui évite de retélécharger 6,5 Mo de moteur 3D et les
 * schématiques déjà vues à chaque ouverture d'onglet (GitHub Pages ne garde ses
 * fichiers valides que 10 minutes).
 *
 * Ce fichier ne fait QUE registering, et :
 *   • après le `load` de la page, jamais avant (il ne vole pas de bande passante
 *     au chargement critique) ;
 *   • uniquement en contexte sécurisé (le Service Worker l'exige : HTTPS ou
 *     localhost) ;
 *   • entièrement encapsulé dans des try/catch : si le navigateur refuse
 *     l'enregistrement (mode privé, fichier ouvert en local, politique locale),
 *     le site continue de fonctionner exactement comme avant.
 */
(function () {
    'use strict';

    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    if (location.protocol === 'file:') return;

    var started = false;

    function register() {
        if (started) return;
        started = true;
        try {
            // Le Service Worker doit être à la racine du site pour couvrir aussi
            // les éditeurs ouverts en iframe. On déduit cette racine du chemin du
            // fichier courant : l'enregistrement fonctionne donc aussi bien à la
            // racine d'un domaine que dans /Bloxd_Map_Editor/.
            var base = new URL('.', location.href);
            var url = new URL('sw.js', base).href;
            if (url === location.href) return;         // on serait déjà le SW lui-même
            var scope = base.href;

            var p = navigator.serviceWorker.register(url, { scope: scope });
            if (p && p.catch) {
                p.catch(function (err) {
                    // Échec silencieux par conception, mais on laisse une trace
                    // pour le diagnostiquer depuis la console.
                    if (window.console && console.info) {
                        console.info('[Bloxd Tools] Cache local désactivé :', err && err.message);
                    }
                });
            }
        } catch (e) { /* nothing to do: le site marche sans cache */ }
    }

    // Petite temporisation après `load` : l'enregistrement ne doit jamais retarder
    // le premier affichage de l'éditeur.
    function schedule() { setTimeout(register, 1200); }

    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
})();
