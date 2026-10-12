# tools/ — utilitaires de construction

Ce dépôt est un site **statique, sans build obligatoire** : les fichiers sont servis
tels quels par GitHub Pages. Les scripts d'ici servent à générer les fichiers
dérivés qui rendent le site rapide, et à vérifier qu'ils ne sont pas périmés.

---

## `build-asset-index.mjs` — index de la bibliothèque d'assets

**Ce qu'il produit :** `schems/index.json`.

**Pourquoi :** l'Asset Placer doit afficher ~900 constructions (maisons, arbres,
rochers, stands). Sans index, il doit *deviner* quels fichiers existent : il
télécharge un à un ~1000 petits `.bloxdschem`, parse chacun d'eux sur le thread
principal, puis reconstruit toute la liste affichée à chaque lot reçu. Résultat
mesuré sur ce dépôt : **956 requêtes, 2 Mo téléchargés, 1,9 million d'objets de
blocs en mémoire, 94 reconstructions de la liste** — lent sur une bonne machine,
catastrophique sur un portable.

Avec l'index : **1 requête (~12 Ko gzippés)**, la liste s'affiche aussitôt, et le
fichier d'un asset n'est téléchargé + décodé qu'au moment où on le pose (ou au
survol de sa carte, en préchargement).

**Comment :** le script exécute le *vrai* pipeline de l'application
(`window.BloxdIO.parseSchem` → conversion en liste → `_stripBottomPlatforms` →
`_normalizeMetadata`, relus dans `asset_placer-core.js` et `asset_placer-ui.js`
dans un contexte Node). L'index ne peut donc pas diverger de ce que voit
l'utilisateur, et il reflète bien le retrait automatique des socles.

```bash
node tools/build-asset-index.mjs            # (ré)écrit schems/index.json
node tools/build-asset-index.mjs --check    # ne touche à rien, sort en erreur si périmé
node tools/build-asset-index.mjs --quiet    # sans bruit de console
```

**À régénérer quand :**

* un fichier est ajouté, retiré ou modifié dans `schems/` ;
* `manifest.json` change (nouveaux préfixes, catégories) ;
* `_stripBottomPlatforms()` change de logique (les dimensions affichées en dépendent).

**Si l'index est absent** (fork, dépôt sans Node, build oublié) : rien ne casse.
L'Asset Placer retombe automatiquement sur le balayage de `manifest.json` — mais
en parallèle (12 requêtes à la fois) et avec le cache HTTP, au lieu du balayage
séquentiel `no-store` d'avant : ~1010 requêtes en ~3 s simulées au lieu de 27 s,
et le même affichage incrémental.

### Format de `schems/index.json`

```jsonc
{
  "schema": 1,
  "generatedAt": "2026-10-11T16:13:54.717Z",
  "dir": "schems/",
  "count": 922,
  "assets": [
    // n = nom affiché · f = fichier dans schems/ · t = catégories (séparées par espaces)
    // x,y,z = dimensions en blocs APRÈS retrait des socles · b = nombre de blocs
    // s = taille du fichier en octets
    { "n": "house001", "f": "house001.bloxdschem", "t": "house",
      "x": 44, "y": 76, "z": 59, "b": 17853, "s": 23547 }
  ]
}
```

`schema` est un numéro de version : changez-le si vous changez le contenu des
entrées. Un chargeur qui découvre un schéma inconnu **ignore l'index** et repart
sur le balayage du manifest — donc une vieille version du site face à un nouvel
index, ou l'inverse, ne casse jamais rien.

## `asset-index-workflow.yml` — contrôle de fraîcheur en CI

Un workflow GitHub Actions prêt à l'emploi : il lance `--check` sur les PR qui
touchent `schems/`, `manifest.json` ou le générateur, et signale l'oubli.
Il doit être **copié** dans `.github/workflows/` pour tourner (la création d'un
fichier de workflow demande l'autorisation `workflows`, que n'ont pas tous les
outils d'automatisation) :

```bash
mkdir -p .github/workflows
git mv tools/asset-index-workflow.yml .github/workflows/asset-index.yml
git commit -m "CI: contrôle de fraîcheur de l'index d'assets"
```

## `vendor/jszip.min.js`

N'est pas généré : c'est JSZip 3.10.1, *extrait* de `terrain_editor.js` où il
était inliné. Le Terrain Editor ne s'en sert que pour l'export `.zip` des mondes
découpés en parties ; il le charge donc à la demande via `window.ensureJsZip()`
au lieu de payer 95 Ko de téléchargement + compilation à chaque ouverture de
l'éditeur. (L'Asset Placer, lui, continue de le charger depuis le CDN : il s'en
sert dès qu'on exporte.)
