/**
 * sw.js — Service Worker de Bloxd Tools (cache local)
 * ═══════════════════════════════════════════════════════════════════════════
 * POURQUOI ?
 *   Le site est servi par GitHub Pages, qui impose `max-age = 600` (10 minutes)
 *   à tous les fichiers. Concrètement, après une pause café, un rechargement
 *   retélécharge intégralement le moteur 3D du Terrain Editor (6,5 Mo) et les
 *   schématiques déjà vues. Sur une connexion lente ou un portable modeste,
 *   c'est exactement la sensation « le site est lent à chaque fois ».
 *
 *   Ce Service Worker change la politique de cache côté client :
 *     • les DONNÉES (.bloxdschem, tables de blocs) sont servies instantanément
 *       depuis le disque, puis vérifiées en arrière-plan (stale-while-revalidate) ;
 *     • le CODE (html, js, css) est demandé au réseau d'abord — une simple
 *       validation 304 de quelques octets — donc une mise à jour est visible
 *       immédiatement et il n'y a jamais de version périmée de l'éditeur ;
 *       le cache ne sert de secours que si le réseau est cassé (hors ligne).
 *
 * SÉCURITÉ : tout est limité à l'origine (rien n'est mis en cache depuis les
 * CDN : le navigateur s'en occupe déjà très bien). Toute erreur de cache est
 * avalée silencieusement — un Service Worker qui tombe en panne ne doit jamais
 * empêcher le site de fonctionner.
 */

'use strict';

/** Incrémenter en cas de changement de politique de cache (invalide tout). */
const CACHE_VERSION = 'bloxd-tools-v1';
const CACHE_DATA = CACHE_VERSION + '-data';     // réponses périmables en arrière-plan
const CACHE_CODE = CACHE_VERSION + '-code';     // réseau d'abord, cache en secours

/** Données volumineuses et rarement modifiées → « servir tout de suite, vérifier après ». */
function isDataResource(pathname) {
    return /\/schems\/[^/]+\.bloxdschem$/i.test(pathname)
        || /(?:^|\/)nameToId\.json$/i.test(pathname)
        || /(?:^|\/)schem_converter-map\.json$/i.test(pathname);
}

self.addEventListener('install', () => {
    // Pas de pré-cache : le site fonctionne sans le SW, et un pré-cache de
    // 11 Mo au premier chargement serait justement… le ralentissement combattu.
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        try {
            const keys = await caches.keys();
            await Promise.all(keys.filter(k => !k.startsWith(CACHE_VERSION)).map(k => caches.delete(k)));
        } catch (e) { /* ignore */ }
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    let url;
    try { url = new URL(req.url); } catch (e) { return; }
    if (url.origin !== self.location.origin) return;          // CDN : cache HTTP du navigateur

    // Un rechargement forcé (Ctrl+Maj+R) ne doit pas être détourné par le cache.
    if (req.cache === 'reload' || req.cache === 'no-store') return;

    if (isDataResource(url.pathname)) {
        event.respondWith(staleWhileRevalidate(req));
        return;
    }
    event.respondWith(networkFirst(req));
});

/**
 * Données : répond depuis le cache si présent (0 requête réseau sur le chemin
 * critique), puis met le cache à jour en arrière-plan. L'utilisateur voit la
 * version déjà téléchargée ; la suivante est déjà là.
 */
async function staleWhileRevalidate(req) {
    let cache = null;
    let cached = null;
    try {
        cache = await caches.open(CACHE_DATA);
        cached = await cache.match(req, { ignoreSearch: false, ignoreVary: true });
    } catch (e) { /* stockage indisponible (navigation privée, quota) */ }

    // Revalidation : `no-cache` force la comparaison avec le serveur (304 = une
    // poignée d'octets, pas 20 Ko de retéléchargement).
    const revalidate = (async () => {
        if (!cache) return null;
        try {
            const res = await fetch(new Request(req, { cache: 'no-cache' }));
            if (res && res.ok && res.type === 'basic') await cache.put(req, res.clone());
            return res;
        } catch (e) { return null; }
    })();

    if (cached) {
        revalidate.catch(() => {});
        return cached;
    }
    const fresh = await revalidate;
    if (fresh) return fresh;
    throw new Error('bloxd-tools: ressource indisponible hors ligne');
}

/**
 * Code : réseau d'abord. Une mise en ligne est donc prise en compte à la
 * première visite (au pire un 304), et le cache ne sert que si le réseau échoue.
 */
async function networkFirst(req) {
    let cache = null;
    try { cache = await caches.open(CACHE_CODE); } catch (e) { /* ignore */ }
    try {
        const res = await fetch(req);
        if (cache && res && res.ok && res.type === 'basic') {
            cache.put(req, res.clone()).catch(() => {});
        }
        return res;
    } catch (err) {
        if (cache) {
            const cached = await cache.match(req, { ignoreVary: true });
            if (cached) return cached;
        }
        // Fichier absent du dépôt (404) ou coupure réseau : on laisse l'erreur
        // remonter normalement, sans inventer de réponse.
        throw err;
    }
}
