/**
 * block_colors.js — Couleurs fidèles pour un très grand nombre de blocs Bloxd.io.
 *
 * Stratégie :
 *  - Une table de couleurs "de base" pour les couleurs nommées (white, orange, magenta, ...)
 *    déclinées par type de matériau (wool, concrete, planks, baked clay, glass, ceramic, tiles).
 *  - Des couleurs matériaux spécifiques (bois par essence, feuilles, minerais, etc.)
 *  - Une fonction getBlockColor(id) qui combine une table explicite de blocs connus
 *    et un fallback par analyse du nom (recherche de mots-clés) pour les blocs
 *    moins fréquents. Au pire on retombe sur une couleur de matière générique.
 */

(function (global) {
    'use strict';

    // Couleurs de base par teinte (proches Minecraft/Bloxd)
    const HUE = {
        White:      0xf2f2f2,
        Orange:     0xea7e35,
        Magenta:    0xc74ebd,
        'Light Blue':0x6387d2,
        Yellow:     0xb8a93a,
        Lime:       0x72b828,
        Pink:       0xe88da2,
        Gray:       0x6a6a6a,
        'Light Gray':0xa0a0a0,
        Cyan:       0x6099a8,
        Purple:     0x804dba,
        Blue:       0x3c54ad,
        Brown:      0x7b5536,
        Green:      0x4d8a33,
        Red:        0xa03333,
        Black:      0x1b1b20,
        // Bonus
        Maroon:     0x6b1e1e,
        Teal:       0x2f7f87,
        Indigo:     0x3b3b8c,
        Gold:       0xf2c94c,
        Bronze:     0xa57a3f,
        Copper:     0xc47d4a,
        Beige:      0xd9c99a,
        Cream:      0xf1e9ca,
        Silver:     0xccccd6,
    };

    // Légères variations par matériau (facteur multiplicatif)
    const MATERIAL_ADJUST = {
        wool:           [1.00, 1.00, 1.00],
        concrete:       [0.88, 0.88, 0.88],  // plus sombre et plus mat
        planks:         [0.82, 0.70, 0.50],  // mixé avec brun-bois
        'baked clay':   [0.85, 0.78, 0.70],
        clay:           [0.95, 0.95, 0.95],
        glass:          [1.00, 1.00, 1.00],
        ceramic:        [0.95, 0.95, 1.00],
        tile:           [0.92, 0.92, 0.95],
    };

    // Couleurs par essence de bois (écorce et intérieur)
    const WOOD = {
        Maple:  { log: 0x8a6339, planks: 0xc19a6b, leaves: 0x5a9633, sapling: 0x5a9633, barkless: 0xc19a6b },
        Pine:   { log: 0x55463a, planks: 0x8d7350, leaves: 0x2d5c2c, sapling: 0x3a7a3b, barkless: 0x8d7350 },
        Plum:   { log: 0x6a4b36, planks: 0xa38264, leaves: 0x4d7e39, sapling: 0x558a3d, barkless: 0xa38264, fruit: 0x7a2a4b },
        Cedar:  { log: 0x5c4835, planks: 0x8a6f4d, leaves: 0x2e6a2f, sapling: 0x3c7a3b, barkless: 0x8a6f4d },
        Aspen:  { log: 0x9a8c76, planks: 0xd1c08b, leaves: 0x7bb34a, sapling: 0x7bb34a, barkless: 0xd1c08b },
        Elm:    { log: 0x7a5a3c, planks: 0xa38054, leaves: 0x48893a, sapling: 0x48893a, barkless: 0xa38054 },
        Cherry: { log: 0xb49070, planks: 0xe0baa6, leaves: 0x8e3a4f, sapling: 0x8e3a4f, barkless: 0xe0baa6 },
        Palm:   { log: 0x786044, planks: 0x9d835b, leaves: 0x40893c, sapling: 0x40893c, barkless: 0x9d835b, coconut: 0x6b4a2c },
        Pear:   { log: 0x765c42, planks: 0xa78765, leaves: 0x4e8d3d, sapling: 0x4e8d3d, barkless: 0xa78765, fruit: 0x9cb74a },
    };

    // Couleurs minerais / métaux / gemmes
    const METAL = {
        Stone:          0x808080,
        'Smooth Stone': 0x9a9a9a,
        Diorite:        0xdcdcdc,
        Andesite:       0x86847f,
        Granite:        0x9b7c71,
        Sandstone:      0xddc98a,
        Yellowstone:    0xc3b070,
        Obsidian:       0x140d23,
        Bedrock:        0x2f2f34,
        Cobblestone:    0x757575,
        Mossy:          0x6b7a54,
        Cracked:        0x777777,
        Bricks:         0x934b42,
        'Stone Bricks': 0x7f7f79,
        'Dark Red Brick': 0x602924,
        'Dark Red Stone': 0x5a2222,
        Coal:           0x262628,
        Iron:           0xd4d4d4,
        Gold:           0xf3d04a,
        'Lapis Lazuli': 0x2a4fa0,
        Emerald:        0x3dd06b,
        Diamond:        0x63d8e8,
        Quartz:         0xf4efe4,
        Moonstone:      0x8ab8e0,
        Magma:          0xff6a1f,
        Water:          0x2a7bc0,
        Ice:            0xa8d6ee,
        Snow:           0xf5f9fc,
        Glass:          0xcfe8f5,
        Sponge:         0xd6b751,
        Beacon:         0xd8f1ff,
        Hay:            0xc8a841,
        Cactus:         0x3f803a,
        Grass:          0x5aa03a,
        Dirt:           0x6e4b2a,
        Sand:           0xe6d797,
        Clay:           0xa2aaa8,
        Gravel:         0x888888,
        Chalk:          0xf8f8f0,
        Lava:           0xff5522,
        Redstone:       0xaa1c1c,
    };

    // Couleurs fleurs/plantes
    const FLORA = {
        Dandelion:    0xfde04c,
        Poppy:        0xd83030,
        Tulip:        0xe85a7a,
        Daisy:        0xf2f2f2,
        Bluebell:     0x4461d6,
        Allium:       0x9c63c8,
        'Azure Bluet':0xdbe6ff,
        'Lily of the Valley': 0xffffff,
        'Wither Rose':0x2a1a1a,
        Roses:        0xc2282b,
        Flower:       0xff76a6,
        Sapling:      0x5e9d46,
        Leaves:       0x3e8a3a,
        Vines:        0x3c7c36,
    };

    // Couleur des fleurs/feuilles par la couleur du mot clé
    const FLOWER_BY_COLOR = {
        red: 0xd93c3c, orange: 0xe27d2e, yellow: 0xeacb3d, lime: 0x83c92c,
        green: 0x3e9030, cyan: 0x3fb8b3, 'light blue': 0x5aaee0, blue: 0x3e5bc4,
        purple: 0x8b4fc8, magenta: 0xc54fb6, pink: 0xea8ba6, white: 0xf5f5f5,
        gray: 0x8a8a8a, 'light gray': 0xbfbfbf, black: 0x202028, brown: 0x8a5f3a
    };

    // Helpers couleur ----------------------------------------------------
    function hexToRgb(h) {
        return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
    }
    function rgbToHex(r, g, b) {
        return ((clamp(r) << 16) | (clamp(g) << 8) | clamp(b)) >>> 0;
    }
    function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
    function multiply(h, f) {
        const [r,g,b] = hexToRgb(h);
        const [fr,fg,fb] = (typeof f === 'number') ? [f,f,f] : f;
        return rgbToHex(r*fr, g*fg, b*fb);
    }
    function mix(h1, h2, t=0.5) {
        const a = hexToRgb(h1), b = hexToRgb(h2);
        return rgbToHex(a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t);
    }

    // Appliquer une teinte nommée à un matériau.
    function colored(hueName, material) {
        let base = HUE[hueName] !== undefined ? HUE[hueName] : 0x909090;
        if (material) {
            const adj = MATERIAL_ADJUST[material];
            if (adj) {
                // Pour les planches : teinter vers brun-bois
                if (material === 'planks') base = mix(base, 0x7a5a3a, 0.55);
                else if (material === 'baked clay') base = mix(base, 0x9b6f50, 0.35);
                else base = multiply(base, adj);
            }
        }
        return base;
    }

    // Table explicite : id -> hex (les plus courants)
    const EXPLICIT = {
        0: 0x000000,    // Air (transparent, mais couleur "none")
        1: 0x1a1a22,    // Unloaded
        2: METAL.Dirt,
        3: multiply(METAL.Dirt, 0.92),    // Messy Dirt
        4: 0x4da64d,    // Grass Block
        5: METAL.Sand,
        6: METAL.Clay,
        7: METAL.Gravel,
        8: METAL.Snow,
        28: METAL.Stone,
        29: multiply(METAL.Stone, 0.88),
        30: 0xff00ff,   // placeholder (magenta vif pour le repérer)
        31: METAL['Smooth Stone'],
        32: METAL.Diorite,
        33: multiply(METAL.Diorite, 0.98),
        34: METAL.Andesite,
        35: multiply(METAL.Andesite, 0.97),
        36: METAL.Granite,
        37: multiply(METAL.Granite, 0.98),
        38: METAL.Sandstone,
        39: METAL.Yellowstone,
        40: 0x2e2e32,   // Coal Ore (stone+coal)
        41: 0x96938f,   // Iron Ore
        42: 0x9e8e6a,   // Gold Ore
        43: 0x4b638b,   // Lapis Ore
        44: 0x4f7c56,   // Emerald Ore
        45: 0x788f94,   // Diamond Ore
        46: METAL.Coal,
        47: METAL.Iron,
        48: METAL.Gold,
        49: METAL['Lapis Lazuli'],
        50: METAL.Emerald,
        126: METAL.Water,
        127: 0x3a3a44,  // Invisible solid (gris transparent-ish)
        128: METAL.Bricks,
        129: METAL['Stone Bricks'],
        130: METAL['Dark Red Brick'],
        131: METAL['Dark Red Stone'],
        132: METAL.Quartz,
        133: multiply(METAL.Quartz, 0.95),
        134: multiply(METAL['Smooth Stone'], 0.97), // Engraved Stone
        135: METAL.Mossy,
        136: METAL.Cracked,
        137: multiply(METAL.Sandstone, 1.02),
        138: multiply(METAL.Sandstone, 1.0),
        139: METAL.Ice,
        140: METAL.Obsidian,
        141: METAL.Hay,
        142: METAL.Sponge,
        143: METAL.Beacon,
        145: METAL.Gold,
        146: METAL.Moonstone,
        147: METAL.Bedrock,
        149: METAL.Cactus,
        150: FLORA.Grass,
        223: multiply(METAL.Dirt, 0.95),  // Dirt|GrassRoots
        471: METAL.Magma,
        475: multiply(METAL.Sandstone, 0.90), // Smooth Red Sandstone
        650: 0xc35a3c,                       // Red Sand
        1222: WOOD.Cherry.log,               // Cherry Log
    };

    // Ordre exact des couleurs pour chaque gamme (basé sur nameToId.json)
    const HUE_ORDER_WOOL     = ['White','Orange','Magenta','Light Blue','Yellow','Lime','Pink','Gray','Light Gray','Cyan','Purple','Blue','Brown','Green','Red','Black'];
    const HUE_ORDER_CONCRETE = ['Gray','Light Gray','Black','Blue','Brown','Cyan','Light Blue','Lime','Magenta','Orange','Pink','Purple','Red','White','Green','Yellow'];
    const HUE_ORDER_GLASS    = ['Black','Blue','Brown','Cyan','Gray','Light Gray','Green','Light Blue','Lime','Magenta','Orange','Pink','Purple','Red','White','Yellow']; // 107..122
    const HUE_ORDER_PLANKS   = ['White','Orange','Magenta','Light Blue','Yellow','Lime','Pink','Gray','Light Gray','Cyan','Purple','Blue','Brown','Green','Red','Black'];
    const HUE_ORDER_CLAY     = ['White','Orange','Magenta','Light Blue','Yellow','Lime','Pink','Gray','Light Gray','Cyan','Purple','Blue','Brown','Green','Red','Black']; // 68..83
    const HUE_ORDER_CERAMIC  = ['White','Orange','Magenta','Light Blue','Yellow','Lime','Pink','Gray','Light Gray','Cyan','Purple','Blue','Brown','Green','Red','Black']; // 245..308 (16 teintes × 4 rot, ordre WOOL)

    // Blocs de base (laines / terres cuites / betons / verres / planches)
    let id;
    // 51..66 Wools (16)
    id = 51; HUE_ORDER_WOOL.forEach(h => { EXPLICIT[id++] = colored(h, 'wool'); });
    // 67 Baked Clay par défaut (terracotta brute) + 68..83 colored baked clay
    EXPLICIT[67] = 0xa0664b;
    id = 68; HUE_ORDER_CLAY.forEach(h => { EXPLICIT[id++] = colored(h, 'baked clay'); });
    // 84..99 Concrete (16)
    id = 84; HUE_ORDER_CONCRETE.forEach(h => { EXPLICIT[id++] = colored(h, 'concrete'); });
    // 100..103 Leaves
    EXPLICIT[100] = WOOD.Pine.leaves;
    EXPLICIT[101] = WOOD.Aspen.leaves;
    EXPLICIT[102] = WOOD.Maple.leaves;
    EXPLICIT[103] = WOOD.Elm.leaves;
    // 106 Glass (transparent générique)
    EXPLICIT[106] = METAL.Glass;
    // 107..122 Verres colorés (16)
    id = 107; HUE_ORDER_GLASS.forEach(h => { EXPLICIT[id++] = multiply(colored(h, 'glass'), 0.85); });
    // 123 unused / placeholder
    EXPLICIT[123] = 0xff00ff;
    // 124/125 lamps
    EXPLICIT[124] = 0xffe680;
    EXPLICIT[125] = 0xc8a74c;
    // 228..243 Planks colorées (16)
    id = 228; HUE_ORDER_PLANKS.forEach(h => { EXPLICIT[id++] = colored(h, 'planks'); });
    // 245..308 Céramiques colorées (16 teintes × 4 rotations = 64)
    id = 245;
    for (let r = 0; r < 4; r++) {
        HUE_ORDER_CERAMIC.forEach(h => { EXPLICIT[id++] = colored(h, 'ceramic'); });
    }

    // Essences de bois : chaque essence a log/planks/leaves/sapling/barkless,
    // chaque décliné en plusieurs metas (rot, base, canopy, etc.). On va les
    // remplir en parcourant le nameToId.
    // (On s'appuie sur le nom pour retrouver l'ID ; on construit à la volée
    // dans fillDynamic en lisant nameToId.json embarqué.)

    /* ------------- Fallback par analyse de nom ------------- */

    function findHueInName(lowerName) {
        if (/\bwhite\b/.test(lowerName)) return 'White';
        if (/\borange\b/.test(lowerName)) return 'Orange';
        if (/\bmagenta\b/.test(lowerName)) return 'Magenta';
        if (/\blight blue\b/.test(lowerName)) return 'Light Blue';
        if (/\byellow\b/.test(lowerName)) return 'Yellow';
        if (/\blime\b/.test(lowerName)) return 'Lime';
        if (/\bpink\b/.test(lowerName)) return 'Pink';
        if (/\blight gray\b/.test(lowerName)) return 'Light Gray';
        if (/\bgray\b/.test(lowerName)) return 'Gray';
        if (/\bcyan\b/.test(lowerName)) return 'Cyan';
        if (/\bpurple\b/.test(lowerName)) return 'Purple';
        if (/\bblue\b/.test(lowerName)) return 'Blue';
        if (/\bbrown\b/.test(lowerName)) return 'Brown';
        if (/\bgreen\b/.test(lowerName)) return 'Green';
        if (/\bred\b/.test(lowerName)) return 'Red';
        if (/\bblack\b/.test(lowerName)) return 'Black';
        return null;
    }

    function materialFromName(lower) {
        if (/\bwool\b/.test(lower)) return 'wool';
        if (/\bconcrete\b/.test(lower)) return 'concrete';
        if (/\bplanks?\b/.test(lower)) return 'planks';
        if (/\bbaked clay\b|\bterracotta\b/.test(lower)) return 'baked clay';
        if (/\bclay\b/.test(lower)) return 'clay';
        if (/\b(glass|pane)\b/.test(lower)) return 'glass';
        if (/\bceramic\b/.test(lower)) return 'ceramic';
        if (/\btile(s|d)?\b/.test(lower)) return 'tile';
        return null;
    }

    function woodFromName(lower) {
        for (const key of Object.keys(WOOD)) {
            const re = new RegExp(`\\b${key.toLowerCase()}\\b`);
            if (re.test(lower)) return { name: key, palette: WOOD[key] };
        }
        return null;
    }

    // Assignations spécifiques par mot-clé
    function fallbackColor(name) {
        const lower = name.toLowerCase();

        // Air/invisible/worldedit ghost
        if (/^air\b|\bair\b/.test(lower) && !/plane/.test(lower)) return 0x000000;
        if (/unloaded|placeholder|free_placeholder|unused|invisible|worldedit-ghost/i.test(lower)) return 0x20202a;

        // Bois
        const w = woodFromName(lower);
        if (w) {
            if (/\blog\b/.test(lower)) return w.palette.log;
            if (/barkless/.test(lower)) return w.palette.barkless;
            if (/\bplanks?\b/.test(lower)) return w.palette.planks;
            if (/\bleaves?\b|canopy|hedge/.test(lower)) return w.palette.leaves;
            if (/sapling/.test(lower)) return w.palette.sapling;
            if (/door|trapdoor|ladder|fence|gate|stairs|slab|button|plate|sign/.test(lower)) return multiply(w.palette.planks, 0.92);
            if (/coconut/.test(lower)) return w.palette.coconut || 0x6b4a2c;
            return w.palette.log;
        }

        // Fleurs / plantes
        if (/dandelion/.test(lower)) return FLORA.Dandelion;
        if (/poppy|tulip|daisy|bluebell|allium|bluet|lily|rose|flower/.test(lower)) {
            const hue = findHueInName(lower);
            if (hue && FLOWER_BY_COLOR[hue.toLowerCase()]) return FLOWER_BY_COLOR[hue.toLowerCase()];
            if (/poppy|rose|red/.test(lower)) return FLORA.Poppy;
            if (/tulip|pink/.test(lower)) return FLORA.Tulip;
            if (/daisy|white/.test(lower)) return FLORA.Daisy;
            if (/bluebell|blue/.test(lower)) return FLORA.Bluebell;
            if (/allium|purple/.test(lower)) return FLORA.Allium;
            if (/dandelion|yellow/.test(lower)) return FLORA.Dandelion;
            return FLORA.Flower;
        }
        if (/sapling|vine|leaves|leaves|hedge|bush|grass/.test(lower)) return 0x3f8a37;
        if (/cactus|fat cactus|dry fat cactus/.test(lower)) return 0x3e8139;
        if (/pumpkin|jack/.test(lower)) return 0xd07a1f;
        if (/watermelon|melon/.test(lower)) return 0x3c9a3e;

        // Pierres
        if (/smooth stone/.test(lower)) return METAL['Smooth Stone'];
        if (/stone brick/.test(lower)) return METAL['Stone Bricks'];
        if (/dark red brick/.test(lower)) return METAL['Dark Red Brick'];
        if (/dark red stone/.test(lower)) return METAL['Dark Red Stone'];
        if (/cobble|rocky/.test(lower)) return METAL.Cobblestone;
        if (/mossy/.test(lower)) return METAL.Mossy;
        if (/cracked/.test(lower)) return METAL.Cracked;
        if (/diorite/.test(lower)) return METAL.Diorite;
        if (/andesite/.test(lower)) return METAL.Andesite;
        if (/granite/.test(lower)) return METAL.Granite;
        if (/sandstone/.test(lower)) return METAL.Sandstone;
        if (/yellowstone/.test(lower)) return METAL.Yellowstone;
        if (/obsidian|obby/.test(lower)) return METAL.Obsidian;
        if (/bedrock/.test(lower)) return METAL.Bedrock;
        if (/brick/.test(lower)) return METAL.Bricks;
        if (/stone/.test(lower)) return METAL.Stone;
        if (/engraved|marked|patterned|chiseled/.test(lower)) return multiply(METAL['Smooth Stone'], 0.95);

        // Minerais / blocs de métal
        if (/lapis/.test(lower)) return METAL['Lapis Lazuli'];
        if (/emerald/.test(lower)) return METAL.Emerald;
        if (/diamond/.test(lower)) return METAL.Diamond;
        if (/redstone/.test(lower)) return METAL.Redstone;
        if (/coal/.test(lower)) return METAL.Coal;
        if (/golden|gold/.test(lower)) return METAL.Gold;
        if (/iron/.test(lower)) return METAL.Iron;
        if (/moonstone/.test(lower)) return METAL.Moonstone;
        if (/quartz/.test(lower)) return METAL.Quartz;
        if (/magma|lava|volcano/.test(lower)) return METAL.Magma;

        // Eau / glace / neige
        if (/water/.test(lower)) return METAL.Water;
        if (/ice/.test(lower)) return METAL.Ice;
        if (/snow|packed/.test(lower)) return METAL.Snow;
        if (/glass|pane/.test(lower)) return METAL.Glass;
        if (/sponge/.test(lower)) return METAL.Sponge;
        if (/beacon/.test(lower)) return METAL.Beacon;
        if (/hay|straw|wheat|corn|rice|cotton|cranberr/.test(lower)) return 0xc3a041;
        if (/tilled|farmland|dirt|mud/.test(lower)) return METAL.Dirt;
        if (/sand|beach/.test(lower)) return METAL.Sand;
        if (/red sand/.test(lower)) return 0xc55c3e;
        if (/clay/.test(lower)) return METAL.Clay;
        if (/gravel|pebble/.test(lower)) return METAL.Gravel;
        if (/chalk/.test(lower)) return 0xf5f5ef;

        // Lampes
        if (/lamp.*on|torch|glowstone|lantern|lit/.test(lower)) return 0xffd672;
        if (/lamp.*off/.test(lower)) return 0x806d40;

        // Nourriture / buvable
        if (/bread|cornbread|steak|apple|cooked|melon|coconut|chili|bowl|potion|milk|mushroom/.test(lower)) {
            if (/bread/.test(lower)) return 0xd9ab5c;
            if (/steak/.test(lower)) return 0x8f4a35;
            if (/apple|cranberr/.test(lower)) return 0xc43232;
            if (/mushroom/.test(lower)) return 0xa04747;
            if (/bowl|soup/.test(lower)) return 0x945a38;
            if (/milk/.test(lower)) return 0xf4f4f4;
            if (/chili|pepper/.test(lower)) return 0xd83b2b;
            return 0xd09b5f;
        }
        if (/potion/.test(lower)) {
            const h = findHueInName(lower);
            if (h && FLOWER_BY_COLOR[h.toLowerCase()]) return FLOWER_BY_COLOR[h.toLowerCase()];
            return 0x60c0f0;
        }

        // Armes / véhicules / internes (gris métal)
        if (/ak-47|m16|mp40|tar-21|m1911|awp|minigun|rocket|rpg|grenade|grenad|fireball|iceball|snowball|kart|boat|shears|shield|bouncy|updraft|snowdash/.test(lower)) {
            if (/fireball|lava/.test(lower)) return 0xff6a1f;
            if (/iceball|ice/.test(lower)) return 0x94d6ee;
            if (/snowball|snow/.test(lower)) return 0xf0f4ff;
            return 0x757c82;
        }

        // Mob/entités colorées (teinte par nom)
        if (/pig/i.test(lower)) return 0xef9ab3;
        if (/cow/i.test(lower)) return 0x553c2d;
        if (/sheep/i.test(lower)) return 0xe6e1d6;
        if (/chicken|hen/i.test(lower)) return 0xf0efe8;
        if (/zombie/i.test(lower)) return 0x2f7a49;
        if (/skeleton/i.test(lower)) return 0xe4e2cc;
        if (/creeper/i.test(lower)) return 0x4f9d3c;

        // Blocs fonctionnels (furnace, workbench, chest, protector, etc.)
        if (/furnace/.test(lower)) return 0x4a4a4a;
        if (/workbench|artisan/.test(lower)) return 0x8a5f3a;
        if (/chest|loot|crate/.test(lower)) return 0x9a6b3a;
        if (/protector/.test(lower)) return 0x6352ff;
        if (/compass|name tag|book|bookshelf/.test(lower)) return 0x8e5d32;
        if (/mailbox|board|sign/.test(lower)) return 0x866243;
        if (/board/.test(lower)) return 0x724f2f;

        // Couleur nommée générique + matériau
        const hue = findHueInName(lower);
        const mat = materialFromName(lower);
        if (hue) return colored(hue, mat);

        // Matériau sans couleur explicite
        if (mat === 'glass') return METAL.Glass;
        if (mat === 'planks') return 0xa0794b;
        if (mat === 'baked clay') return 0xa0664b;
        if (mat === 'concrete') return 0x8a8a8a;
        if (mat === 'wool') return 0xe0d8c8;
        if (mat === 'clay') return METAL.Clay;
        if (mat === 'ceramic') return 0xeeeeea;
        if (mat === 'tile') return 0xbbbbbb;

        // Dernier recours
        return 0xb08060;
    }

    // Initialiser le cache et les entrées dérivées du JSON de nom -> id
    let NAME_TO_ID = null;
    let CACHE = {};
    let initialized = false;

    function _nameForId(id) {
        if (initFromNameMap._inv) return initFromNameMap._inv[id];
        if (!NAME_TO_ID) return '';
        initFromNameMap._inv = {};
        for (const [n,i] of Object.entries(NAME_TO_ID)) initFromNameMap._inv[i] = n;
        return initFromNameMap._inv[id] || '';
    }

    function initFromNameMap(nameMap) {
        NAME_TO_ID = nameMap;
        // Reset inverse cache
        initFromNameMap._inv = null;

        // Pour chaque essence de bois, trouver les ids par leurs noms et les renseigner.
        for (const [wname, palette] of Object.entries(WOOD)) {
            const prefix = wname + ' ';
            const logName = prefix + 'Log';
            const plankName = prefix + 'Wood Planks';
            const leavesName = prefix + 'Leaves';
            const saplingName = prefix + 'Sapling';
            const barklessName = 'Barkless ' + wname + ' Log';
            if (nameMap[logName] !== undefined) EXPLICIT[nameMap[logName]] = palette.log;
            if (nameMap[plankName] !== undefined) EXPLICIT[nameMap[plankName]] = palette.planks;
            if (nameMap[leavesName] !== undefined) EXPLICIT[nameMap[leavesName]] = palette.leaves;
            if (nameMap[saplingName] !== undefined) EXPLICIT[nameMap[saplingName]] = palette.sapling;
            if (nameMap[barklessName] !== undefined) EXPLICIT[nameMap[barklessName]] = palette.barkless;
            if (nameMap[leavesName + '|TreeCanopy'] !== undefined) EXPLICIT[nameMap[leavesName + '|TreeCanopy']] = multiply(palette.leaves, 0.92);
            if (nameMap[logName + '|TreeBase|'+wname] !== undefined) EXPLICIT[nameMap[logName + '|TreeBase|'+wname]] = palette.log;
        }
        initialized = true;
    }

    function getBlockColor(id, nameHint) {
        if (EXPLICIT[id] !== undefined) return EXPLICIT[id];
        if (CACHE[id] !== undefined) return CACHE[id];
        // Si on a le nom, utiliser fallbackColor par nom
        let name = nameHint;
        if (!name && NAME_TO_ID) {
            // lookup inverse: assez coûteux -> construire inverse
            if (!initFromNameMap._inv) {
                initFromNameMap._inv = {};
                if (NAME_TO_ID) for (const [n,i] of Object.entries(NAME_TO_ID)) initFromNameMap._inv[i] = n;
            }
            name = initFromNameMap._inv[id];
        }
        const c = fallbackColor(name || ('block_'+id));
        CACHE[id] = c;
        return c;
    }

    global.BlockColors = {
        initFromNameMap,
        getBlockColor,
        _nameForId,
    };

})(window);
