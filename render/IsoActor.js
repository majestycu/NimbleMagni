window.IsoGeom = (function () {
    function diamond(ctx, x, y, hw, hh) {
        ctx.beginPath();
        ctx.moveTo(x, y - hh);
        ctx.lineTo(x + hw, y);
        ctx.lineTo(x, y + hh);
        ctx.lineTo(x - hw, y);
        ctx.closePath();
    }

    function prism(ctx, x, y, hw, hh, z, faces) {
        const ty = y - z;
        const e = { x: x + hw, y: ty };
        const s = { x: x, y: ty + hh };
        const w = { x: x - hw, y: ty };
        const eb = { x: x + hw, y: y };
        const sb = { x: x, y: y + hh };
        const wb = { x: x - hw, y: y };

        ctx.beginPath();
        ctx.moveTo(w.x, w.y);
        ctx.lineTo(s.x, s.y);
        ctx.lineTo(sb.x, sb.y);
        ctx.lineTo(wb.x, wb.y);
        ctx.closePath();
        ctx.fillStyle = faces.left;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(s.x, s.y);
        ctx.lineTo(sb.x, sb.y);
        ctx.lineTo(eb.x, eb.y);
        ctx.closePath();
        ctx.fillStyle = faces.right;
        ctx.fill();

        diamond(ctx, x, ty, hw, hh);
        ctx.fillStyle = faces.top;
        ctx.fill();
        if (faces.edge) {
            ctx.strokeStyle = faces.edge;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    return { diamond, prism };
})();

window.IsoActor = (function () {
    const G = window.IsoGeom;
    const FOOT_HW = 14;
    const FOOT_HH = 7;
    const BODY_Z = 20;
    const HEAD_Z = 9;
    const LEG_Z = 9;
    const HEIGHT = LEG_Z + BODY_Z + HEAD_Z;

    const HERO_PAL = {
        WARRIOR: { top: '#8b9099', left: '#4b5563', right: '#6b7280', skin: '#c4a574', accent: '#7f1d1d', weapon: '#d6d3d1' },
        PALADIN: { top: '#e7e5e4', left: '#a8a29e', right: '#d6d3d1', skin: '#e7d3a8', accent: '#ca8a04', weapon: '#facc15' },
        ROGUE: { top: '#4d7c0f', left: '#365314', right: '#3f6212', skin: '#c4a574', accent: '#86efac', weapon: '#a3e635' },
        MAGE: { top: '#1d4ed8', left: '#1e3a5f', right: '#2563eb', skin: '#e8d5b5', accent: '#38bdf8', weapon: '#7dd3fc' },
        NECROMANCER: { top: '#5b21b6', left: '#2e1065', right: '#4c1d95', skin: '#a8a29e', accent: '#86efac', weapon: '#c4b5fd' },
        DRUID: { top: '#854d0e', left: '#3f2e1c', right: '#78350f', skin: '#b45309', accent: '#4ade80', weapon: '#365314' }
    };
    const FOE_PAL = {
        rotwalker: { top: '#6b7c54', left: '#3f4a38', right: '#4d5a42', skin: '#8a9a6a', accent: '#4d7c0f', weapon: '#44403c' },
        hedge_imp: { top: '#b91c1c', left: '#7f1d1d', right: '#991b1b', skin: '#9a3412', accent: '#f97316', weapon: '#78716c' },
        bramble_rat: { top: '#a8a29e', left: '#57534e', right: '#78716c', skin: '#d6d3d1', accent: '#a3a3a3', weapon: '#737373' },
        fen_chanter: { top: '#7c3aed', left: '#3b0764', right: '#5b21b6', skin: '#a78bfa', accent: '#c084fc', weapon: '#6b21a8' },
        sand_scarab: { top: '#d97706', left: '#92400e', right: '#b45309', skin: '#fbbf24', accent: '#f59e0b', weapon: '#78350f' },
        dust_jackal: { top: '#ca8a04', left: '#a16207', right: '#b45309', skin: '#fde68a', accent: '#facc15', weapon: '#a8a29e' },
        cinder_nomad: { top: '#ea580c', left: '#7c2d12', right: '#c2410c', skin: '#c4a574', accent: '#fb923c', weapon: '#44403c' },
        web_drone: { top: '#a1a1aa', left: '#3f3f46', right: '#71717a', skin: '#e4e4e7', accent: '#d4d4d8', weapon: '#71717a' },
        fang_spider: { top: '#16a34a', left: '#14532d', right: '#166534', skin: '#4ade80', accent: '#86efac', weapon: '#052e16' },
        temple_cultist: { top: '#a8a29e', left: '#44403c', right: '#57534e', skin: '#e7e5e4', accent: '#78716c', weapon: '#78716c' },
        ash_raider: { top: '#dc2626', left: '#7f1d1d', right: '#b91c1c', skin: '#c4a574', accent: '#f97316', weapon: '#a8a29e' },
        council_acolyte: { top: '#8b5cf6', left: '#4c1d95', right: '#6d28d9', skin: '#ddd6fe', accent: '#c084fc', weapon: '#6b21a8' },
        horn_brute: { top: '#a8a29e', left: '#44403c', right: '#57534e', skin: '#d6d3d1', accent: '#78716c', weapon: '#d6d3d1' },
        ember_hound: { top: '#f97316', left: '#7c2d12', right: '#ea580c', skin: '#fdba74', accent: '#facc15', weapon: '#9a3412' },
        void_thrall: { top: '#6366f1', left: '#1e1b4b', right: '#312e81', skin: '#818cf8', accent: '#a5b4fc', weapon: '#312e81' },
        keep_sentinel: { top: '#a8a29e', left: '#292524', right: '#44403c', skin: '#d6d3d1', accent: '#f59e0b', weapon: '#78716c' },
        crypt_warden: { top: '#a8a29e', left: '#1c1917', right: '#44403c', skin: '#d6d3d1', accent: '#ca8a04', weapon: '#d6d3d1' },
        dune_hollow: { top: '#f59e0b', left: '#78350f', right: '#b45309', skin: '#fbbf24', accent: '#fde68a', weapon: '#92400e' },
        venom_matron: { top: '#22c55e', left: '#14532d', right: '#166534', skin: '#86efac', accent: '#bbf7d0', weapon: '#166534' },
        hall_cleaver: { top: '#ef4444', left: '#7f1d1d', right: '#b91c1c', skin: '#e7d3a8', accent: '#fca5a5', weapon: '#d6d3d1' },
        council_shade: { top: '#a78bfa', left: '#2e1065', right: '#5b21b6', skin: '#c4b5fd', accent: '#ddd6fe', weapon: '#6d28d9' },
        ash_sovereign: { top: '#f97316', left: '#1c1917', right: '#7c2d12', skin: '#fb923c', accent: '#facc15', weapon: '#ea580c' },
        last_ember: { top: '#facc15', left: '#450a0a', right: '#7c2d12', skin: '#f97316', accent: '#fde047', weapon: '#7c2d12' },
        default: { top: '#78716c', left: '#292524', right: '#44403c', skin: '#a8a29e', accent: '#a8a29e', weapon: '#57534e' }
    };

    function palForHero(type) {
        return HERO_PAL[(type || '').toUpperCase()] || HERO_PAL.WARRIOR;
    }
    function palForFoe(type) {
        return FOE_PAL[type] || FOE_PAL.default;
    }

    function shade(hex, amt) {
        const n = parseInt((hex || '#888888').slice(1), 16);
        const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
        const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
        const b = Math.max(0, Math.min(255, (n & 255) + amt));
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function faces(top, left, right) {
        return { top, left, right, edge: 'rgba(0,0,0,0.35)' };
    }

    function kitOf(type, isHero) {
        const t = (type || '').toUpperCase();
        if (!isHero) return 'spear';
        if (t === 'PALADIN') return 'shield';
        if (t === 'ROGUE') return 'bow';
        if (t === 'MAGE' || t === 'DRUID') return 'staff';
        if (t === 'NECROMANCER') return 'scythe';
        return 'sword';
    }

    function drawWeapon(ctx, x, y, pal, kit, flip, phase) {
        const swing = Math.sin(phase * 10) * 2;
        const sx = x + flip * 14;
        if (kit === 'shield') {
            G.prism(ctx, x - flip * 12, y - LEG_Z - 4, 6, 4, 12, faces(pal.accent, shade(pal.left, -20), shade(pal.right, -10)));
            G.prism(ctx, sx, y - LEG_Z - 2, 3, 2, 14, faces(pal.weapon, shade(pal.weapon, -40), shade(pal.weapon, -20)));
            return;
        }
        if (kit === 'bow') {
            ctx.save();
            ctx.strokeStyle = pal.weapon;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, y - LEG_Z - 8, 10, -1.2, 1.2);
            ctx.stroke();
            ctx.restore();
            return;
        }
        if (kit === 'staff') {
            G.prism(ctx, sx, y + 2, 2.2, 1.2, 28, faces(pal.weapon, shade(pal.accent, -30), pal.accent));
            G.prism(ctx, sx, y - 26, 4, 2, 5, faces(pal.accent, shade(pal.accent, -40), pal.weapon));
            return;
        }
        if (kit === 'scythe') {
            G.prism(ctx, sx, y + 2, 2, 1.2, 26, faces(pal.weapon, shade(pal.left, -20), pal.accent));
            G.prism(ctx, sx + flip * 6, y - 22, 8, 3, 3, faces(pal.accent, shade(pal.left, -10), pal.weapon));
            return;
        }
        G.prism(ctx, sx, y - LEG_Z + swing, 2.4, 1.4, 18, faces(pal.weapon, shade(pal.weapon, -50), shade(pal.weapon, -20)));
    }

    function drawUnit(ctx, x, y, pal, phase, flip, kit, opts) {
        const bob = Math.sin(phase * 8) * 1.1;
        const gy = y + bob;
        const stride = Math.sin(phase * 8) * 2.2;

        ctx.save();
        G.diamond(ctx, x, y + 2, FOOT_HW + 3, FOOT_HH + 1);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fill();

        if (opts && opts.elite) {
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1.5;
            G.diamond(ctx, x, y + 2, FOOT_HW + 6, FOOT_HH + 2);
            ctx.stroke();
        }
        if (opts && opts.leader) {
            ctx.strokeStyle = 'rgba(250,204,21,0.8)';
            ctx.lineWidth = 1.2;
            G.diamond(ctx, x, y + 2, FOOT_HW + 5, FOOT_HH + 2);
            ctx.stroke();
        }

        G.prism(ctx, x - 5, gy + stride * 0.15, 5, 3, LEG_Z, faces(shade(pal.top, -25), pal.left, pal.right));
        G.prism(ctx, x + 5, gy - stride * 0.15, 5, 3, LEG_Z, faces(shade(pal.top, -25), pal.left, pal.right));

        if (window.render8BitEntity && opts && opts.sprite) {
            ctx.save();
            ctx.translate(x, gy - 2);
            ctx.scale(flip, 1);
            window.render8BitEntity(ctx, 0, 0, opts.sprite);
            ctx.restore();
        } else {
            const torsoY = gy - LEG_Z;
            G.prism(ctx, x, torsoY, FOOT_HW, FOOT_HH, BODY_Z, faces(pal.top, pal.left, pal.right));
            const headY = torsoY - BODY_Z;
            G.prism(ctx, x, headY, 7, 4, HEAD_Z, faces(pal.skin, shade(pal.skin, -35), shade(pal.skin, -15)));
        }

        drawWeapon(ctx, x, gy, pal, kit, flip, phase);
        ctx.restore();
    }

    function hpBar(ctx, x, y, ratio, boss) {
        const bw = 22;
        const by = y - HEIGHT - 6;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(x - bw / 2 - 1, by - 1, bw + 2, 5);
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(x - bw / 2, by, bw, 3);
        ctx.fillStyle = boss ? '#facc15' : '#22c55e';
        ctx.fillRect(x - bw / 2, by, bw * Math.max(0, Math.min(1, ratio)), 3);
    }

    function facing(dir) {
        const d = (dir || 'DOWN').toString().toUpperCase();
        if (d === 'LEFT' || d === 'WEST') return -1;
        if (dir && typeof dir === 'object' && (dir.x || 0) < 0) return -1;
        return 1;
    }

    function drawHero(ctx, hero, isLeader) {
        const pal = palForHero(hero.type);
        drawUnit(
            ctx, hero.x, hero.y, pal,
            (window.gameTime || 0) + (hero.convoiIndex || 0) * 0.35,
            facing(hero.dir),
            kitOf(hero.type, true),
            { leader: isLeader, sprite: hero.type }
        );
        hpBar(ctx, hero.x, hero.y, (hero.hp || 1) / (hero.maxHp || 1), false);
    }

    function drawFoe(ctx, e) {
        const pal = palForFoe(e.sprite || e.type);
        const flip = (window.player && e.x < window.player.x) ? 1 : -1;
        drawUnit(
            ctx, e.x, e.y, pal,
            (window.gameTime || 0) * 0.85 + e.x * 0.01,
            flip,
            'spear',
            { elite: !!e.isElite, sprite: e.sprite || e.type }
        );
        hpBar(ctx, e.x, e.y, (e.hp || 1) / (e.maxHp || 1), !!e.boss);
        if (e.affix) {
            ctx.fillStyle = '#fde68a';
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(e.affix.toUpperCase(), e.x, e.y + 16);
        }
        if (e.displayName || e.boss) {
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(e.displayName || e.type, e.x, e.y - HEIGHT - 10);
        }
    }

    function drawLoot(ctx, x, y, kind) {
        const G = window.IsoGeom;
        if (!G) return;
        const pal = {
            BOOTS: { top: '#67e8f9', left: '#0e7490', right: '#06b6d4' },
            ATTACK_SPEED: { top: '#fca5a5', left: '#991b1b', right: '#ef4444' },
            HEART: { top: '#86efac', left: '#166534', right: '#22c55e' },
            MIGHTY_ORB: { top: '#e9d5ff', left: '#6b21a8', right: '#a855f7' },
            SKILL: { top: '#f9a8d4', left: '#9d174d', right: '#f472b6' },
            GEM: { top: '#a5f3fc', left: '#155e75', right: '#22d3ee' },
            CHEST: { top: '#fde047', left: '#854d0e', right: '#eab308' }
        }[kind] || { top: '#e7e5e4', left: '#44403c', right: '#a8a29e' };
        G.diamond(ctx, x, y + 3, 9, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fill();
        G.prism(ctx, x, y, kind === 'CHEST' ? 10 : 7, kind === 'CHEST' ? 5 : 3.5, kind === 'CHEST' ? 12 : 9, {
            top: pal.top, left: pal.left, right: pal.right, edge: 'rgba(0,0,0,0.45)'
        });
    }

    return { FOOT_HW, FOOT_HH, HEIGHT, drawHero, drawFoe, drawLoot };
})();
