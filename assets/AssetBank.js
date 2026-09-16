window.AssetManifest = {
    chroma: '#FF00FF',
    heroes: {
        WARRIOR: 'assets/heroes/warrior.png',
        PALADIN: 'assets/heroes/paladin.png',
        ROGUE: 'assets/heroes/rogue.png',
        MAGE: 'assets/heroes/mage.png',
        NECROMANCER: 'assets/heroes/necromancer.png',
        DRUID: 'assets/heroes/druid.png'
    },
    tiles: {
        wilds: 'assets/tiles/act1_wilds.png',
        desert: 'assets/tiles/act2_desert.png',
        jungle: 'assets/tiles/act3_temple.png',
        highlands: 'assets/tiles/act4_highlands.png',
        fortress: 'assets/tiles/act5_keep.png'
    },
    props: {
        sheet: 'assets/props/iso_sheet.png'
    },
    vfx: {
        chainlightning: 'assets/vfx/chain_lightning.png',
        meteor: 'assets/vfx/meteor.png',
        blizzard: 'assets/vfx/blizzard.png',
        bloodwave: 'assets/vfx/blood_wave.png',
        whirlwind: 'assets/vfx/whirlwind.png',
        hurricane: 'assets/vfx/hurricane.png'
    },
    foes: {
        rotwalker: 'assets/foes/rotwalker.png',
        hedge_imp: 'assets/foes/rotwalker.png',
        bramble_rat: 'assets/foes/rotwalker.png',
        fen_chanter: 'assets/foes/council_shade.png',
        sand_scarab: 'assets/foes/dune_hollow.png',
        dust_jackal: 'assets/foes/rotwalker.png',
        cinder_nomad: 'assets/foes/council_shade.png',
        web_drone: 'assets/foes/venom_matron.png',
        fang_spider: 'assets/foes/venom_matron.png',
        temple_cultist: 'assets/foes/council_shade.png',
        ash_raider: 'assets/foes/hall_cleaver.png',
        council_acolyte: 'assets/foes/council_shade.png',
        horn_brute: 'assets/foes/hall_cleaver.png',
        ember_hound: 'assets/foes/rotwalker.png',
        void_thrall: 'assets/foes/council_shade.png',
        keep_sentinel: 'assets/foes/hall_cleaver.png',
        crypt_warden: 'assets/foes/crypt_warden.png',
        dune_hollow: 'assets/foes/dune_hollow.png',
        venom_matron: 'assets/foes/venom_matron.png',
        hall_cleaver: 'assets/foes/hall_cleaver.png',
        council_shade: 'assets/foes/council_shade.png',
        ash_sovereign: 'assets/foes/ash_sovereign.png',
        last_ember: 'assets/foes/last_ember.png'
    }
};

window.AssetBank = (function () {
    const cache = new Map();

    function loadImage(src) {
        if (cache.has(src)) return cache.get(src);
        const img = new Image();
        img.src = src;
        cache.set(src, img);
        return img;
    }

    function keyedCanvas(img) {
        if (!img || !img.complete || !img.naturalWidth) return null;
        if (img._keyed) return img._keyed;
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        const data = g.getImageData(0, 0, c.width, c.height);
        const px = data.data;
        for (let i = 0; i < px.length; i += 4) {
            const r = px[i];
            const gb = px[i + 1];
            const b = px[i + 2];
            if (r > 230 && gb < 40 && b > 230) {
                px[i + 3] = 0;
            }
        }
        g.putImageData(data, 0, 0);
        img._keyed = c;
        return c;
    }

    function preload() {
        const m = window.AssetManifest;
        Object.values(m.heroes).forEach(loadImage);
        Object.values(m.tiles).forEach(loadImage);
        Object.values(m.props).forEach(loadImage);
        Object.values(m.vfx).forEach(loadImage);
        Object.values(m.foes).forEach(loadImage);
    }

    function get(group, key) {
        const src = window.AssetManifest[group] && window.AssetManifest[group][key];
        return src ? loadImage(src) : null;
    }

    function drawChroma(ctx, img, x, y, w, h) {
        const src = keyedCanvas(img);
        if (!src) return false;
        ctx.drawImage(src, x - w / 2, y - h / 2, w, h);
        return true;
    }

    function stamp(ctx, group, key, x, y, w, h) {
        return drawChroma(ctx, get(group, key), x, y, w, h);
    }

    return { loadImage, preload, get, drawChroma, stamp };
})();
